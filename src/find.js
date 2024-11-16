import {inspect} from 'node:util';

import {colors, logWarn} from '#cli';
import {compareObjects, stitchArrays, typeAppearance} from '#sugar';
import thingConstructors from '#things';
import {isFunction, validateArrayItems} from '#validators';

function warnOrThrow(mode, message) {
  if (mode === 'error') {
    throw new Error(message);
  }

  if (mode === 'warn') {
    logWarn(message);
  }

  return null;
}

export const keyRefRegex =
  new RegExp(String.raw`^(?:(?<key>[a-z-]*):(?=\S))?(?<ref>.*)$`);

export function processAvailableMatchesByName(data, {
  include = _thing => true,

  getMatchableNames = thing =>
    (Object.hasOwn(thing, 'name')
      ? [thing.name]
      : []),

  results = Object.create(null),
  multipleNameMatches = Object.create(null),
}) {
  for (const thing of data) {
    if (!include(thing)) continue;

    for (const name of getMatchableNames(thing)) {
      if (typeof name !== 'string') {
        logWarn`Unexpected ${typeAppearance(name)} returned in names for ${inspect(thing)}`;
        continue;
      }

      const normalizedName = name.toLowerCase();

      if (normalizedName in results) {
        if (normalizedName in multipleNameMatches) {
          multipleNameMatches[normalizedName].push(thing);
        } else {
          multipleNameMatches[normalizedName] = [results[normalizedName], thing];
          results[normalizedName] = null;
        }
      } else {
        results[normalizedName] = thing;
      }
    }
  }

  return {results, multipleNameMatches};
}

export function processAvailableMatchesByDirectory(data, {
  include = _thing => true,

  getMatchableDirectories = thing =>
    (Object.hasOwn(thing, 'directory')
      ? [thing.directory]
      : [null]),

  results = Object.create(null),
}) {
  for (const thing of data) {
    if (!include(thing)) continue;

    for (const directory of getMatchableDirectories(thing)) {
      if (typeof directory !== 'string') {
        logWarn`Unexpected ${typeAppearance(directory)} returned in directories for ${inspect(thing)}`;
        continue;
      }

      results[directory] = thing;
    }
  }

  return {results};
}

export function processAllAvailableMatches(data, spec) {
  const {results: byName, multipleNameMatches} =
    processAvailableMatchesByName(data, spec);

  const {results: byDirectory} =
    processAvailableMatchesByDirectory(data, spec);

  return {byName, byDirectory, multipleNameMatches};
}

function oopsMultipleNameMatches(mode, {
  name,
  normalizedName,
  multipleNameMatches,
}) {
  return warnOrThrow(mode,
    `Multiple matches for reference "${name}". Please resolve:\n` +
    multipleNameMatches[normalizedName]
      .map(match => `- ${inspect(match)}\n`)
      .join('') +
    `Returning null for this reference.`);
}

export function prepareMatchByName(mode, {byName, multipleNameMatches}) {
  return (name) => {
    const normalizedName = name.toLowerCase();
    const match = byName[normalizedName];

    if (match) {
      return match;
    } else if (multipleNameMatches[normalizedName]) {
      return oopsMultipleNameMatches(mode, {
        name,
        normalizedName,
        multipleNameMatches,
      });
    } else {
      return null;
    }
  };
}

function oopsWrongReferenceType(mode, {
  referenceType,
  referenceTypes,
}) {
  return warnOrThrow(mode,
    `Reference starts with "${referenceType}:", expected ` +
    referenceTypes.map(type => `"${type}:"`).join(', '));
}

export function prepareMatchByDirectory(mode, {referenceTypes, byDirectory}) {
  return (referenceType, directory) => {
    if (!referenceTypes.includes(referenceType)) {
      return oopsWrongReferenceType(mode, {
        referenceType,
        referenceTypes,
      });
    }

    return byDirectory[directory];
  };
}

function matchHelper(fullRef, mode, {
  matchByDirectory = (_referenceType, _directory) => null,
  matchByName = (_name) => null,
}) {
  const regexMatch = fullRef.match(keyRefRegex);
  if (!regexMatch) {
    return warnOrThrow(mode,
      `Malformed link reference: "${fullRef}"`);
  }

  const {key: keyPart, ref: refPart} = regexMatch.groups;

  const match =
    (keyPart
      ? matchByDirectory(keyPart, refPart)
      : matchByName(refPart));

  if (match) {
    return match;
  } else {
    return warnOrThrow(mode,
      `Didn't match anything for ${colors.bright(fullRef)}`);
  }
}

function findHelper({
  referenceTypes,

  include = undefined,
  getMatchableNames = undefined,
  getMatchableDirectories = undefined,
}) {
  // Note: This cache explicitly *doesn't* support mutable data arrays. If the
  // data array is modified, make sure it's actually a new array object, not
  // the original, or the cache here will break and act as though the data
  // hasn't changed!
  const cache = new WeakMap();

  // The mode argument here may be 'warn', 'error', or 'quiet'. 'error' throws
  // errors for null matches (with details about the error), while 'warn' and
  // 'quiet' both return null, with 'warn' logging details directly to the
  // console.
  return (fullRef, data, {mode = 'warn'} = {}) => {
    if (!fullRef) return null;

    if (typeof fullRef !== 'string') {
      throw new TypeError(`Expected a string, got ${typeAppearance(fullRef)}`);
    }

    if (!data) {
      throw new TypeError(`Expected data to be present`);
    }

    let subcache = cache.get(data);
    if (!subcache) {
      subcache =
        processAllAvailableMatches(data, {
          include,
          getMatchableNames,
          getMatchableDirectories,
        });

      cache.set(data, subcache);
    }

    const {byDirectory, byName, multipleNameMatches} = subcache;

    return matchHelper(fullRef, mode, {
      matchByDirectory:
        prepareMatchByDirectory(mode, {
          referenceTypes,
          byDirectory,
        }),

      matchByName:
        prepareMatchByName(mode, {
          byName,
          multipleNameMatches,
        }),
    });
  };
}

const hardcodedFindSpecs = {
  // Listings aren't Thing objects, so this find spec isn't provided by any
  // Thing constructor.
  listing: {
    referenceTypes: ['listing'],
    bindTo: 'listingSpec',
  },
};

export function postprocessFindSpec(spec, {thingConstructor}) {
  const newSpec = {...spec};

  // Default behavior is to find only instances of the constructor.
  // This symbol field lets a spec opt out.
  if (spec[Symbol.for('Thing.findThisThingOnly')] !== false) {
    if (spec.include) {
      const oldInclude = spec.include;
      newSpec.include = thing =>
        thing instanceof thingConstructor &&
        oldInclude(thing);
    } else {
      newSpec.include = thing =>
        thing instanceof thingConstructor;
    }
  }

  return newSpec;
}

export function getAllFindSpecs() {
  try {
    thingConstructors;
  } catch (error) {
    throw new Error(`Thing constructors aren't ready yet, can't get all find specs`);
  }

  const findSpecs = {...hardcodedFindSpecs};

  for (const thingConstructor of Object.values(thingConstructors)) {
    const thingFindSpecs = thingConstructor[Symbol.for('Thing.findSpecs')];
    if (!thingFindSpecs) continue;

    for (const [key, spec] of Object.entries(thingFindSpecs)) {
      findSpecs[key] =
        postprocessFindSpec(spec, {
          thingConstructor,
        });
    }
  }

  return findSpecs;
}

export function findFindSpec(key) {
  if (Object.hasOwn(hardcodedFindSpecs, key)) {
    return hardcodedFindSpecs[key];
  }

  try {
    thingConstructors;
  } catch (error) {
    throw new Error(`Thing constructors aren't ready yet, can't check if "find.${key}" available`);
  }

  for (const thingConstructor of Object.values(thingConstructors)) {
    const thingFindSpecs = thingConstructor[Symbol.for('Thing.findSpecs')];
    if (!thingFindSpecs) continue;

    if (Object.hasOwn(thingFindSpecs, key)) {
      return postprocessFindSpec(thingFindSpecs[key], {
        thingConstructor,
      });
    }
  }

  throw new Error(`"find.${key}" isn't available`);
}

export const findTokenKey = Symbol.for('find.findTokenKey');
export const boundFindData = Symbol.for('find.boundFindData');
export const boundFindOptions = Symbol.for('find.boundFindOptions');

function findMixedHelper(config) {
  const
    keys = Object.keys(config),
    tokens = Object.values(config),
    specKeys = tokens.map(token => token[findTokenKey]),
    specs = specKeys.map(specKey => findFindSpec(specKey));

  const cache = new WeakMap();

  return (fullRef, data, {mode = 'warn'} = {}) => {
    if (!fullRef) return null;

    if (typeof fullRef !== 'string') {
      throw new TypeError(`Expected a string, got ${typeAppearance(fullRef)}`);
    }

    if (!data) {
      throw new TypeError(`Expected data to be present`);
    }

    let subcache = cache.get(data);
    if (!subcache) {
      const byName = Object.create(null);
      const multipleNameMatches = Object.create(null);

      for (const spec of specs) {
        processAvailableMatchesByName(data, {
          ...spec,

          results: byName,
          multipleNameMatches,
        });
      }

      const byDirectory =
        Object.fromEntries(
          stitchArrays({
            referenceType: keys,
            spec: specs,
          }).map(({referenceType, spec}) => [
              referenceType,
              processAvailableMatchesByDirectory(data, spec).results,
            ]));

      subcache = {byName, multipleNameMatches, byDirectory};
      cache.set(data, subcache);
    }

    const {byName, multipleNameMatches, byDirectory} = subcache;

    return matchHelper(fullRef, mode, {
      matchByDirectory: (referenceType, directory) => {
        if (!keys.includes(referenceType)) {
          return oopsWrongReferenceType(mode, {
            referenceType,
            referenceTypes: keys,
          });
        }

        return byDirectory[referenceType][directory];
      },

      matchByName:
        prepareMatchByName(mode, {
          byName,
          multipleNameMatches,
        }),
    });
  };
}

const findMixedStore = new Map();

export function findMixed(config) {
  for (const key of findMixedStore.keys()) {
    if (compareObjects(key, config)) {
      return findMixedStore.get(key);
    }
  }

  // Validate that this is a valid config to begin with - we can do this
  // before find specs are actually available.
  const tokens = Object.values(config);

  try {
    validateArrayItems(token => {
      isFunction(token);

      if (token[boundFindData])
        throw new Error(`find.mixed doesn't work with bindFind yet`);

      if (!token[findTokenKey])
        throw new Error(`missing findTokenKey, is this actually a find.thing token?`);

      return true;
    })(tokens);
  } catch (caughtError) {
    throw new Error(
      `Expected find.mixed mapping to include valid find.thing tokens only`,
      {cause: caughtError});
  }

  let behavior = (...args) => {
    // findMixedHelper will error if find specs aren't available yet,
    // canceling overwriting `behavior` here.
    return (behavior = findMixedHelper(config))(...args);
  };

  findMixedStore.set(config, (...args) => behavior(...args));
  return findMixedStore.get(config);
}

export default new Proxy({}, {
  get: (store, key) => {
    if (key === 'mixed') {
      return findMixed;
    }

    if (!Object.hasOwn(store, key)) {
      let behavior = (...args) => {
        // This will error if the find spec isn't available...
        const findSpec = findFindSpec(key);

        // ...or, if it is available, replace this function with the
        // ready-for-use find function made out of that find spec.
        return (behavior = findHelper(findSpec))(...args);
      };

      store[key] = (...args) => behavior(...args);
      store[key][findTokenKey] = key;
    }

    return store[key];
  },
});

// Handy utility function for binding the find.thing() functions to a complete
// wikiData object, optionally taking default options to provide to the find
// function. Note that this caches the arrays read from wikiData right when it's
// called, so if their values change, you'll have to continue with a fresh call
// to bindFind.
export function bindFind(wikiData, opts1) {
  const findSpecs = getAllFindSpecs();

  const boundFindFns = {};

  for (const [key, spec] of Object.entries(findSpecs)) {
    if (!spec.bindTo) continue;

    const findFn = findHelper(spec);
    const thingData = wikiData[spec.bindTo];

    boundFindFns[key] =
      (opts1
        ? (ref, opts2) =>
            (opts2
              ? findFn(ref, thingData, {...opts1, ...opts2})
              : findFn(ref, thingData, opts1))
        : (ref, opts2) =>
            (opts2
              ? findFn(ref, thingData, opts2)
              : findFn(ref, thingData)));

    boundFindFns[key][boundFindData] = thingData;
    boundFindFns[key][boundFindOptions] = opts1 ?? {};
  }

  boundFindFns.mixed = findMixed;

  return boundFindFns;
}
