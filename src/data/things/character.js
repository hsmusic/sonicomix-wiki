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

export class Character extends Thing {
  static [Thing.referenceType] = 'story';

  static [Thing.getPropertyDescriptors] = ({Story}) => ({
    name: name('Unnamed Character'),
    directory: directory(),

    featuredInStories: reverseReferenceList({
      data: 'storyData',
      list: input.value('featuredCharacters'),
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),
  });
}
