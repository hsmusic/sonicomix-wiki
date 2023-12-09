import {empty} from '#sugar';

export default {
  slots: {
    mode: {
      validate: v => v.is(null),
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

  generate(slots, {html}) {
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
        // eslint-disable-next-line no-unused-vars
        onlyDate = earliestDate;
      }
    }

    let accentedLink = null;

    // eslint-disable-next-line no-empty
    switch (slots.mode) {}

    return html.tags([
      html.tag('dt',
        slots.id && {id: slots.id},
        accentedLink),

      html.tag('dd', slots.list),
    ]);
  },
};
