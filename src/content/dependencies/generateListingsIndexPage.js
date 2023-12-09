export default {
  contentDependencies: [
    'generateListingIndexList',
    'generateListingSidebar',
    'generatePageLayout',
  ],

  extraDependencies: ['html', 'language', 'wikiData'],

  sprawl({wikiInfo}) {
    return {
      wikiName: wikiInfo.name,
    };
  },

  relations(relation) {
    const relations = {};

    relations.layout =
      relation('generatePageLayout');

    relations.sidebar =
      relation('generateListingSidebar', null);

    relations.list =
      relation('generateListingIndexList', null);

    return relations;
  },

  data(sprawl) {
    return {
      wikiName: sprawl.wikiName,
    };
  },

  generate(data, relations, {html, language}) {
    return relations.layout.slots({
      title: language.$('listingIndex.title'),

      headingMode: 'static',

      mainContent: [
        html.tag('p',
          language.$('listingIndex.infoLine', {
            wiki: data.wikiName,
          })),

        html.tag('hr'),

        html.tag('p',
          language.$('listingIndex.exploreList')),

        relations.list.slot('mode', 'content'),
      ],

      navLinkStyle: 'hierarchical',
      navLinks: [
        {auto: 'home'},
        {auto: 'current'},
      ],

      leftSidebar: relations.sidebar,
    });
  },
};
