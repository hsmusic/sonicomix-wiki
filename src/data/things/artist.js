export const ARTIST_DATA_FILE = 'artists.yaml';

import {inspect} from 'node:util';

import CacheableObject from '#cacheable-object';
import {colors} from '#cli';
import {input, V} from '#composite';
import Thing from '#thing';
import {parseArtistAliases, parseArtwork} from '#yaml';

import {withFlattenedList, withPropertyFromList} from '#composite/data';

import {
  sortArtworksChronologically,
  sortAlphabetically,
  sortContributionsChronologically,
} from '#sort';

import {exitWithoutDependency, exposeConstant} from '#composite/control-flow';

import {
  constitutibleArtwork,
  contentString,
  directory,
  fileExtension,
  flag,
  name,
  reverseReferenceList,
  soupyFind,
  soupyReverse,
  thing,
  thingList,
  urls,
} from '#composite/wiki-properties';

export class Artist extends Thing {
  static [Thing.referenceType] = 'artist';
  static [Thing.wikiData] = 'artistData';

  static [Thing.constitutibleProperties] = [
    'avatarArtwork', // from inline fields
  ];

  static [Thing.getPropertyDescriptors] = ({Cover, Issue, Story}) => ({
    // Update & expose

    name: name(V('Unnamed Artist')),
    directory: directory(),
    urls: urls(),

    contextNotes: contentString(),

    hasAvatar: flag(V(false)),
    avatarFileExtension: fileExtension(V('jpg')),

    avatarArtwork: [
      exitWithoutDependency('hasAvatar', {
        value: input.value(null),
        mode: input.value('falsy'),
      }),

      constitutibleArtwork.fromYAMLFieldSpec
        .call(this, 'Avatar Artwork'),
    ],

    isAlias: flag(V(false)),
    artistAliases: thingList(V(Artist)),
    aliasedArtist: thing(V(Artist)),

    // Update only

    find: soupyFind(),
    reverse: soupyReverse(),

    // Expose only

    isArtist: exposeConstant(V(true)),

    storyStoryContributions: reverseReferenceList({
      reverse: soupyReverse.input('storyStoryContributionsBy'),
    }),

    storyArtistContributions: reverseReferenceList({
      reverse: soupyReverse.input('storyArtContributionsBy'),
    }),

    issueCoverContributions: reverseReferenceList({
      reverse: soupyReverse.input('issueCoverContributionsBy'),
    }),
  });

  static [Thing.getSerializeDescriptors] = ({
    serialize: S,
  }) => ({
    name: S.id,
    directory: S.id,
    urls: S.id,
    contextNotes: S.id,

    hasAvatar: S.id,
    avatarFileExtension: S.id,

    tracksAsCommentator: S.toRefs,
    albumsAsCommentator: S.toRefs,
  });

  static [Thing.findSpecs] = {
    artist: {
      referenceTypes: ['artist', 'artist-gallery'],
      bindTo: 'artistData',

      include: artist => !artist.isAlias,
    },

    artistAlias: {
      referenceTypes: ['artist', 'artist-gallery'],
      bindTo: 'artistData',

      include: artist => artist.isAlias,

      getMatchableDirectories(artist) {
        const originalArtist = artist.aliasedArtist;

        // Aliases never match by the same directory as the original.
        if (artist.directory === originalArtist.directory) {
          return [];
        }

        // Aliases never match by the same directory as some *previous* alias
        // in the original's alias list. This is honestly a bit awkward, but it
        // avoids artist aliases conflicting with each other when checking for
        // duplicate directories.
        for (const alias of originalArtist.artistAliases) {
          if (alias === artist) break;
          if (alias.directory === artist.directory) return [];
        }

        // And, aliases never return just a blank string. This part is pretty
        // spooky because it doesn't handle two differently named aliases, on
        // different artists, who have names that are similar *apart* from a
        // character that's shortened. But that's also so fundamentally scary
        // that we can't support it properly with existing code, anyway - we
        // would need to be able to specifically set a directory *on an alias,*
        // which currently can't be done in YAML data files.
        if (artist.directory === '') {
          return [];
        }

        return [artist.directory];
      },
    },
  };

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Artist': {property: 'name'},
      'Directory': {property: 'directory'},
      'URLs': {property: 'urls'},
      'Context Notes': {property: 'contextNotes'},

      // note: doesn't really work as an independent field yet
      'Avatar Artwork': {
        property: 'avatarArtwork',
        transform:
          parseArtwork({
            single: true,
            thingProperty: 'avatarArtwork',
            fileExtensionFromThingProperty: 'avatarFileExtension',
          }),
      },

      'Has Avatar': {property: 'hasAvatar'},
      'Avatar File Extension': {property: 'avatarFileExtension'},

      'Aliases': {
        property: 'artistAliases',
        transform: parseArtistAliases,
      },

      'Dead URLs': {ignore: true},

      'Review Points': {ignore: true},
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {allInOne},
    thingConstructors: {Artist},
  }) => ({
    title: `Process artists file`,
    file: ARTIST_DATA_FILE,

    documentMode: allInOne,
    documentThing: Artist,

    sort({artistData}) {
      sortAlphabetically(artistData);
    },
  });

  [inspect.custom]() {
    const parts = [];

    parts.push(Thing.prototype[inspect.custom].apply(this));

    if (CacheableObject.getUpdateValue(this, 'isAlias')) {
      parts.unshift(`${colors.yellow('[alias]')} `);

      let aliasedArtist;
      try {
        aliasedArtist = this.aliasedArtist.name;
      } catch {
        aliasedArtist = CacheableObject.getUpdateValue(this, 'aliasedArtist');
      }

      parts.push(` ${colors.yellow(`[of ${aliasedArtist}]`)}`);
    }

    return parts.join('');
  }

  getOwnArtworkPath(artwork) {
    return [
      'media.artistAvatar',
      this.directory,
      artwork.fileExtension,
    ];
  }
}
