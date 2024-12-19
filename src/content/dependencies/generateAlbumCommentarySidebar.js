export default {
  contentDependencies: [
    'generateAlbumSidebarTrackSection',
    'generatePageSidebar',
    'generatePageSidebarBox',
    'linkAlbum',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, album) => ({
    sidebar:
      relation('generatePageSidebar'),

    sidebarBox:
      relation('generatePageSidebarBox'),

    albumLink:
      relation('linkAlbum', album),

    trackSections:
      album.trackSections.map(trackSection =>
        relation('generateAlbumSidebarTrackSection',
          album,
          null,
          trackSection)),
  }),

  data: (album) => ({
    albumHasCommentary:
      !!album.commentary,

    anyTrackHasCommentary:
      album.tracks.some(track => track.commentary),
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('albumCommentaryPage', pageCapsule =>
      relations.sidebar.slots({
        stickyMode: 'column',
        boxes: [
          relations.sidebarBox.slots({
            attributes: {class: 'commentary-track-list-sidebar-box'},
            content: [
              html.tag('h1', relations.albumLink),

              html.tag('p', {[html.onlyIfContent]: true},
                language.encapsulate(pageCapsule, 'sidebar', workingCapsule => {
                  if (data.anyTrackHasCommentary) return html.blank();

                  if (data.albumHasCommentary) {
                    workingCapsule += '.noTrackCommentary';
                  } else {
                    workingCapsule += '.noCommentary';
                  }

                  return language.$(workingCapsule);
                })),

              data.anyTrackHasCommentary &&
                relations.trackSections.map(section =>
                  section.slots({
                    anchor: true,
                    open: true,
                    mode: 'commentary',
                  })),
            ],
          }),
        ]
      })),
}
