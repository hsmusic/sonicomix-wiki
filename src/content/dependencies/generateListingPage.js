import {empty, stitchArrays} from '../../util/sugar.js';

export default {
  contentDependencies: [
    'generateContentHeading',
    'generateListingSidebar',
    'generatePageLayout',
    'linkListing',
    'linkListingIndex',
  ],

  extraDependencies: ['html', 'language', 'wikiData'],

  relations(relation, listing) {
    const relations = {};

    relations.layout =
      relation('generatePageLayout');

    relations.sidebar =
      relation('generateListingSidebar', listing);

    relations.listingsIndexLink =
      relation('linkListingIndex');

    relations.chunkHeading =
      relation('generateContentHeading');

    if (listing.target.listings.length > 1) {
      relations.sameTargetListingLinks =
        listing.target.listings
          .map(listing => relation('linkListing', listing));
    }

    if (!empty(listing.seeAlso)) {
      relations.seeAlsoLinks =
        listing.seeAlso
          .map(listing => relation('linkListing', listing));
    }

    return relations;
  },

  data(listing) {
    return {
      stringsKey: listing.stringsKey,

      targetStringsKey: listing.target.stringsKey,

      sameTargetListingStringsKeys:
        listing.target.listings
          .map(listing => listing.stringsKey),

      sameTargetListingsCurrentIndex:
        listing.target.listings
          .indexOf(listing),
    };
  },

  slots: {
    type: {validate: v => v.is('rows', 'chunks', 'custom')},

    rows: {validate: v => v.arrayOf(v.isObject)},

    chunkTitles: {validate: v => v.arrayOf(v.isObject)},
    chunkRows: {validate: v => v.arrayOf(v.isObject)},

    content: {type: 'html'},
  },

  generate(data, relations, slots, {html, language}) {
    return relations.layout.slots({
      title: language.$(`listingPage.${data.stringsKey}.title`),
      headingMode: 'sticky',

      mainContent: [
        relations.sameTargetListingLinks &&
          html.tag('p',
            language.$('listingPage.listingsFor', {
              target: language.$(`listingPage.target.${data.targetStringsKey}`),
              listings:
                language.formatUnitList(
                  stitchArrays({
                    link: relations.sameTargetListingLinks,
                    stringsKey: data.sameTargetListingStringsKeys,
                  }).map(({link, stringsKey}, index) =>
                      html.tag('span',
                        {class: index === data.sameTargetListingsCurrentIndex && 'current'},
                        link.slots({
                          attributes: {class: 'nowrap'},
                          content: language.$(`listingPage.${stringsKey}.title.short`),
                        })))),
            })),

        relations.seeAlsoLinks &&
          html.tag('p',
            language.$('listingPage.seeAlso', {
              listings: language.formatUnitList(relations.seeAlsoLinks),
            })),

        slots.type === 'rows' &&
          html.tag('ul',
            slots.rows.map(row =>
              html.tag('li',
                language.$(`listingPage.${data.stringsKey}.item`, row)))),

        slots.type === 'chunks' &&
          html.tag('dl',
            stitchArrays({
              title: slots.chunkTitles,
              rows: slots.chunkRows,
            }).map(({title, rows}) => [
                relations.chunkHeading
                  .clone()
                  .slots({
                    tag: 'dt',
                    title:
                      language.$(`listingPage.${data.stringsKey}.chunk.title`, title),
                  }),

                html.tag('dd',
                  html.tag('ul',
                    rows.map(row =>
                      html.tag('li',
                        language.$(`listingPage.${data.stringsKey}.chunk.item`, row))))),
              ])),

        slots.type === 'custom' &&
          slots.content,
      ],

      navLinkStyle: 'hierarchical',
      navLinks: [
        {auto: 'home'},
        {html: relations.listingsIndexLink},
        {auto: 'current'},
      ],

      ...relations.sidebar,
    });
  },
};