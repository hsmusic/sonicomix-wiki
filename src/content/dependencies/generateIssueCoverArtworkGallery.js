export default {
  contentDependencies: ['linkContribution', 'generateArtworkGallery'],
  extraDependencies: ['language'],

  relations: (relation, issue) => ({
    artworkGallery:
      relation('generateArtworkGallery'),

    artistLinks:
      issue.covers
        .map(cover => cover.contribs
          .map(contrib => relation('linkContribution', contrib))),
  }),

  data: (issue) => ({
    names:
      issue.covers.map(cover => cover.shortName),

    directories:
      issue.covers.map(cover => cover.directory),

    paths:
      issue.covers.map(cover => [
        'media.issueCover',
        issue.publisher.directory,
        issue.directory,
        cover.directory,
        cover.extension,
      ]),
  }),

  generate: (data, relations, {language}) =>
    relations.artworkGallery.slots({
      names: data.names,
      paths: data.paths,
      ids: data.directories,

      infos:
        relations.artistLinks.map(links =>
          language.$('issuePage.coverGallery.coverBy', {
            artists:
              language.formatConjunctionList(
                links.map(link =>
                  link.slots({
                    showAnnotation: true,
                    showChronology: true,
                  }))),
          })),
    }),
}
