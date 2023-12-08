export const DATA_STORY_DIRECTORY = 'story';

import * as path from 'node:path';

import {input} from '#composite';
import find from '#find';
import {traverse} from '#node-utils';
import {sortStoriesChronologically} from '#sort';
import Thing from '#thing';
import {parseAnnotatedReferences, parseContributors} from '#yaml';

import {exposeDependency} from '#composite/control-flow';

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
  thingList,
  wikiData,
} from '#composite/wiki-properties';

import {withEarliestIssueDate} from '#composite/things/story';

export class Story extends Thing {
  static [Thing.referenceType] = 'story';

  static [Thing.getPropertyDescriptors] = ({
    Artist,
    Character,
    Issue,
    Publisher,
    StoryCharacter,
  }) => ({
    // Update & expose

    name: name('Unnamed Story'),
    shortName: shortName(),
    directory: directory(),

    publisher: singleReference({
      class: input.value(Publisher),
      find: input.value(find.publisher),
      data: 'publisherData',
    }),

    storyContribs: [
      withEarliestIssueDate(),

      contributionList({
        date: '#earliestIssueDate',
      }),
    ],

    artContribs: [
      withEarliestIssueDate(),

      contributionList({
        date: '#earliestIssueDate',
      }),
    ],

    storyCharacters: thingList({
      class: input.value(StoryCharacter),
    }),

    featuredCharacters: annotatedReferenceList({
      data: 'characterData',
      find: input.value(find.character),

      reference: input.value('who'),
      annotation: input.value('how'),
      thing: input.value('who'),
    }),

    // Update only

    artistData: wikiData({
      class: input.value(Artist),
    }),

    characterData: wikiData({
      class: input.value(Character),
    }),

    issueData: wikiData({
      class: input.value(Issue),
    }),

    publisherData: wikiData({
      class: input.value(Publisher),
    }),

    // Expose only

    earliestIssueDate: [
      withEarliestIssueDate(),
      exposeDependency({dependency: '#earliestIssueDate'}),
    ],

    featuredInIssues: reverseReferenceList({
      data: 'issueData',
      list: input.value('featuredStories'),
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

    save(results) {
      const storyData = [];
      const storyCharacterData = [];

      for (const {header: story, entries: storyCharacters} of results) {
        const currentStoryCharacters = [];

        for (const entry of storyCharacters) {
          currentStoryCharacters.push(entry);
          storyCharacterData.push(entry);
        }

        storyData.push(story);

        story.storyCharacters = currentStoryCharacters;
      }

      return {storyData, storyCharacterData};
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
      find: input.value(find.character),
      data: 'characterData',
    }),

    featureType: simpleString(),

    directory: directory(),

    storySummary: contentString(),
    storyDiscussion: contentString(),

    // Update only

    characterData: wikiData({
      class: input.value(Character),
    }),
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
