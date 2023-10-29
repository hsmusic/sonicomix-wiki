import {empty} from '#sugar';

export default {
  contentDependencies: [
    'generateListingPage',
    'generateListRandomPageLinksAllAlbumsSection',
    'generateListRandomPageLinksGroupSection',
  ],

  extraDependencies: ['html', 'language', 'wikiData'],

  sprawl: ({wikiInfo}) => ({wikiInfo}),

  query: ({wikiInfo: {divideTrackListsByGroups: groups}}, spec) => ({
    spec,
    groups,
    divideByGroups: !empty(groups),
  }),

  relations: (relation, query) => ({
    page: relation('generateListingPage', query.spec),

    allAlbumsSection:
      (query.divideByGroups
        ? null
        : relation('generateListRandomPageLinksAllAlbumsSection')),

    groupSections:
      (query.divideByGroups
        ? query.groups
            .map(group => relation('generateListRandomPageLinksGroupSection', group))
        : null),
  }),

  generate(relations, {html, language}) {
    return relations.page.slots({
      type: 'custom',
      content: [
        html.tag('p',
          language.$('listingPage.other.randomPages.chooseLinkLine')),

        html.tag('p',
          {class: 'js-hide-once-data'},
          language.$('listingPage.other.randomPages.dataLoadingLine')),

        html.tag('p',
          {class: 'js-show-once-data'},
          language.$('listingPage.other.randomPages.dataLoadedLine')),

        html.tag('dl', [
          html.tag('dt',
            language.$('listingPage.other.randomPages.misc')),

          html.tag('dd',
            html.tag('ul', [
              html.tag('li', [
                html.tag('a',
                  {href: '#', 'data-random': 'artist'},
                  language.$('listingPage.other.randomPages.misc.randomArtist')),

                '(' +
                html.tag('a',
                  {href: '#', 'data-random': 'artist-more-than-one-contrib'},
                  language.$('listingPage.other.randomPages.misc.atLeastTwoContributions')) +
                ')',
              ]),

              html.tag('li',
                html.tag('a',
                  {href: '#', 'data-random': 'album'},
                  language.$('listingPage.other.randomPages.misc.randomAlbumWholeSite'))),

              html.tag('li',
                html.tag('a',
                  {href: '#', 'data-random': 'track'},
                  language.$('listingPage.other.randomPages.misc.randomTrackWholeSite'))),
            ])),

          relations.allAlbumsSection,
          relations.groupSections,
        ]),
      ],
    });
  },
};
