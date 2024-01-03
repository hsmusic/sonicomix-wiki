import {withEntries} from '#sugar';

const urlSpec = {
  data: {
    prefix: 'data/',

    paths: {
      root: '',
      path: '<>',

      album: 'album/<>',
      artist: 'artist/<>',
      track: 'track/<>',
    },
  },

  localized: {
    // TODO: Implement this.
    // prefix: '_languageCode',

    paths: {
      root: '',
      path: '<>',
      page: '<>/',

      home: '',

      album: 'album/<>/',
      albumCommentary: 'commentary/album/<>/',
      albumGallery: 'album/<>/gallery/',

      artist: 'artist/<>/',
      artistGallery: 'artist/<>/gallery/',

      commentaryIndex: 'commentary/',

      listingIndex: 'list/',

      listing: 'list/<>/',

      newsIndex: 'news/',

      newsEntry: 'news/<>/',

      staticPage: '<>/',
    },
  },

  shared: {
    paths: {
      root: '',
      path: '<>',

      utilityRoot: 'util',
      staticRoot: 'static',

      utilityFile: 'util/<>',
      staticFile: 'static/<>?<>',

      staticIcon: 'static/icons.svg#icon-<>',
    },
  },

  media: {
    prefix: 'media/',

    paths: {
      root: '',
      path: '<>',

      artistAvatar: 'artist-avatar/<>.<>',
    },
  },

  thumb: {
    prefix: 'thumb/',

    paths: {
      root: '',
      path: '<>',
    },
  },
};

// This gets automatically switched in place when working from a baseDirectory,
// so it should never be referenced manually.
urlSpec.localizedWithBaseDirectory = {
  paths: withEntries(urlSpec.localized.paths, (entries) =>
    entries.map(([key, path]) => [key, '<>/' + path])),
};

export default urlSpec;
