export default {
  contentDependencies: ['linkArtistGallery'],
  extraDependencies: ['html', 'language'],

  relations: (relation, contributions) => ({
    artistLinks:
      contributions
        .map(contrib => contrib.artist)
        .map(artist =>
          relation('linkArtistGallery', artist)),
  }),

  generate: (relations, {html, language}) =>
    html.tag('p', {class: 'image-details'},
      {[html.onlyIfContent]: true},

      {class: 'illustrator-details'},

      language.$('misc.coverGrid.details.coverArtists', {
        artists:
          language.formatConjunctionList(relations.artistLinks),
      })),
};
