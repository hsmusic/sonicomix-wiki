export default {
  extraDependencies: ['html', 'language'],

  slots: {
    content: {
      type: 'html',
      mutable: false,
    },

    contribution: {
      type: 'html',
      mutable: false,
    },

    otherArtistLinks: {
      validate: v => v.strictArrayOf(v.isHTML),
    },

    reissue: {type: 'boolean'},
  },

  generate(slots, {html, language}) {
    let accentedContent = slots.content;

    accent: {
      const parts = ['artistPage.creditList.entry'];
      const options = {entry: slots.content};

      if (slots.reissue) {
        parts.push('reissue');
      } else if (slots.otherArtistLinks) {
        parts.push('withArtists');
        options.artists = language.formatConjunctionList(slots.otherArtistLinks);
      }

      if (!html.isBlank(slots.contribution)) {
        parts.push('withContribution');
        options.contribution = slots.contribution;
      }

      if (parts.length === 1) {
        break accent;
      }

      accentedContent = language.formatString(...parts, options);
    }

    return (
      html.tag('li',
        slots.reissue && {class: 'reissue'},
        accentedContent));
  },
};
