export default {
  contentDependencies: [
    'generateCoverArtwork',
    'generateCoverArtworkArtTagDetails',
    'generateCoverArtworkArtistDetails',
    'generateCoverArtworkReferenceDetails',
    'image',
    'linkAlbum',
    'linkTrackReferencedArtworks',
    'linkTrackReferencingArtworks',
  ],

  extraDependencies: ['html', 'language'],

  query: (track) => ({
    artTags:
      (track.hasUniqueCoverArt
        ? track.artTags
        : track.album.artTags),

    coverArtistContribs:
      (track.hasUniqueCoverArt
        ? track.coverArtistContribs
        : track.album.coverArtistContribs),
  }),

  relations: (relation, query, track) => ({
    coverArtwork:
      relation('generateCoverArtwork'),

    image:
      relation('image'),

    artTagDetails:
      relation('generateCoverArtworkArtTagDetails',
        query.artTags),

    artistDetails:
      relation('generateCoverArtworkArtistDetails',
        query.coverArtistContribs),

    referenceDetails:
      relation('generateCoverArtworkReferenceDetails',
        track.referencedArtworks,
        track.referencedByArtworks),

    referencedArtworksLink:
      relation('linkTrackReferencedArtworks', track),

    referencingArtworksLink:
      relation('linkTrackReferencingArtworks', track),

    albumLink:
      relation('linkAlbum', track.album),
  }),

  data: (query, track) => ({
    path:
      (track.hasUniqueCoverArt
        ? ['media.trackCover', track.album.directory, track.directory, track.coverArtFileExtension]
        : ['media.albumCover', track.album.directory, track.album.coverArtFileExtension]),

    color:
      track.color,

    dimensions:
      (track.hasUniqueCoverArt
        ? track.coverArtDimensions
        : track.album.coverArtDimensions),

    nonUnique:
      !track.hasUniqueCoverArt,

    warnings:
      query.artTags
        .filter(tag => tag.isContentWarning)
        .map(tag => tag.name),
  }),

  slots: {
    mode: {type: 'string'},

    details: {
      validate: v => v.is('tags', 'artists'),
      default: 'tags',
    },

    showReferenceLinks: {
      type: 'boolean',
      default: false,
    },

    showNonUniqueLine: {
      type: 'boolean',
      default: false,
    },
  },

  generate: (data, relations, slots, {html, language}) =>
    relations.coverArtwork.slots({
      mode: slots.mode,

      image:
        relations.image.slots({
          path: data.path,
          color: data.color,
          alt: language.$('misc.alt.trackCover'),
        }),

      dimensions: data.dimensions,
      warnings: data.warnings,

      details: [
        slots.details === 'tags' &&
          relations.artTagDetails,

        slots.details === 'artists'&&
          relations.artistDetails,

        slots.showReferenceLinks &&
          relations.referenceDetails.slots({
            referencedLink:
              relations.referencedArtworksLink,

            referencingLink:
              relations.referencingArtworksLink,
          }),

        slots.showNonUniqueLine &&
        data.nonUnique &&
          html.tag('p', {class: 'image-details'},
            {class: 'non-unique-details'},

            language.$('misc.trackArtFromAlbum', {
              album:
                relations.albumLink.slots({
                  color: false,
                }),
            })),
      ],
    }),
};

