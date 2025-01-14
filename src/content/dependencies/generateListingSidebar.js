export default {
  contentDependencies: [
    'generateListingIndexList',
    'generatePageSidebar',
    'generatePageSidebarBox',
    'linkListingIndex',
  ],

  extraDependencies: ['html'],

  relations: (relation, currentListing) => ({
    sidebar:
      relation('generatePageSidebar'),

    sidebarBox:
      relation('generatePageSidebarBox'),

    listingIndexLink:
      relation('linkListingIndex'),

    listingIndexList:
      relation('generateListingIndexList', currentListing),
  }),

  generate: (relations, {html}) =>
    relations.sidebar.slots({
      boxes: [
        relations.sidebarBox.slots({
          attributes: {class: 'listing-map-sidebar-box'},
          content: [
            html.tag('h1', relations.listingIndexLink),
            relations.listingIndexList.slot('mode', 'sidebar'),
          ],
        }),
      ],
    }),
};
