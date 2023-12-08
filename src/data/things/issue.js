export const DATA_ISSUE_DIRECTORY = 'issue';

import * as path from 'node:path';

import {input, V} from '#composite';
import find from '#find';
import {traverse} from '#node-utils';
import {sortAlphabetically} from '#sort';
import Thing from '#thing';
import {parseContributors, parseDate, parseIssueCovers} from '#yaml';

import {exposeConstant, exposeDependency} from '#composite/control-flow';
import {withPropertyFromObject} from '#composite/data';
import {withResolvedCoverList, withDirectory} from '#composite/wiki-data';

import {
  contributionList,
  directory,
  fileExtension,
  name,
  referenceList,
  simpleDate,
  singleReference,
  simpleString,
  soupyFind,
  soupyReverse,
  thing,
  thingList,
} from '#composite/wiki-properties';

export class Issue extends Thing {
  static [Thing.referenceType] = 'issue';
  static [Thing.wikiData] = 'issueData';

  static [Thing.getPropertyDescriptors] = ({
    Artist,
    Cover,
    Publisher,
    Story,
  }) => ({
    // Update & expose

    name: name(V('Unnamed Issue')),
    directory: directory(),
    date: simpleDate(),

    blurb: simpleString(),

    publisher: singleReference({
      class: input.value(Publisher),
      find: soupyFind.input('publisher'),
    }),

    covers: thingList(V(Cover)),

    featuredStories: referenceList({
      class: input.value(Story),
      find: soupyFind.input('story'),
    }),

    // Update only

    find: soupyFind(),

    // Expose only

    isIssue: exposeConstant(V(true)),
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

  static [Thing.reverseSpecs] = {
    issuesFeaturingStory: {
      bindTo: 'issueData',

      referencing: issue => [issue],
      referenced: issue => issue.featuredStories,
    },

    issuesPublishedByPublisher: {
      bindTo: 'issueData',

      referencing: issue => [issue],
      referenced: issue => [issue.publisher],
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
        property: 'covers',
        transform: parseIssueCovers,
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

    sort({issueData}) {
      sortAlphabetically(issueData);
    },
  });
}

export class IssueCover extends Thing {
  static [Thing.referenceType] = 'cover';
  static [Thing.wikiData] = 'issueCoverData';

  static [Thing.getPropertyDescriptors] = ({Artist, Issue}) => ({
    // Update & expose

    issue: thing(V(Issue)),

    name: [
      withPropertyFromObject('issue', V('name')),

      {
        dependencies: ['#issue.name'],
        transform: (name, {['#issue.name']: issueName}) =>
          `${issueName} (${name})`,
      },
    ],

    shortName: exposeDependency('_name'),

    unqualifiedDirectory: directory(),

    directory: [
      withDirectory({
        directory: '_unqualifiedDirectory',
      }),

      {
        dependencies: ['#directory'],
        compute: ({
          ['#directory']: unqualifiedDirectory,
        }) => 'cover-' + unqualifiedDirectory
      },
    ],

    extension: fileExtension(V('jpg')),

    contribs: [
      withPropertyFromObject('issue', V('date')),

      contributionList({
        date: '#issue.date',
        artistProperty: input.value('issueCoverContributions'),
      }),
    ],

    // Update only

    find: soupyFind(),

    // Expose only

    isIssueCover: exposeConstant(V(true)),
  });

  static [Thing.reverseSpecs] = {
    issueCoverContributionsBy:
      soupyReverse.contributionsBy('issueCoverData', 'contribs'),
  };

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Name': {property: 'name'},
      'Directory': {property: 'unqualifiedDirectory'},

      'Artists': {
        property: 'contribs',
        transform: parseContributors,
      },

      'File Extension': {property: 'extension'},
    },
  };
}
