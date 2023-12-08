import {stitchArrays} from '#sugar';

export default {
  contentDependencies: ['image'],
  extraDependencies: ['html'],

  relations: (relation) => ({
    image: relation('image'),
  }),

  slots: {
    names: {
      validate: v =>
        v.strictArrayOf(v.isHTML),
    },

    paths: {
      validate: v =>
        v.strictArrayOf(
          v.validateArrayItems(v.isString)),
    },

    alts: {
      validate: v =>
        v.strictArrayOf(v.isString),
    },

    infos: {
      validate: v =>
        v.strictArrayOf(v.isHTML),
    },

    color: {
      validate: v => v.isColor,
    },

    mode: {
      validate: v => v.is('primary', 'thumbnail'),
      default: 'primary',
    },
  },

  generate(relations, slots, {html}) {
    const alts =
      slots.alts ??
        Array.from({length: slots.paths.length}, () => null);

    const infos =
      slots.infos ??
        Array.from({length: slots.paths.length}, () => null);

    switch (slots.mode) {
      case 'primary':
        return (
          html.tag('div', {
            id: 'cover-gallery',
            class: 'artwork-gallery'
          }, [
            html.tag('div', {class: 'artwork-gallery-nav'},
              slots.names
                .map((name, index) =>
                  html.tag('a', {
                    href: '#',
                    class: index === 0 && 'current',
                  }, name))),

            html.tag('div', {class: 'artwork-gallery-pages'},
              stitchArrays({
                path: slots.paths,
                alt: alts,
                info: infos,
              }).map(({path, alt, info}, index) =>
                  html.tag('div', {
                    class: [
                      'artwork-gallery-page',
                      index === 0 && 'current',
                    ],
                  }, [
                    relations.image.clone().slots({
                      path,
                      alt,
                      color: slots.color,
                      thumb: 'medium',
                      id: 'cover-gallery',
                      reveal: true,
                      link: true,
                    }),

                    html.tag('p', {
                      [html.onlyIfContent]: true,
                      class: 'artwork-gallery-info',
                    }, info),
                  ]))),
          ]));

      case 'thumbnail':
        return relations.image.slots({
          path: slots.paths[0],
          alt: alts[0],
          color: slots.color,
          thumb: 'small',
          reveal: false,
          link: false,
        });
    }
  },
};
