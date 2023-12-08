export const CHARACTER_DATA_FILE = 'characters.yaml';

import {input} from '#composite';
import find from '#find';
import {empty, stitchArrays} from '#sugar';
import Thing from '#thing';
import {filterMultipleArrays} from '#wiki-data';
import {parseAnnotatedReferences} from '#yaml';

import {
  annotatedReferenceList,
  color,
  directory,
  name,
  reverseAnnotatedReferenceList,
  referenceList,
  shortName,
  wikiData,
} from '#composite/wiki-properties';

export class Character extends Thing {
  static [Thing.referenceType] = 'story';

  static [Thing.getPropertyDescriptors] = ({Story}) => ({
    // Update & expose

    name: name('Unnamed Character'),
    shortName: shortName(),
    directory: directory(),
    color: color(),

    groupedCharacters: annotatedReferenceList({
      class: input.value(Character),
      find: input.value(find.character),
      data: 'characterData',

      reference: input.value('character'),
      thing: input.value('character'),
    }),

    // Update only

    characterData: wikiData({
      class: input.value(Character),
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),

    // Expose only

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

    save: (results) => ({characterData: results}),
  });
}
