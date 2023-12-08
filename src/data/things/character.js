export const CHARACTER_DATA_FILE = 'characters.yaml';

import {input, V} from '#composite';
import find from '#find';
import {empty, stitchArrays} from '#sugar';
import Thing from '#thing';
import {filterMultipleArrays} from '#wiki-data';
import {parseAnnotatedReferences} from '#yaml';

import {exposeConstant} from '#composite/control-flow';

import {
  annotatedReferenceList,
  color,
  directory,
  name,
  referenceList,
  reverseReferenceList,
  shortName,
  soupyFind,
  soupyReverse,
  wikiData,
} from '#composite/wiki-properties';

export class Character extends Thing {
  static [Thing.referenceType] = 'character';
  static [Thing.wikiData] = 'characterData';

  static [Thing.getPropertyDescriptors] = ({Story}) => ({
    // Update & expose

    name: name(V('Unnamed Character')),
    shortName: shortName(),
    directory: directory(),
    color: color(),

    groupedCharacters: annotatedReferenceList({
      class: input.value(Character),
      find: soupyFind.input('character'),

      reference: input.value('character'),
      thing: input.value('character'),
    }),

    // Update only

    find: soupyFind(),
    reverse: soupyReverse(),

    // Expose only

    isCharacter: exposeConstant(V(true)),

    /*
    featuredInStories: reverseAnnotatedReferenceList({
      data: 'storyData',
      list: input.value('featuredCharacters'),

      forward: input.value('who'),
      backward: input.value('story'),
      annotation: input.value('how'),
    }),

    groupedUnderCharacters: reverseAnnotatedReferenceList({
      data: 'characterData',
      list: input.value('groupedCharacters'),

      forward: input.value('character'),
      backward: input.value('character'),
    }),
    */

    featuredInStories: reverseReferenceList({
      reverse: soupyReverse.input('storiesFeaturingCharacter'),
    }),

    groupedUnderCharacters: reverseReferenceList({
      reverse: soupyReverse.input('charactersGroupingCharacter'),
    }),
  });

  static [Thing.findSpecs] = {
    character: {
      referenceTypes: ['character'],
      bindTo: 'characterData',

      getMatchableNames: character => [
        character.name,

        character.shortName !== character.name &&
          character.shortName,
      ].filter(Boolean),
    },
  };

  static [Thing.reverseSpecs] = {
    charactersGroupingCharacter: {
      bindTo: 'characterData',

      referencing: groupingCharacter =>
        groupingCharacter.groupedCharacters
          .map(({character: groupedCharacter, ...referenceDetails}) => ({
            groupingCharacter,
            groupedCharacter,
            referenceDetails,
          })),

      referenced: ({groupedCharacter}) => [groupedCharacter],

      tidy: ({groupingCharacter, referenceDetails}) => ({
        character: groupingCharacter,
        ...referenceDetails,
      }),
    }
  };

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Character': {property: 'name'},
      'Directory': {property: 'directory'},
      'Short Name': {property: 'shortName'},

      'Color': {property: 'color'},

      'Grouped Characters': {
        property: 'groupedCharacters',
        transform: value =>
          parseAnnotatedReferences(value, {
            referenceField: 'Character',
            referenceProperty: 'character',
          }),
      },
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {allInOne},
    thingConstructors: {Character},
  }) => ({
    title: `Process characters file`,
    file: CHARACTER_DATA_FILE,

    documentMode: allInOne,
    documentThing: Character,
  });
}
