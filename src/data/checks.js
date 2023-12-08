// checks.js - general validation and error/warning reporting for data objects

import {inspect as nodeInspect} from 'node:util';
import {colors, ENABLE_COLOR} from '#cli';

import CacheableObject from '#cacheable-object';
import {replacerSpec, parseInput} from '#replacer';
import {compareArrays, cut, cutStart, empty, getNestedProp, iterateMultiline}
  from '#sugar';
import {commentaryRegexCaseSensitive} from '#wiki-data';

import {
  annotateErrorWithIndex,
  conditionallySuppressError,
  decorateErrorWithIndex,
  filterAggregate,
  openAggregate,
  withAggregate,
} from '#aggregate';

function inspect(value, opts = {}) {
  return nodeInspect(value, {colors: ENABLE_COLOR, ...opts});
}

// Warn about problems to do with directories.
//
// * Duplicate directories: these are the unique identifier for referencable
//   data objects across the wiki, so duplicates introduce ambiguity where it
//   can't fit.
//
// * Missing directories: in almost all cases directories can be computed,
//   but in particularly brutal internal cases, it might not be possible, and
//   a thing's directory is just null. This leaves it unable to be referenced.
//
export function reportDirectoryErrors(wikiData, {
  getAllFindSpecs,
}) {
  const duplicateSets = [];
  const missingDirectoryThings = new Set();

  for (const findSpec of Object.values(getAllFindSpecs())) {
    if (!findSpec.bindTo) continue;

    const directoryPlaces = Object.create(null);
    const duplicateDirectories = new Set();

    const thingData = wikiData[findSpec.bindTo];
    if (!thingData) continue;

    for (const thing of thingData) {
      if (findSpec.include && !findSpec.include(thing)) {
        continue;
      }

      const directories =
        (findSpec.getMatchableDirectories
          ? findSpec.getMatchableDirectories(thing)
          : [thing.directory]);

      for (const directory of directories) {
        if (directory === null || directory === undefined) {
          missingDirectoryThings.add(thing);
          continue;
        }

        if (directory in directoryPlaces) {
          directoryPlaces[directory].push(thing);
          duplicateDirectories.add(directory);
        } else {
          directoryPlaces[directory] = [thing];
        }
      }
    }

    const sortedDuplicateDirectories =
      Array.from(duplicateDirectories)
        .sort((a, b) => {
          const aL = a.toLowerCase();
          const bL = b.toLowerCase();
          return aL < bL ? -1 : aL > bL ? 1 : 0;
        });

    for (const directory of sortedDuplicateDirectories) {
      const places = directoryPlaces[directory];
      duplicateSets.push({directory, places});
    }
  }

  // Multiple find functions may effectively have duplicates across the same
  // things. These only need to be reported once, because resolving one of them
  // will resolve the rest, so cut out duplicate sets before reporting.

  const seenDuplicateSets = new Map();
  const deduplicateDuplicateSets = [];

  iterateSets:
  for (const set of duplicateSets) {
    if (seenDuplicateSets.has(set.directory)) {
      const placeLists = seenDuplicateSets.get(set.directory);

      for (const places of placeLists) {
        // We're iterating globally over all duplicate directories, which may
        // span multiple kinds of things, but that isn't going to cause an
        // issue because we're comparing the contents by identity, anyway.
        // Two artists named Foodog aren't going to match two tracks named
        // Foodog.
        if (compareArrays(places, set.places, {checkOrder: false})) {
          continue iterateSets;
        }
      }

      placeLists.push(set.places);
    } else {
      seenDuplicateSets.set(set.directory, [set.places]);
    }

    deduplicateDuplicateSets.push(set);
  }

  withAggregate({message: `Directory errors detected`}, ({push}) => {
    for (const {directory, places} of deduplicateDuplicateSets) {
      push(new Error(
        `Duplicate directory ${colors.green(`"${directory}"`)}:\n` +
        places.map(thing => ` - ` + inspect(thing)).join('\n')));
    }

    if (!empty(missingDirectoryThings)) {
      push(new Error(
        `Couldn't figure out an implicit directory for:\n` +
        Array.from(missingDirectoryThings)
          .map(thing => `- ` + inspect(thing))
          .join('\n')));
    }
  });
}

function bindFindArtistOrAlias(boundFind) {
  return artistRef => {
    const alias = boundFind.artistAlias(artistRef, {mode: 'quiet'});
    if (alias) {
      // No need to check if the original exists here. Aliases are automatically
      // created from a field on the original, so the original certainly exists.
      const original = alias.aliasedArtist;
      throw new Error(`Reference ${colors.red(artistRef)} is to an alias, should be ${colors.green(original.name)}`);
    }

    return boundFind.artist(artistRef);
  };
}

function getFieldPropertyMessage(yamlDocumentSpec, property) {
  const {fields} = yamlDocumentSpec;

  const field =
    Object.entries(fields ?? {})
      .find(([field, fieldSpec]) => fieldSpec.property === property)
      ?.[0];

  const fieldPropertyMessage =
    (field
      ? ` in field ${colors.green(field)}`
      : ` in property ${colors.green(property)}`);

  return fieldPropertyMessage;
}

// Warn about references across data which don't match anything.  This involves
// using the find() functions on all references, setting it to 'error' mode, and
// collecting everything in a structured logged (which gets logged if there are
// any errors). At the same time, we remove errored references from the thing's
// data array.
export function filterReferenceErrors(wikiData, {
  find,
  bindFind,
}) {
  const referenceSpec = [
    ['characterData', {
      groupedCharacters: '_groupedCharacter',
    }],

    ['issueData', {
      publisher: 'publisher',
      coverArtworks: '_artwork',
      featuredStories: 'story',
    }],

    ['storyData', {
      artContribs: '_contrib',
      featuredCharacters: '_featuredCharacter',
      publisher: 'publisher',
      storyContribs: '_contrib',
    }],
  ];

  const boundFind = bindFind(wikiData, {mode: 'error'});
  const findArtistOrAlias = bindFindArtistOrAlias(boundFind);

  const aggregate = openAggregate({message: `Errors validating between-thing references in data`});
  for (const [thingDataProp, propSpec] of referenceSpec) {
    const thingData = getNestedProp(wikiData, thingDataProp);
    const things = Array.isArray(thingData) ? thingData : [thingData];
    aggregate.nest({message: `Reference errors in ${colors.green('wikiData.' + thingDataProp)}`}, ({nest}) => {
      for (const thing of things) {
        nest({message: `Reference errors in ${inspect(thing)}`}, ({nest, push, filter}) => {
          for (const [property, findFnKey] of Object.entries(propSpec)) {
            let value = CacheableObject.getUpdateValue(thing, property);
            let writeProperty = true;

            switch (findFnKey) {
              case '_artwork':
                if (value) {
                  value =
                    value.map(({artistContribs}) =>
                      artistContribs.map(({who}) => who));
                }

                writeProperty = false;
                break;

              case '_commentary':
                if (value) {
                  value =
                    Array.from(value.matchAll(commentaryRegexCaseSensitive))
                      .map(({groups}) => groups.artistReferences)
                      .map(text => text.split(',').map(text => text.trim()));
                }

                writeProperty = false;
                break;

              case '_contrib':
                // Don't write out contributions - these'll be filtered out
                // for content and data purposes automatically, and they're
                // handy to keep around when update values get checked for
                // art tags below. (Possibly no reference-related properties
                // need writing, humm...)
                writeProperty = false;
                break;

              case '_serieses':
                if (value) {
                  // Doesn't report on which series has the error, but...
                  value = value.flatMap(series => series.albums);
                }

                writeProperty = false;
                break;
            }

            if (value === undefined) {
              push(new TypeError(`Property ${colors.red(property)} isn't valid for ${colors.green(thing.constructor.name)}`));
              continue;
            }

            if (value === null) {
              continue;
            }

            let findFn;

            switch (findFnKey) {
              case '_artwork':
              case '_commentary':
                findFn = findArtistOrAlias;
                break;

              case '_contrib':
                findFn = contribRef => findArtistOrAlias(contribRef.artist);
                break;

              case '_featuredCharacter':
                findFn = ({who}) => boundFind.character(who);
                break;

              case '_groupedCharacter':
                findFn = ({character}) => boundFind.character(character);
                break;

              default:
                findFn = boundFind[findFnKey];
                break;
            }

            const suppress = fn => conditionallySuppressError(_error => {
              return false;
            }, fn);

            const fieldPropertyMessage =
              getFieldPropertyMessage(
                thing.constructor[Symbol.for('Thing.yamlDocumentSpec')],
                property);

            const findFnMessage =
              (findFnKey.startsWith('_')
                ? ``
                : ` (${colors.green('find.' + findFnKey)})`);

            const errorMessage =
              (Array.isArray(value)
                ? `Reference errors` + fieldPropertyMessage + findFnMessage
                : `Reference error` + fieldPropertyMessage + findFnMessage);

            let newPropertyValue = value;

            determineNewPropertyValue: {
              if (findFnKey === '_commentary' || findFnKey === '_artwork') {
                const message =
                  (findFnKey === '_commentary'
                    ? `Errors in entry's artist references`
                    : `Errors in artwork's artist references`);

                filter(
                  value, {message: errorMessage},
                  decorateErrorWithIndex(refs =>
                    (refs.length === 1
                      ? suppress(findFn)(refs[0])
                      : filterAggregate(
                          refs, {message},
                          decorateErrorWithIndex(suppress(findFn)))
                            .aggregate
                            .close())));

                // Commentary doesn't write a property value, so no need to set
                // anything on `newPropertyValue`.
                break determineNewPropertyValue;
              }

              if (Array.isArray(value)) {
                newPropertyValue = filter(
                  value, {message: errorMessage},
                  decorateErrorWithIndex(suppress(findFn)));
                break determineNewPropertyValue;
              }

              nest({message: errorMessage},
                suppress(({call}) => {
                  try {
                    call(findFn, value);
                  } catch (error) {
                    newPropertyValue = null;
                    throw error;
                  }
                }));
            }

            if (writeProperty) {
              thing[property] = newPropertyValue;
            }
          }
        });
      }
    });
  }

  return aggregate;
}

export class ContentNodeError extends Error {
  constructor({
    length,
    columnNumber,
    containingLine,
    where,
    message,
  }) {
    const headingLine =
      `(${where}) ${message}`;

    const textUpToNode =
      containingLine.slice(0, columnNumber);

    const nodeText =
      containingLine.slice(columnNumber, columnNumber + length);

    const textPastNode =
      containingLine.slice(columnNumber + length);

    const containingLines =
      containingLine.split('\n');

    const formattedSourceLines =
      containingLines.map((_, index, {length}) => {
        let line = ' ⋮ ';

        if (index === 0) {
          line += colors.dim(cutStart(textUpToNode, 20));
        }

        line += nodeText;

        if (index === length - 1) {
          line += colors.dim(cut(textPastNode, 20));
        }

        return line;
      });

    super([
      headingLine,
      ...formattedSourceLines,
    ].filter(Boolean).join('\n'));
  }
}

export function reportContentTextErrors(wikiData, {
  bindFind,
}) {
  // eslint-disable-next-line no-unused-vars
  const commentaryShape = {
    body: 'commentary body',
    artistDisplayText: 'commentary artist display text',
    annotation: 'commentary annotation',
  };

  const contentTextSpec = [
    ['artistData', {
      contextNotes: '_content',
    }],

    ['homepageLayout', {
      sidebarContent: '_content',
    }],

    ['newsData', {
      content: '_content',
    }],

    ['staticPageData', {
      content: '_content',
    }],

    ['wikiInfo', {
      description: '_content',
      footerContent: '_content',
    }],
  ];

  const boundFind = bindFind(wikiData, {mode: 'error'});
  const findArtistOrAlias = bindFindArtistOrAlias(boundFind);

  function* processContent(input) {
    const nodes = parseInput(input);

    for (const node of nodes) {
      const index = node.i;
      const length = node.iEnd - node.i;

      if (node.type === 'tag') {
        const replacerKeyImplied = !node.data.replacerKey;
        const replacerKey = replacerKeyImplied ? 'track' : node.data.replacerKey.data;
        const spec = replacerSpec[replacerKey];

        if (!spec) {
          yield {
            index, length,
            message:
              `Unknown tag key ${colors.red(`"${replacerKey}"`)}`,
          };

          // No spec, no further errors to report.
          continue;
        }

        const replacerValue = node.data.replacerValue[0].data;

        if (spec.find) {
          let findFn;

          switch (spec.find) {
            case 'artist':
              findFn = findArtistOrAlias;
              break;

            default:
              findFn = boundFind[spec.find];
              break;
          }

          const findRef =
            (replacerKeyImplied
              ? replacerValue
              : replacerKey + `:` + replacerValue);

          try {
            findFn(findRef);
          } catch (error) {
            yield {
              index, length,
              message: error.message,
            };

            // It's only possible to have one error per node at the moment.
            continue;
          }
        }
      } else if (node.type === 'external-link') {
        try {
          new URL(node.data.href);
        } catch (error) {
          yield {
            index, length,
            message:
              `Invalid URL ${colors.red(`"${node.data.href}"`)}`,
          };
        }
      }
    }
  }

  function callProcessContent({
    nest,
    push,
    value,
    message,
    annotateError = error => error,
  }) {
    const processContentIterator =
      nest({message}, ({call}) =>
        call(processContent, value));

    if (!processContentIterator) return;

    const multilineIterator =
      iterateMultiline(value, processContentIterator, {
        formatWhere: true,
        getContainingLine: true,
      });

    const errors = [];

    for (const result of multilineIterator) {
      errors.push(new ContentNodeError(result));
    }

    if (empty(errors)) return;

    push(
      annotateError(
        new AggregateError(errors, message)));
  }

  withAggregate({message: `Errors validating content text`}, ({nest}) => {
    for (const [thingDataProp, propSpec] of contentTextSpec) {
      const thingData = getNestedProp(wikiData, thingDataProp);
      const things = Array.isArray(thingData) ? thingData : [thingData];
      nest({message: `Content text errors in ${colors.green('wikiData.' + thingDataProp)}`}, ({nest}) => {
        for (const thing of things) {
          nest({message: `Content text errors in ${inspect(thing)}`}, ({nest, push}) => {

            for (const [property, shape] of Object.entries(propSpec)) {
              const value = thing[property];

              if (value === undefined) {
                push(new TypeError(`Property ${colors.red(property)} isn't valid for ${colors.green(thing.constructor.name)}`));
                continue;
              }

              if (value === null) {
                continue;
              }

              const fieldPropertyMessage =
                getFieldPropertyMessage(
                  thing.constructor[Symbol.for('Thing.yamlDocumentSpec')],
                  property);

              const topMessage =
                `Content text errors` + fieldPropertyMessage;

              if (shape === '_content') {
                callProcessContent({
                  nest,
                  push,
                  value,
                  message: topMessage,
                });
              } else {
                nest({message: topMessage}, ({push}) => {
                  for (const [index, entry] of value.entries()) {
                    for (const [key, annotation] of Object.entries(shape)) {
                      const value = entry[key];

                      // TODO: Should this check undefined/null similar to above?
                      if (!value) continue;

                      callProcessContent({
                        nest,
                        push,
                        value,
                        message: `Error in ${colors.green(annotation)}`,
                        annotateError: error =>
                          annotateErrorWithIndex(error, index),
                      });
                    }
                  }
                });
              }
            }
          });
        }
      });
    }
  });
}
