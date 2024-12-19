export default {
  contentDependencies: [
    'linkAlbumCommentary',
    'linkAlbumGallery',
    'linkAlbum',
  ],

  extraDependencies: ['html', 'pagePath'],

  relations: (relation, album) => ({
    galleryLink:
      relation('linkAlbumGallery', album),

    infoLink:
      relation('linkAlbum', album),

    commentaryLink:
      relation('linkAlbumCommentary', album),
  }),

  data: (album) => ({
    albumDirectory:
      album.directory,

    albumHasCommentary:
      !!album.commentary,
  }),

  slots: {
    linkCommentaryPages: {
      type: 'boolean',
      default: false,
    },
  },

  generate: (data, relations, slots, {pagePath}) =>
     // When linking to an album *from* an album commentary page,
     // if the link is to the *same* album, then the effective target
     // of the link is really the album's commentary, so scroll to it.
    (pagePath[0] === 'albumCommentary' &&
     pagePath[1] === data.albumDirectory &&
     data.albumHasCommentary
      ? relations.infoLink.slots({
          anchor: true,
          hash: 'album-commentary',
        })

     // When linking to *another* album from an album commentary page,
     // the target is (by default) still just the album (its info page).
     // But this can be customized per-link!
   : pagePath[0] === 'albumCommentary' &&
     slots.linkCommentaryPages
      ? relations.commentaryLink

   : pagePath[0] === 'albumGallery'
      ? relations.galleryLink

      : relations.infoLink),
};
