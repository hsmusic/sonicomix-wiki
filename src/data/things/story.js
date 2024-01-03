import {input} from '#composite';
import find from '#find';

import {featuredCharacterList} from '#composite/things/story';

import {
  contributionList,
  directory,
  name,
  referenceList,
  reverseReferenceList,
  singleReference,
  wikiData,
} from '#composite/wiki-properties';

import Thing from './thing.js';

export class Story extends Thing {
  static [Thing.referenceType] = 'story';

  static [Thing.getPropertyDescriptors] = ({
    Artist,
    Character,
    Issue,
    Publisher,
  }) => ({
    // Update & expose

    name: name('Unnamed Story'),
    directory: directory(),

    publisher: singleReference({
      class: input.value(Publisher),
      find: input.value(find.publisher),
      data: 'publisherData',
    }),

    storyContribs: contributionList(),
    artContribs: contributionList(),

    featuredCharacters: featuredCharacterList(),

    featuredInIssues: reverseReferenceList({
      data: 'issueData',
      list: input.value('featuredStories'),
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
  });
}
