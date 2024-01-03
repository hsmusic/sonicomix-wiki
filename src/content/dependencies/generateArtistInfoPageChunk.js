export default {
  extraDependencies: ['html', 'language'],

  slots: {
    mode: {
      validate: v => v.is('issue'),
    },

    issueLink: {
      type: 'html',
      mutable: false,
    },

    items: {
      type: 'html',
      mutable: false,
    },

    date: {validate: v => v.isDate},
    dateRangeStart: {validate: v => v.isDate},
    dateRangeEnd: {validate: v => v.isDate},

    duration: {validate: v => v.isDuration},
    durationApproximate: {type: 'boolean'},
  },

  generate(slots, {html, language}) {
    let accentedLink;

    accent: {
      switch (slots.mode) {
        case 'issue': {
          const options = {issue: slots.issueLink};
          const parts = ['artistPage.creditList.issue'];

          if (slots.date) {
            parts.push('withDate');
            options.date = language.formatDate(slots.date);
          }

          accentedLink = language.formatString(...parts, options);
          break;
        }
      }
    }

    return html.tags([
      html.tag('dt', accentedLink),
      html.tag('dd',
        html.tag('ul',
          slots.items)),
    ]);
  },
};
