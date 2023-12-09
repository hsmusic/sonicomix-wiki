export const HOMEPAGE_LAYOUT_DATA_FILE = 'homepage.yaml';

import Thing from '#thing';
import {isStringNonEmpty, validateArrayItems, validateInstanceOf}
  from '#validators';

import {color, contentString, name} from '#composite/wiki-properties';

export class HomepageLayout extends Thing {
  static [Thing.friendlyName] = `Homepage Layout`;

  static [Thing.getPropertyDescriptors] = ({HomepageLayoutRow}) => ({
    // Update & expose

    sidebarContent: contentString(),

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
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Homepage': {ignore: true},

      'Sidebar Content': {property: 'sidebarContent'},
      'Navbar Links': {property: 'navbarLinks'},
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {headerAndEntries}, // Kludge, see below
    thingConstructors: {
      HomepageLayout,
    },
  }) => ({
    title: `Process homepage layout file`,

    // Kludge: This benefits from the same headerAndEntries style messaging as
    // albums and tracks (for example), but that document mode is designed to
    // support multiple files, and only one is actually getting processed here.
    files: [HOMEPAGE_LAYOUT_DATA_FILE],

    documentMode: headerAndEntries,
    headerDocumentThing: HomepageLayout,
    entryDocumentThing: document => {
      switch (document['Type']) {
        default:
          throw new TypeError(`No processDocument function for row type ${document['Type']}!`);
      }
    },

    save(results) {
      if (!results[0]) {
        return;
      }

      const {header: homepageLayout, entries: rows} = results[0];
      Object.assign(homepageLayout, {rows});
      return {homepageLayout};
    },
  });
}

export class HomepageLayoutRow extends Thing {
  static [Thing.friendlyName] = `Homepage Row`;

  static [Thing.getPropertyDescriptors] = () => ({
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

    /* no wiki data arrays */
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Row': {property: 'name'},
      'Color': {property: 'color'},
      'Type': {property: 'type'},
    },
  };
}
