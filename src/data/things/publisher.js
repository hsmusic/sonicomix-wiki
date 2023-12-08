export const PUBLISHER_DATA_FILE = 'publishers.yaml';

import {input, V} from '#composite';
import {sortAlphabetically} from '#sort';
import Thing from '#thing';

import {exposeConstant} from '#composite/control-flow';
import {withThingsSortedAlphabetically} from '#composite/wiki-data';
import {directory, name, reverseReferenceList, shortName, soupyReverse}
  from '#composite/wiki-properties';

export class Publisher extends Thing {
  static [Thing.referenceType] = 'publisher';
  static [Thing.wikiData] = 'publisherData';

  static [Thing.getPropertyDescriptors] = ({Issue, Story}) => ({
    // Update & expose

    name: name(V('Unnamed Publisher')),
    shortName: shortName(),
    directory: directory(),

    // Update only

    reverse: soupyReverse(),

    // Expose only

    isPublisher: exposeConstant(V(true)),

    publishedIssues: reverseReferenceList({
      reverse: soupyReverse.input('issuesPublishedByPublisher'),
      // sort: input.subroutine({
      //   template: withThingsSortedChronologically,
      // }),
    }),

    publishedStories: reverseReferenceList({
      reverse: soupyReverse.input('issuesPublishedByPublisher'),
      // sort: input.subroutine.from(withThingsSortedAlphabetically),
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

    sort({publisherData}) {
      sortAlphabetically(publisherData);
    },
  });
}
