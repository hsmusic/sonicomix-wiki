import {input} from '#composite';
import find from '#find';
import {isName, validateArrayItems} from '#validators';

import {
  directory,
  fileExtension,
  flag,
  name,
  simpleString,
  singleReference,
  urls,
  wikiData,
} from '#composite/wiki-properties';

import Thing from './thing.js';

export class Artist extends Thing {
  static [Thing.referenceType] = 'artist';

  static [Thing.getPropertyDescriptors] = () => ({
    // Update & expose

    name: name('Unnamed Artist'),
    directory: directory(),
    urls: urls(),
    contextNotes: simpleString(),

    hasAvatar: flag(false),
    avatarFileExtension: fileExtension('jpg'),

    aliasNames: {
      flags: {update: true, expose: true},
      update: {validate: validateArrayItems(isName)},
      expose: {transform: (names) => names ?? []},
    },

    isAlias: flag(),

    aliasedArtist: singleReference({
      class: input.value(Artist),
      find: input.value(find.artist),
      data: 'artistData',
    }),

    // Update only


    artistData: wikiData({
      class: input.value(Artist),
    }),

    // Expose only

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

    aliasNames: S.id,

    tracksAsArtist: S.toRefs,
    tracksAsContributor: S.toRefs,
    tracksAsCoverArtist: S.toRefs,
    tracksAsCommentator: S.toRefs,

    albumsAsAlbumArtist: S.toRefs,
    albumsAsCoverArtist: S.toRefs,
    albumsAsWallpaperArtist: S.toRefs,
    albumsAsBannerArtist: S.toRefs,
    albumsAsCommentator: S.toRefs,

    flashesAsContributor: S.toRefs,
  });

  static filterByContrib = (thingDataProperty, contribsProperty) => ({
    flags: {expose: true},

    expose: {
      dependencies: ['this', thingDataProperty],

      compute: ({
        this: artist,
        [thingDataProperty]: thingData,
      }) =>
        thingData?.filter(thing =>
          thing[contribsProperty]
            ?.some(contrib => contrib.who === artist)) ?? [],
    },
  });
}
