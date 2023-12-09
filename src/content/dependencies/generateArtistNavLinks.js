export default {
  contentDependencies: [
    'generateInterpageDotSwitcher',
    'linkArtist',
    'linkArtistGallery',
  ],

  extraDependencies: ['html', 'language', 'wikiData'],

  sprawl: ({wikiInfo}) => ({
    enableListings:
      wikiInfo.enableListings,
  }),

  relations: (relation, _sprawl, artist) => ({
    switcher:
      relation('generateInterpageDotSwitcher'),

    artistMainLink:
      relation('linkArtist', artist),

    artistInfoLink:
      relation('linkArtist', artist),
  }),

  data: (sprawl) => ({
    enableListings:
      sprawl.enableListings,
  }),

  slots: {
    showExtraLinks: {type: 'boolean', default: false},

    currentExtra: {
      validate: v => v.is('gallery'),
    },
  },

  generate: (data, relations, slots, {html, language}) => [
    {auto: 'home'},

    data.enableListings &&
      {
        path: ['localized.listingIndex'],
        title: language.$('listingIndex.title'),
      },

    {
      html:
        language.$('artistPage.nav.artist', {
          artist: relations.artistMainLink,
        }),

      accent:
        relations.switcher.slots({
          links: [
            relations.artistInfoLink.slots({
              attributes: [
                slots.currentExtra === null &&
                  {class: 'current'},

                {[html.onlyIfSiblings]: true},
              ],

              content: language.$('misc.nav.info'),
            }),

            slots.showExtraLinks &&
              relations.artistGalleryLink?.slots({
                attributes: [
                  slots.currentExtra === 'gallery' &&
                    {class: 'current'},
                ],

                content: language.$('misc.nav.gallery'),
              }),
          ],
        }),
    },
  ],
};
