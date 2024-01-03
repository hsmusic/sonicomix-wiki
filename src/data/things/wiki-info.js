import {input} from '#composite';
import find from '#find';
import {isColor, isLanguageCode, isName, isURL} from '#validators';

import {
  flag,
  name,
  referenceList,
  simpleString,
  wikiData,
} from '#composite/wiki-properties';

import Thing from './thing.js';

export class WikiInfo extends Thing {
  static [Thing.friendlyName] = `Wiki Info`;

  static [Thing.getPropertyDescriptors] = () => ({
    // Update & expose

    name: name('Unnamed Wiki'),

    // Displayed in nav bar.
    nameShort: {
      flags: {update: true, expose: true},
      update: {validate: isName},

      expose: {
        dependencies: ['name'],
        transform: (value, {name}) => value ?? name,
      },
    },

    color: {
      flags: {update: true, expose: true},
      update: {validate: isColor},

      expose: {
        transform: color => color ?? '#0088ff',
      },
    },

    // One-line description used for <meta rel="description"> tag.
    description: simpleString(),

    footerContent: simpleString(),

    defaultLanguage: {
      flags: {update: true, expose: true},
      update: {validate: isLanguageCode},
    },

    canonicalBase: {
      flags: {update: true, expose: true},
      update: {validate: isURL},
    },

    // Feature toggles
    enableListings: flag(false),
    enableNews: flag(false),
  });
}
