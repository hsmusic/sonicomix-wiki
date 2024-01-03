import {input} from '#composite';
import find from '#find';
import {empty, stitchArrays} from '#sugar';
import {filterMultipleArrays} from '#wiki-data';

import {
  color,
  directory,
  name,
  referenceList,
  reverseReferenceList,
  shortName,
  singleReference,
  wikiData,
} from '#composite/wiki-properties';

import Thing from './thing.js';

const filterByContrib = ({
  data: thingDataProperty,
  list: contribsProperty,
  match: matchProperty,
  detail: detailProperty,
  thing: thingProperty,
}) => ({
  flags: {expose: true},

  expose: {
    dependencies: ['this', thingDataProperty],

    compute: ({
      this: thisThing,
      [thingDataProperty]: thingData,
    }) => {
      const things =
        thingData.slice();

      const thingContribs =
        things
          .map(thing => thing[contribsProperty]
            .filter(({[matchProperty]: thing}) => thing === thisThing));

      filterMultipleArrays(things, thingContribs,
        (_thing, contribs) => !empty(contribs));

      const thingDetails =
        thingContribs
          .map(contribs => contribs
            .map(({[detailProperty]: detail}) => detail)
            .filter(Boolean));

      return stitchArrays({
        [thingProperty]: things,
        [detailProperty]: thingDetails,
      });
    }
  },
});

export class Character extends Thing {
  static [Thing.referenceType] = 'story';

  static [Thing.getPropertyDescriptors] = ({Story}) => ({
    name: name('Unnamed Character'),
    shortName: shortName(),
    directory: directory(),
    color: color(),

    featuredInStories: filterByContrib({
      data: 'storyData',
      list: 'featuredCharacters',
      match: 'who',
      thing: 'story',
      detail: 'how',
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),
  });
}
