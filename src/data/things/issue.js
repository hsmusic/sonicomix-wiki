export const DATA_ISSUE_DIRECTORY = 'issue';

import * as path from 'node:path';

import {input} from '#composite';
import find from '#find';
import {traverse} from '#node-utils';
import {sortAlphabetically} from '#sort';
import Thing from '#thing';
import {parseArtworks, parseDate} from '#yaml';

import {
  artworkList,
  directory,
  name,
  referenceList,
  simpleDate,
  singleReference,
  simpleString,
  wikiData,
} from '#composite/wiki-properties';

export class Issue extends Thing {
  static [Thing.referenceType] = 'issue';

  static [Thing.getPropertyDescriptors] = ({
    Artist,
    Publisher,
    Story,
  }) => ({
    name: name('Unnamed Issue'),
    directory: directory(),
    date: simpleDate(),

    blurb: simpleString(),

    publisher: singleReference({
      class: input.value(Publisher),
      find: input.value(find.publisher),
      data: 'publisherData',
    }),

    coverArtworks: artworkList({
      directoryPrefix: input.value('cover-'),
      date: 'date',
    }),

    featuredStories: referenceList({
      class: input.value(Story),
      find: input.value(find.story),
      data: 'storyData',
    }),

    artistData: wikiData({
      class: input.value(Artist),
    }),

    publisherData: wikiData({
      class: input.value(Publisher),
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),
  });

  static [Thing.findSpecs] = {
    issue: {
      referenceTypes: ['issue'],
      bindTo: 'issueData',

      getMatchableDirectories: issue =>
        (issue.publisher
          ? [issue.publisher.directory + '/' + issue.directory]
          : []),
    },
  };

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Issue': {property: 'name'},
      'Directory': {property: 'directory'},
      'Publisher': {property: 'publisher'},

      'Date': {
        property: 'date',
        transform: parseDate,
      },

      'Blurb': {property: 'blurb'},

      'Cover Artworks': {
        property: 'coverArtworks',
        transform: parseArtworks,
      },

      'Featured Stories': {property: 'featuredStories'},
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {onePerFile},
    thingConstructors: {Issue},
  }) => ({
    title: `Process issue files`,

    files: dataPath =>
      traverse(path.join(dataPath, DATA_ISSUE_DIRECTORY), {
        filterFile: name => path.extname(name) === '.yaml',
        prefixPath: DATA_ISSUE_DIRECTORY,
      }),

    documentMode: onePerFile,
    documentThing: Issue,

    save: (results) => ({issueData: results}),

    sort({issueData}) {
      sortAlphabetically(issueData);
    },
  });
}
