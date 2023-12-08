export const PUBLISHER_DATA_FILE = 'publishers.yaml';

import {input} from '#composite';
import {sortAlphabetically} from '#sort';
import Thing from '#thing';

import {withThingsSortedAlphabetically} from '#composite/wiki-data';
import {directory, name, reverseSingleReferenceList, shortName, wikiData}
  from '#composite/wiki-properties';

export class Publisher extends Thing {
  static [Thing.referenceType] = 'publisher';

  static [Thing.getPropertyDescriptors] = ({Issue, Story}) => ({
    name: name('Unnamed Publisher'),
    shortName: shortName(),
    directory: directory(),

    publishedIssues: reverseSingleReferenceList({
      data: 'issueData',
      ref: input.value('publisher'),
      // sort: input.subroutine({
      //   template: withThingsSortedChronologically,
      // }),
    }),

    publishedStories: reverseSingleReferenceList({
      data: 'storyData',
      ref: input.value('publisher'),
      // sort: input.subroutine.from(withThingsSortedAlphabetically),
    }),

    issueData: wikiData({
      class: input.value(Issue),
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),
  });

  static [Thing.findSpecs] = {
    publisher: {
      referenceTypes: ['publisher'],
      bindTo: 'publisherData',

      getMatchableNames: publisher => [
        publisher.name,
        publisher.shortName,
      ],
    },
  };

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Publisher': {property: 'name'},
      'Short Name': {property: 'shortName'},
      'Directory': {property: 'directory'},
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {allInOne},
    thingConstructors: {Publisher},
  }) => ({
    title: `Process publishers file`,
    file: PUBLISHER_DATA_FILE,

    documentMode: allInOne,
    documentThing: Publisher,

    save: (results) => ({publisherData: results}),

    sort({publisherData}) {
      sortAlphabetically(publisherData);
    },
  });
}
