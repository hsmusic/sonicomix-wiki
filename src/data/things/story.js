export const DATA_STORY_DIRECTORY = 'story';

import * as path from 'node:path';

import {input, V} from '#composite';
import find from '#find';
import {traverse} from '#node-utils';
import {sortStoriesChronologically} from '#sort';
import Thing from '#thing';
import {parseAnnotatedReferences, parseContributors} from '#yaml';

import {exposeConstant, exposeDependency} from '#composite/control-flow';
import {withPropertyFromList} from '#composite/data';

import {
  annotatedReferenceList,
  contentString,
  contributionList,
  directory,
  name,
  reverseReferenceList,
  shortName,
  simpleString,
  singleReference,
  soupyFind,
  soupyReverse,
  thingList,
  wikiData,
} from '#composite/wiki-properties';

export class Story extends Thing {
  static [Thing.referenceType] = 'story';
  static [Thing.wikiData] = 'storyData';

  static [Thing.getPropertyDescriptors] = ({
    Artist,
    Character,
    Issue,
    Publisher,
    StoryCharacter,
  }) => ({
    // Update & expose

    name: name(V('Unnamed Story')),
    shortName: shortName(),
    directory: directory(),

    publisher: singleReference({
      class: input.value(Publisher),
      find: soupyFind.input('publisher'),
    }),

    storyContribs: contributionList({
      date: 'earliestIssueDate',
      artistProperty: input.value('storyStoryContributions'),
    }),

    artContribs: contributionList({
      date: 'earliestIssueDate',
      artistProperty: input.value('storyArtistContributions'),
    }),

    storyCharacters: thingList(V(StoryCharacter)),

    featuredCharacters: annotatedReferenceList({
      find: soupyFind.input('character'),

      reference: input.value('who'),
      annotation: input.value('how'),
      thing: input.value('who'),
    }),

    // Update only

    find: soupyFind(),
    reverse: soupyReverse(),

    // Expose only

    isStory: exposeConstant(V(true)),

    earliestIssueDate: [
      withPropertyFromList('featuredInIssues', V('date')),

      {
        dependencies: ['#featuredInIssues.date'],
        compute: ({['#featuredInIssues.date']: dates}) =>
          dates.filter(Boolean).sort().at(0),
      },
    ],

    featuredInIssues: reverseReferenceList({
      reverse: soupyReverse.input('issuesFeaturingStory'),
    }),
  });

  static [Thing.findSpecs] = {
    story: {
      referenceTypes: ['story'],
      bindTo: 'storyData',

      getMatchableDirectories: story =>
        (story.publisher
          ? [story.publisher.directory + '/' + story.directory]
          : []),
    },
  };

  static [Thing.reverseSpecs] = {
    storyStoryContributionsBy:
      soupyReverse.contributionsBy('storyData', 'storyContribs'),

    storyArtContributionsBy:
      soupyReverse.contributionsBy('storyData', 'artContribs'),

    storiesFeaturingCharacter: {
      bindTo: 'storyData',

      referencing: story =>
        story.featuredCharacters.map(({who: character, annotation, ...referenceDetails}) => ({
          story,
          character, annotation,
          referenceDetails,
        })),

      referenced: ({character}) => [character],

      tidy: ({story, annotation, ...referenceDetails}) => ({
        story,
        how: annotation,
        ...referenceDetails,
      }),
    },

    storiesPublishedByPublisher: {
      bindTo: 'storyData',

      referencing: story => [story],
      referenced: story => [story.publisher],
    },
  };

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Story': {property: 'name'},
      'Short Name': {property: 'shortName'},
      'Directory': {property: 'directory'},
      'Publisher': {property: 'publisher'},

      'Story By': {
        property: 'storyContribs',
        transform: parseContributors,
      },

      'Art By': {
        property: 'artContribs',
        transform: parseContributors,
      },

      'Featured Characters': {
        property: 'featuredCharacters',
        transform: value =>
          parseAnnotatedReferences(value, {
            referenceField: 'Who',
            annotationField: 'How',
            referenceProperty: 'who',
            annotationProperty: 'how',
          }),
      },
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {headerAndEntries},
    thingConstructors: {Story},
  }) => ({
    title: `Process story files`,

    files: dataPath =>
      traverse(path.join(dataPath, DATA_STORY_DIRECTORY), {
        filterFile: name => path.extname(name) === '.yaml',
        prefixPath: DATA_STORY_DIRECTORY,
      }),

    documentMode: headerAndEntries,
    headerDocumentThing: Story,
    entryDocumentThing: StoryCharacter,

    connect({header: story, entries: storyCharacters}) {
      story.storyCharacters = storyCharacters;
    },

    sort({storyData}) {
      sortStoriesChronologically(storyData, {
        getDate: story => story.earliestIssueDate,
      });
    },
  });
}

export class StoryCharacter extends Thing {
  static [Thing.getPropertyDescriptors] = ({Character}) => ({
    // Update & expose

    character: singleReference({
      class: input.value(Character),
      find: soupyFind.input('character'),
    }),

    featureType: simpleString(),

    directory: directory(),

    storySummary: contentString(),
    storyDiscussion: contentString(),

    // Update only

    soupyFind: soupyFind(),

    // Expose only

    isStoryCharacter: exposeConstant(V(true)),
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Story Character': {property: 'character'},

      'Feature Type': {property: 'featureType'},

      'Story Summary': {property: 'storySummary'},
      'Story Discussion': {property: 'storyDiscussion'},
    },
  };
}
