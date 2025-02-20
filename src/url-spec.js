import {withEntries} from '#sugar';

// Static files are all grouped under a `static-${STATIC_VERSION}` folder as
// part of a build. This is so that multiple builds of a wiki can coexist
// served from the same server / file system root: older builds' HTML files
// refer to earlier values of STATIC_VERSION, avoiding name collisions.
const STATIC_VERSION = '3p3-s'; /* "-s" - Soni/clean */

const genericPaths = {
  root: '',
  path: '<>',
};

const urlSpec = {
  data: {
    prefix: 'data/',

    paths: {
      ...genericPaths,

      album: 'album/<>',
      artist: 'artist/<>',
      track: 'track/<>',
    },
  },

  localized: {
    // TODO: Implement this.
    // prefix: '_languageCode',

    paths: {
      ...genericPaths,
      page: '<>/',

      home: '',

      artist: 'artist/<>/',
      artistGallery: 'artist/<>/gallery/',

      character: 'character/<>/',

      commentaryIndex: 'commentary/',

      issue: 'issue/<>/<>/',

      listingIndex: 'list/',

      listing: 'list/<>/',

      newsIndex: 'news/',

      newsEntry: 'news/<>/',

      publisher: 'publisher/<>/',

      staticPage: '<>/',

      story: 'story/<>/<>/',
    },
  },

  shared: {
    paths: genericPaths,
  },

  staticCSS: {
    prefix: `static-${STATIC_VERSION}/css/`,
    paths: genericPaths,
  },

  staticJS: {
    prefix: `static-${STATIC_VERSION}/js/`,
    paths: genericPaths,
  },

  staticLib: {
    prefix: `static-${STATIC_VERSION}/lib/`,
    paths: genericPaths,
  },

  staticMisc: {
    prefix: `static-${STATIC_VERSION}/misc/`,
    paths: {
      ...genericPaths,
      icon: 'icons.svg#icon-<>',
    },
  },

  staticSharedUtil: {
    prefix: `static-${STATIC_VERSION}/shared-util/`,
    paths: genericPaths,
  },

  media: {
    prefix: 'media/',

    paths: {
      ...genericPaths,

      artistAvatar: 'artist-avatar/<>.<>',

      // publisher, issue, cover, extension
      issueCover: 'issue-art/<>/<>/<>.<>',
    },
  },

  thumb: {
    prefix: 'thumb/',
    paths: genericPaths,
  },

  searchData: {
    prefix: 'search-data/',
    paths: genericPaths,
  },
};

// This gets automatically switched in place when working from a baseDirectory,
// so it should never be referenced manually.
urlSpec.localizedWithBaseDirectory = {
  paths: withEntries(urlSpec.localized.paths, (entries) =>
    entries.map(([key, path]) => [key, '<>/' + path])),
};

export default urlSpec;
