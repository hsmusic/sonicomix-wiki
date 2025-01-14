export default {
  contentDependencies: [
    'generateColorStyleAttribute',
    'generateInterpageDotSwitcher',
    'generateNextLink',
    'generatePreviousLink',
    'linkAlbumDynamically',
    'linkGroup',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation) => ({
    switcher:
      relation('generateInterpageDotSwitcher'),

    previousLink:
      relation('generatePreviousLink'),

    nextLink:
      relation('generateNextLink'),
  }),

  slots: {
    showPreviousNext: {
      type: 'boolean',
      default: true,
    },

    id: {
      type: 'boolean',
      default: false,
    },

    attributes: {
      type: 'attributes',
      mutable: false,
    },

    colorStyle: {
      type: 'html',
      mutable: true,
    },

    mainLink: {
      type: 'html',
      mutable: true,
    },

    previousLink: {
      type: 'html',
      mutable: false,
    },

    nextLink: {
      type: 'html',
      mutable: false,
    },

    stringsKey: {
      type: 'string',
    },

    mainLinkOption: {
      type: 'string',
    },
  },

  generate: (relations, slots, {html, language}) =>
    html.tag('span',
      {[html.onlyIfContent]: true},

      slots.attributes,

      !html.isBlank(slots.colorStyle) &&
        slots.colorStyle
          .slot('context', 'primary-only'),

      language.encapsulate(slots.stringsKey, workingCapsule => {
        const workingOptions = {
          [language.onlyIfOptions]: [slots.mainLinkOption],
        };

        workingOptions[slots.mainLinkOption] =
          (html.isBlank(slots.mainLink)
            ? null
            : slots.mainLink
                .slot('color', false));

        if (slots.showPreviousNext) addPreviousNext: {
          if (html.isBlank(slots.previousLink) && html.isBlank(slots.nextLink)) {
            break addPreviousNext;
          }

          workingCapsule += '.withPreviousNext';
          workingOptions.previousNext =
            relations.switcher.slots({
              links: [
                relations.previousLink.slots({
                  id: slots.id,
                  link: slots.previousLink,
                }),

                relations.nextLink.slots({
                  id: slots.id,
                  link: slots.nextLink,
                }),
              ],
            });
        }

        return language.$(workingCapsule, workingOptions);
      })),
};
