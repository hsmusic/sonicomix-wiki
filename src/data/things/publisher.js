import {input} from '#composite';

import {withThingsSortedAlphabetically} from '#composite/wiki-data';

import {
  directory,
  name,
  reverseSingleReference,
  shortName,
  wikiData,
} from '#composite/wiki-properties';

import Thing from './thing.js';

export class Publisher extends Thing {
  static [Thing.referenceType] = 'publisher';

  static [Thing.getPropertyDescriptors] = ({Issue, Story}) => ({
    name: name('Unnamed Publisher'),
    shortName: shortName(),
    directory: directory(),

    publishedIssues: reverseSingleReference({
      data: 'issueData',
      property: input.value('publisher'),
      // sort: input.subroutine({
      //   template: withThingsSortedChronologically,
      // }),
    }),

    publishedStories: reverseSingleReference({
      data: 'storyData',
      property: input.value('publisher'),
      sort: input.subroutine.from(withThingsSortedAlphabetically),
    }),

    issueData: wikiData({
      class: input.value(Issue),
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),
  });
}
