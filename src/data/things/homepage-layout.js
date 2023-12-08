import {input} from '#composite';
import find from '#find';

import {
  is,
  isCountingNumber,
  isString,
  isStringNonEmpty,
  oneOf,
  validateArrayItems,
  validateInstanceOf,
  validateReference,
} from '#validators';

import {exposeDependency} from '#composite/control-flow';
import {withResolvedReference} from '#composite/wiki-data';

import {
  color,
  name,
  referenceList,
  simpleString,
  wikiData,
} from '#composite/wiki-properties';

import Thing from './thing.js';

export class HomepageLayout extends Thing {
  static [Thing.friendlyName] = `Homepage Layout`;

  static [Thing.getPropertyDescriptors] = ({HomepageLayoutRow}) => ({
    // Update & expose

    sidebarContent: simpleString(),

    navbarLinks: {
      flags: {update: true, expose: true},
      update: {validate: validateArrayItems(isStringNonEmpty)},
    },

    rows: {
      flags: {update: true, expose: true},

      update: {
        validate: validateArrayItems(validateInstanceOf(HomepageLayoutRow)),
      },
    },
  })
}

export class HomepageLayoutRow extends Thing {
  static [Thing.friendlyName] = `Homepage Row`;

  static [Thing.getPropertyDescriptors] = ({Publisher, Story}) => ({
    // Update & expose

    name: name('Unnamed Homepage Row'),

    type: {
      flags: {update: true, expose: true},

      update: {
        validate() {
          throw new Error(`'type' property validator must be overridden`);
        },
      },
    },

    color: color(),

    // Update only

    // These wiki data arrays aren't necessarily used by every subclass, but
    // to the convenience of providing these, the superclass accepts all wiki
    // data arrays depended upon by any subclass.

    publisherData: wikiData({
      class: input.value(Publisher),
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),
  });
}
