import {sortChronologically} from '#wiki-data';

export default {
  contentDependencies: ['generateListRandomPageLinksAlbumLink', 'linkGroup'],
  extraDependencies: ['html', 'language', 'wikiData'],

  sprawl: ({albumData}) => ({albumData}),

  query: (sprawl, group) => ({
    albums:
      sortChronologically(sprawl.albumData.slice())
        .filter(album => album.groups.includes(group))
        .filter(album => album.tracks.length > 1),
  }),

  relations: (relation, query, sprawl, group) => ({
    groupLink:
      relation('linkGroup', group),

    albumLinks:
      query.albums
        .map(album => relation('generateListRandomPageLinksAlbumLink', album)),
  }),

  generate: (relations, {html, language}) =>
    html.tags([
      html.tag('dt',
        language.$('listingPage.other.randomPages.fromGroup', {
          group: relations.groupLink,

          randomAlbum:
            html.tag('a',
              {href: '#', 'data-random': 'album-in-group-dl'},
              language.$('listingPage.other.randomPages.fromGroup.randomAlbum')),

          randomTrack:
            html.tag('a',
              {href: '#', 'data-random': 'track-in-group-dl'},
              language.$('listingPage.other.randomPages.fromGroup.randomTrack')),
        })),

      html.tag('dd',
        html.tag('ul',
          relations.albumLinks
            .map(albumLink =>
              html.tag('li',
                language.$('listingPage.other.randomPages.album', {
                  album: albumLink,
                }))))),
    ]),
};
