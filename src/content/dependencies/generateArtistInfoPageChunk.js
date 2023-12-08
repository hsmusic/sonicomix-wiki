import {empty} from '#sugar';

export default {
  slots: {
    mode: {
      validate: v => v.is('issue'),
    },

    id: {type: 'string'},

    link: {
      type: 'html',
      mutable: false,
    },

    list: {
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

    let accentedLink = null;

    accent: {
      switch (slots.mode) {
        case 'issue': {
          const options = {issue: slots.link};
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
      html.tag('dt',
        slots.id && {id: slots.id},
        accentedLink),

      html.tag('dd', slots.list),
    ]);
  },
};
