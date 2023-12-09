export default {
  contentDependencies: ['image'],
  extraDependencies: ['html'],

  relations(relation) {
    const relations = {};

    relations.image =
      relation('image');

    return relations;
  },

  slots: {
    path: {
      validate: v => v.validateArrayItems(v.isString),
    },

    alt: {
      type: 'string',
    },

    color: {
      validate: v => v.isColor,
    },

    mode: {
      validate: v => v.is('primary', 'thumbnail', 'commentary'),
      default: 'primary',
    },
  },

  generate(relations, slots, {html}) {
    switch (slots.mode) {
      case 'primary':
        return relations.image.slots({
          path: slots.path,
          alt: slots.alt,
          color: slots.color,
          thumb: 'medium',
          id: 'cover-art',
          reveal: true,
          link: true,
          square: true,
        });

      case 'thumbnail':
        return relations.image.slots({
          path: slots.path,
          alt: slots.alt,
          color: slots.color,
          thumb: 'small',
          reveal: false,
          link: false,
          square: true,
        });

      case 'commentary':
        return relations.image.slots({
          path: slots.path,
          alt: slots.alt,
          color: slots.color,
          thumb: 'medium',
          class: 'commentary-art',
          reveal: true,
          link: true,
          square: true,
          lazy: true,
        });

      default:
        return html.blank();
    }
  },
};
