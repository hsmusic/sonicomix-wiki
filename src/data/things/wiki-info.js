export const WIKI_INFO_FILE = 'wiki-info.yaml';

import {input, V} from '#composite';
import Thing from '#thing';
import {parseContributionPresets, parseWallpaperParts} from '#yaml';

import {
  isBoolean,
  isContributionPresetList,
  isLanguageCode,
  isName,
  isNumber,
} from '#validators';

import {exitWithoutDependency, exposeConstant} from '#composite/control-flow';

import {
  canonicalBase,
  color,
  contentString,
  fileExtension,
  flag,
  name,
  simpleString,
  soupyFind,
  wallpaperParts,
} from '#composite/wiki-properties';

export class WikiInfo extends Thing {
  static [Thing.friendlyName] = `Wiki Info`;
  static [Thing.wikiData] = 'wikiInfo';
  static [Thing.oneInstancePerWiki] = true;

  static [Thing.getPropertyDescriptors] = () => ({
    // Update & expose

    name: name(V('Unnamed Wiki')),

    // Displayed in nav bar.
    nameShort: {
      flags: {update: true, expose: true},
      update: {validate: isName},

      expose: {
        dependencies: ['name'],
        transform: (value, {name}) => value ?? name,
      },
    },

    color: color(V('#0088ff')),

    // One-line description used for <meta rel="description"> tag.
    description: contentString(),

    footerContent: contentString(),

    defaultLanguage: {
      flags: {update: true, expose: true},
      update: {validate: isLanguageCode},
    },

    canonicalBase: canonicalBase(),
    canonicalMediaBase: canonicalBase(),

    wikiWallpaperBrightness: {
      flags: {update: true, expose: true},
      update: {validate: isNumber},
    },

    wikiWallpaperFileExtension: fileExtension(V('jpg')),
    wikiWallpaperStyle: simpleString(),
    wikiWallpaperParts: wallpaperParts(),

    contributionPresets: {
      flags: {update: true, expose: true},
      update: {validate: isContributionPresetList},
    },

    // Feature toggles

    enableListings: flag(V(false)),
    enableNews: flag(V(false)),

    enableSearch: [
      exitWithoutDependency('_searchDataAvailable', {
        value: input.value(false),
        mode: input.value('falsy'),
      }),

      flag(V(true)),
    ],

    // Update only

    find: soupyFind(),

    searchDataAvailable: {
      flags: {update: true},
      update: {
        validate: isBoolean,
        default: false,
      },
    },

    // Expose only

    isWikiInfo: exposeConstant(V(true)),
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Name': {property: 'name'},
      'Short Name': {property: 'nameShort'},

      'Color': {property: 'color'},

      'Description': {property: 'description'},

      'Footer Content': {property: 'footerContent'},

      'Default Language': {property: 'defaultLanguage'},

      'Canonical Base': {property: 'canonicalBase'},
      'Canonical Media Base': {property: 'canonicalMediaBase'},

      'Wiki Wallpaper Brightness': {property: 'wikiWallpaperBrightness'},
      'Wiki Wallpaper File Extension': {property: 'wikiWallpaperFileExtension'},

      'Wiki Wallpaper Style': {property: 'wikiWallpaperStyle'},

      'Wiki Wallpaper Parts': {
        property: 'wikiWallpaperParts',
        transform: parseWallpaperParts,
      },

      'Enable Listings': {property: 'enableListings'},
      'Enable News': {property: 'enableNews'},

      'Contribution Presets': {
        property: 'contributionPresets',
        transform: parseContributionPresets,
      },
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {oneDocumentTotal},
    thingConstructors: {WikiInfo},
  }) => ({
    title: `Process wiki info file`,
    file: WIKI_INFO_FILE,

    documentMode: oneDocumentTotal,
    documentThing: WikiInfo,
  });
}
