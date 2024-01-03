export default {
  contentDependencies: ['linkCharacter'],
  extraDependencies: ['html', 'language'],

  relations: (relation, feature) =>
    ({characterLink:
        relation('linkCharacter', feature.who)}),

  data: (feature) =>
    ({how: feature.how}),

  slots: {
    showHow: {type: 'boolean', default: true},
    preventWrapping: {type: 'boolean', default: true},
  },

  generate(data, relations, slots, {html, language}) {
    const hasHow = !!(slots.showHow && data.how);

    const parts = ['misc.featuredCharacterLink'];
    const options = {character: relations.characterLink};

    if (hasHow) {
      parts.push('withHow');
      options.how = language.sanitize(data.how);
    }

    let content = language.formatString(parts.join('.'), options);

    if (hasHow) {
      content =
        html.tag('span', {
          class: [
            'featured-character',

            parts.length > 1 &&
            slots.preventWrapping &&
              'nowrap',
          ],
        }, content);
    }

    return content;
  }
};
