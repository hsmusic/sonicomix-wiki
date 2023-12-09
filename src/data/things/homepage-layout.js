export const HOMEPAGE_LAYOUT_DATA_FILE = 'homepage.yaml';

import {inspect} from 'node:util';

import {colors} from '#cli';
import {V} from '#composite';
import Thing from '#thing';
import {empty} from '#sugar';
import {isString, isStringNonEmpty, validateArrayItems} from '#validators';

import {exposeConstant} from '#composite/control-flow';
import {color, contentString, name, soupyFind, thing, thingList}
  from '#composite/wiki-properties';

export class HomepageLayout extends Thing {
  static [Thing.friendlyName] = `Homepage Layout`;
  static [Thing.wikiData] = 'homepageLayout';
  static [Thing.oneInstancePerWiki] = true;

  static [Thing.getPropertyDescriptors] = ({HomepageLayoutSection}) => ({
    // Update & expose

    sidebarContent: contentString(),

    navbarLinks: {
      flags: {update: true, expose: true},
      update: {validate: validateArrayItems(isStringNonEmpty)},
      expose: {transform: value => value ?? []},
    },

    sections: thingList(V(HomepageLayoutSection)),

    // Expose only

    isHomepageLayout: exposeConstant(V(true)),
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Homepage': {ignore: true},

      'Sidebar Content': {property: 'sidebarContent'},
      'Navbar Links': {property: 'navbarLinks'},
    },
  };

  static [Thing.getYamlLoadingSpec] = ({
    documentModes: {allInOne},
    thingConstructors: {
      HomepageLayout,
      HomepageLayoutSection,
    },
  }) => ({
    title: `Process homepage layout file`,
    file: HOMEPAGE_LAYOUT_DATA_FILE,

    documentMode: allInOne,
    documentThing: document => {
      if (document['Homepage']) {
        return HomepageLayout;
      }

      if (document['Section']) {
        return HomepageLayoutSection;
      }

      if (document['Row']) {
        switch (document['Row']) {
          case 'actions':
            return HomepageLayoutActionsRow;
          default:
            throw new TypeError(`Unrecognized row type ${document['Row']}`);
        }
      }

      return null;
    },

    connect(results) {
      if (!empty(results) && !(results[0] instanceof HomepageLayout)) {
        throw new Error(`Expected 'Homepage' document at top of homepage layout file`);
      }

      const homepageLayout = results[0];
      const sections = [];

      let currentSection = null;
      let currentSectionRows = [];

      const closeCurrentSection = () => {
        if (currentSection) {
          for (const row of currentSectionRows) {
            row.section = currentSection;
          }

          currentSection.rows = currentSectionRows;
          sections.push(currentSection);

          currentSection = null;
          currentSectionRows = [];
        }
      };

      for (const entry of results.slice(1)) {
        if (entry instanceof HomepageLayout) {
          throw new Error(`Expected only one 'Homepage' document in total`);
        } else if (entry instanceof HomepageLayoutSection) {
          closeCurrentSection();
          currentSection = entry;
        } else if (entry instanceof HomepageLayoutRow) {
          if (currentSection) {
            currentSectionRows.push(entry);
          } else {
            throw new Error(`Expected a 'Section' document to add following rows into`);
          }
        }
      }

      closeCurrentSection();

      homepageLayout.sections = sections;
    },
  });
}

export class HomepageLayoutSection extends Thing {
  static [Thing.friendlyName] = `Homepage Section`;

  static [Thing.getPropertyDescriptors] = ({HomepageLayoutRow}) => ({
    // Update & expose

    name: name(V(`Unnamed Homepage Section`)),

    color: color(),

    rows: thingList(V(HomepageLayoutRow)),

    // Expose only

    isHomepageLayoutSection: exposeConstant(V(true)),
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Section': {property: 'name'},
      'Color': {property: 'color'},
    },
  };
}

export class HomepageLayoutRow extends Thing {
  static [Thing.friendlyName] = `Homepage Row`;

  static [Thing.getPropertyDescriptors] = ({HomepageLayoutSection}) => ({
    // Update & expose

    section: thing(V(HomepageLayoutSection)),

    // Update only

    find: soupyFind(),

    // Expose only

    isHomepageLayoutRow: exposeConstant(V(true)),

    type: {
      flags: {expose: true},

      expose: {
        compute() {
          throw new Error(`'type' property validator must be overridden`);
        },
      },
    },
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Row': {ignore: true},
    },
  };

  [inspect.custom](depth) {
    const parts = [];

    parts.push(Thing.prototype[inspect.custom].apply(this));

    if (depth >= 0 && this.section) {
      const sectionName = this.section.name;
      const index = this.section.rows.indexOf(this);
      const rowNum =
        (index === -1
          ? 'indeterminate position'
          : `#${index + 1}`);
      parts.push(` (${colors.yellow(rowNum)} in ${colors.green(sectionName)})`);
    }

    return parts.join('');
  }
}

export class HomepageLayoutActionsRow extends HomepageLayoutRow {
  static [Thing.friendlyName] = `Homepage Actions Row`;

  static [Thing.getPropertyDescriptors] = () => ({
    // Update & expose

    actionLinks: {
      flags: {update: true, expose: true},
      update: {validate: validateArrayItems(isString)},
    },

    // Expose only

    isHomepageLayoutActionsRow: exposeConstant(V(true)),
    type: exposeConstant(V('actions')),
  });

  static [Thing.yamlDocumentSpec] = {
    fields: {
      'Actions': {property: 'actionLinks'},
    },
  };
}
