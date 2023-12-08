export default {
  contentDependencies: ['linkContribution', 'generateArtworkGallery'],
  extraDependencies: ['language'],

  relations: (relation, issue) => ({
    artworkGallery:
      relation('generateArtworkGallery'),

    artistLinks:
      issue.coverArtworks
        .map(artwork => artwork.artistContribs
          .map(contrib => relation('linkContribution', contrib))),
  }),

  data: (issue) => ({
    names:
      issue.coverArtworks.map(artwork => artwork.name),

    paths:
      issue.coverArtworks.map(artwork => [
        'media.issueCover',
        issue.publisher.directory,
        issue.directory,
        artwork.directory,
        artwork.extension,
      ]),
  }),

  generate: (data, relations, {language}) =>
    relations.artworkGallery.slots({
      names: data.names,
      paths: data.paths,

      infos:
        relations.artistLinks.map(links =>
          language.$('issuePage.coverGallery.coverBy', {
            artists: language.formatConjunctionList(links),
          })),
    }),
}
