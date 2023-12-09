import {inspect} from 'node:util';

import {colors} from '#cli';
import {input, V} from '#composite';
import Thing from '#thing';
import {isContributionList, isDate, isDimensions, isFileExtension}
  from '#validators';
import {parseContributors, parseDate, parseDimensions} from '#yaml';

import {withNearbyItemFromList, withPropertyFromList, withPropertyFromObject}
  from '#composite/data';

import {
  exitWithoutDependency,
  exposeConstant,
  exposeDependency,
  exposeDependencyOrContinue,
  exposeUpdateValueOrContinue,
  flipFilter,
} from '#composite/control-flow';

import {
  constituteFrom,
  withRecontextualizedContributionList,
  withResolvedContribs,
} from '#composite/wiki-data';

import {
  contentString,
  directory,
  flag,
  reverseReferenceList,
  simpleString,
  soupyFind,
  soupyReverse,
  thing,
} from '#composite/wiki-properties';

import {withContainingArtworkList} from '#composite/things/artwork';

export class Artwork extends Thing {
  static [Thing.referenceType] = 'artwork';
  static [Thing.wikiData] = 'artworkData';

  static [Thing.constitutibleProperties] = [
    // Contributions currently aren't being observed for constitution.
    // 'artistContribs', // from attached artwork or thing
  ];

  static [Thing.getPropertyDescriptors] = () => ({
    // Update & expose

    unqualifiedDirectory: directory({
      name: input.value(null),
    }),

    thing: thing(),
    thingProperty: simpleString(),

    label: simpleString(),
    source: contentString(),
    originDetails: contentString(),
    showFilename: simpleString(),

    dateFromThingProperty: simpleString(),

    date: [
      exposeUpdateValueOrContinue({
        validate: input.value(isDate),
      }),

      constituteFrom('thing', 'dateFromThingProperty'),
    ],

    fileExtensionFromThingProperty: simpleString(),

    fileExtension: [
      exposeUpdateValueOrContinue({
        validate: input.value(isFileExtension),
      }),

      constituteFrom('thing', 'fileExtensionFromThingProperty', {
        else: input.value('jpg'),
      }),
    ],

    dimensionsFromThingProperty: simpleString(),

    dimensions: [
      exposeUpdateValueOrContinue({
        validate: input.value(isDimensions),
      }),

      constituteFrom('thing', 'dimensionsFromThingProperty'),
    ],

    attachAbove: flag(V(false)),

    artistContribsFromThingProperty: simpleString(),
    artistContribsArtistProperty: simpleString(),

    artistContribs: [
      withResolvedContribs({
        from: input.updateValue({validate: isContributionList}),
        date: 'date',
        thingProperty: input.thisProperty(),
        artistProperty: 'artistContribsArtistProperty',
      }),

      exposeDependencyOrContinue('#resolvedContribs', V('empty')),

      withPropertyFromObject('attachedArtwork', V('artistContribs')),

      withRecontextualizedContributionList('#attachedArtwork.artistContribs'),
      exposeDependencyOrContinue('#attachedArtwork.artistContribs'),

      exitWithoutDependency('artistContribsFromThingProperty', V([])),

      withPropertyFromObject('thing', 'artistContribsFromThingProperty')
        .outputs({'#value': '#artistContribsFromThing'}),

      withRecontextualizedContributionList('#artistContribsFromThing'),
      exposeDependency('#artistContribsFromThing'),
    ],

    style: simpleString(),

    // Update only

    find: soupyFind(),
    reverse: soupyReverse(),

    // Expose only

    isArtwork: exposeConstant(V(true)),

    isMainArtwork: [
      withContainingArtworkList(),
      exitWithoutDependency('#containingArtworkList'),

      {
        dependencies: [input.myself(), '#containingArtworkList'],
        compute: ({
          [input.myself()]: myself,
          ['#containingArtworkList']: list,
        }) =>
          list[0] === myself,
      },
    ],

    mainArtwork: [
      withContainingArtworkList(),
      exitWithoutDependency('#containingArtworkList'),

      {
        dependencies: ['#containingArtworkList'],
        compute: ({'#containingArtworkList': list}) =>
          list[0],
      },
    ],

    attachedArtwork: [
      exitWithoutDependency('attachAbove', {
        value: input.value(null),
        mode: input.value('falsy'),
      }),

      withContainingArtworkList(),

      withPropertyFromList('#containingArtworkList', V('attachAbove')),

      flipFilter('#containingArtworkList.attachAbove')
        .outputs({'#containingArtworkList.attachAbove': '#filterNotAttached'}),

      withNearbyItemFromList({
        list: '#containingArtworkList',
        item: input.myself(),
        offset: input.value(-1),
        filter: '#filterNotAttached',
      }),

      exposeDependency('#nearbyItem'),
    ],

    attachingArtworks: reverseReferenceList({
      reverse: soupyReverse.input('artworksWhichAttach'),
    }),

    groups: [
      withPropertyFromObject('thing', V('groups')),
      exposeDependencyOrContinue('#thing.groups'),

      exposeConstant(V([])),
    ],
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Directory': {property: 'unqualifiedDirectory'},
      'File Extension': {property: 'fileExtension'},

      'Dimensions': {
        property: 'dimensions',
        transform: parseDimensions,
      },

      'Label': {property: 'label'},
      'Source': {property: 'source'},
      'Origin Details': {property: 'originDetails'},
      'Show Filename': {property: 'showFilename'},

      'Date': {
        property: 'date',
        transform: parseDate,
      },

      'Attach Above': {property: 'attachAbove'},

      'Artists': {
        property: 'artistContribs',
        transform: parseContributors,
      },

      'Style': {property: 'style'},
    },
  };

  static [Thing.reverseSpecs] = {
    artworksWhichAttach: {
      bindTo: 'artworkData',

      referencing: referencingArtwork =>
        (referencingArtwork.attachAbove
          ? [referencingArtwork]
          : []),

      referenced: referencingArtwork =>
        [referencingArtwork.attachedArtwork],
    },
  };

  get path() {
    if (!this.thing) return null;
    if (!this.thing.getOwnArtworkPath) return null;

    return this.thing.getOwnArtworkPath(this);
  }

  countOwnContributionInContributionTotals(contrib) {
    if (this.attachAbove) {
      return false;
    }

    if (contrib.annotation?.startsWith('edits for wiki')) {
      return false;
    }

    return true;
  }

  [inspect.custom](depth, options, inspect) {
    const parts = [];

    parts.push(Thing.prototype[inspect.custom].apply(this));

    if (this.thing) {
      if (depth >= 0) {
        const newOptions = {
          ...options,
          depth:
            (options.depth === null
              ? null
              : options.depth - 1),
        };

        parts.push(` for ${inspect(this.thing, newOptions)}`);
      } else {
        parts.push(` for ${colors.blue(Thing.getReference(this.thing))}`);
      }
    }

    return parts.join('');
  }
}
