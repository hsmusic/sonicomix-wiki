import {empty} from '#sugar';

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

    dates: {
      validate: v => v.sparseArrayOf(v.isDate),
    },

    duration: {validate: v => v.isDuration},
    durationApproximate: {type: 'boolean'},
  },

  generate(slots, {html, language}) {
    let earliestDate = null;
    let latestDate = null;
    let onlyDate = null;

    if (!empty(slots.dates)) {
      earliestDate =
        slots.dates
          .reduce((a, b) => a <= b ? a : b);

      latestDate =
        slots.dates
          .reduce((a, b) => a <= b ? b : a);

      if (+earliestDate === +latestDate) {
        onlyDate = earliestDate;
      }
    }

    let accentedLink;

    accent: {
      switch (slots.mode) {
        case 'issue': {
          const options = {issue: slots.issueLink};
          const parts = ['artistPage.creditList.issue'];

          if (onlyDate) {
            parts.push('withDate');
            options.date = language.formatDate(onlyDate);
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
