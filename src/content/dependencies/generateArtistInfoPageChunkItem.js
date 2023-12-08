import {empty} from '#sugar';

export default {
  relations: (relation) => ({
    textWithTooltip:
      relation('generateTextWithTooltip'),
  }),

  slots: {
    content: {
      type: 'html',
      mutable: false,
    },

    annotation: {
      type: 'html',
      mutable: false,
    },

    otherArtistLinks: {
      validate: v => v.strictArrayOf(v.isHTML),
    },

    reissue: {type: 'boolean'},

    originDetails: {
      type: 'html',
      mutable: false,
    },
  },

  generate: (relations, slots, {html, language}) =>
    language.encapsulate('artistPage.creditList.entry', entryCapsule =>
      html.tag('li',
        slots.reissue && {class: 'reissue'},

        html.tags([
          language.encapsulate(entryCapsule, workingCapsule => {
            const workingOptions = {entry: slots.content};

            if (slots.reissue) {
              workingCapsule += '.reissue';
              return language.$(workingCapsule, workingOptions);
            }

            let anyAccent = false;

            if (!empty(slots.otherArtistLinks)) {
              anyAccent = true;
              workingCapsule += '.withArtists';
              workingOptions.artists =
                language.formatConjunctionList(slots.otherArtistLinks);
            }

            if (!html.isBlank(slots.annotation)) {
              anyAccent = true;
              workingCapsule += '.withAnnotation';
              workingOptions.annotation = slots.annotation;
            }

            if (anyAccent) {
              return language.$(workingCapsule, workingOptions);
            } else {
              return slots.content;
            }
          }),

          html.tag('span', {class: 'origin-details'},
            {[html.onlyIfContent]: true},

            slots.originDetails),
        ]))),
};
