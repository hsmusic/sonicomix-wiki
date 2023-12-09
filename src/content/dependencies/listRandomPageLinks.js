export default {
  contentDependencies: [
    'generateListingPage',
  ],

  extraDependencies: ['html', 'language'],

  query(spec) {
    const query = {spec};

    return query;
  },

  relations(relation, query) {
    const relations = {};

    relations.page =
      relation('generateListingPage', query.spec);

    return relations;
  },

  generate(relations, {html, language}) {
    const capsule = language.encapsulate('listingPage.other.randomPages');

    const miscellaneousChunkRows = [
      language.encapsulate(capsule, 'chunk.item.randomArtist', capsule => ({
        stringsKey: 'randomArtist',

        mainLink:
          html.tag('a',
            {href: '#', 'data-random': 'artist'},
            language.$(capsule, 'mainLink')),

        atLeastTwoContributions:
          html.tag('a',
            {href: '#', 'data-random': 'artist-more-than-one-contrib'},
            language.$(capsule, 'atLeastTwoContributions')),
      })),
    ];

    const miscellaneousChunkRowAttributes = [
      null,
    ];

    return relations.page.slots({
      type: 'chunks',

      content: [
        html.tag('p',
          language.encapsulate(capsule, 'chooseLinkLine', capsule =>
            language.$(capsule, {
              browserSupportPart:
                language.$(capsule, 'browserSupportPart'),
            }))),

        html.tag('p', {id: 'data-loading-line'},
          language.$(capsule, 'dataLoadingLine')),

        html.tag('p', {id: 'data-loaded-line'},
          language.$(capsule, 'dataLoadedLine')),

        html.tag('p', {id: 'data-error-line'},
          language.$(capsule, 'dataErrorLine')),
      ],

      chunkTitles: [
        {stringsKey: 'misc'},
      ],

      chunkRows: [
        miscellaneousChunkRows,
      ],

      chunkRowAttributes: [
        miscellaneousChunkRowAttributes,
      ],
    });
  },
};
