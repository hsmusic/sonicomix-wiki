import {input} from '#composite';
import find from '#find';

import {
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
    Character,
    Issue,
    Publisher,
  }) => ({
    name: name('Unnamed Story'),
    directory: directory(),

    publisher: singleReference({
      class: input.value(Publisher),
      find: input.value(find.publisher),
      data: 'publisherData',
    }),

    featuredCharacters: referenceList({
      class: input.value(Character),
      find: input.value(find.character),
      data: 'characterData',
    }),

    featuredInIssues: reverseReferenceList({
      data: 'issueData',
      list: input.value('featuredStories'),
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
