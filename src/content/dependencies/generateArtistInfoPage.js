import {empty, unique} from '#sugar';

export default {
  contentDependencies: [
    'generateArtistInfoPageCommentaryChunkedList',
    'generateArtistInfoPageStoriesChunkedList',
    'generateArtistNavLinks',
    'generateContentHeading',
    'generateCoverArtwork',
    'generatePageLayout',
    'linkArtistGallery',
    'linkExternal',
    'transformContent',
  ],

  extraDependencies: ['html', 'language', 'wikiData'],

  query(artist) {
    return {
      allStories:
        unique([
          ...artist.storiesAsWriter,
          ...artist.storiesAsArtist,
        ]),

      hasGallery:
        false,
    };
  },

  relations(relation, query, artist) {
    const relations = {};
    const sections = relations.sections = {};

    relations.layout =
      relation('generatePageLayout');

    relations.artistNavLinks =
      relation('generateArtistNavLinks', artist);

    if (artist.hasAvatar) {
      relations.cover =
        relation('generateCoverArtwork', []);
    }

    if (artist.contextNotes) {
      const contextNotes = sections.contextNotes = {};
      contextNotes.content = relation('transformContent', artist.contextNotes);
    }

    if (!empty(artist.urls)) {
      const visit = sections.visit = {};
      visit.externalLinks =
        artist.urls.map(url =>
          relation('linkExternal', url));
    }

    if (!empty(query.allStories)) {
      const stories = sections.stories = {};

      stories.heading =
        relation('generateContentHeading');

      stories.list =
        relation('generateArtistInfoPageStoriesChunkedList', artist);
    }

    if (!empty([])) {
      const commentary = sections.commentary = {};
      commentary.heading = relation('generateContentHeading');
      commentary.list = relation('generateArtistInfoPageCommentaryChunkedList', artist);
    }

    return relations;
  },

  data(query, artist) {
    const data = {};

    data.name = artist.name;
    data.directory = artist.directory;

    if (artist.hasAvatar) {
      data.avatarFileExtension = artist.avatarFileExtension;
    }

    data.totalStoryCount = query.allStories.length;

    return data;
  },

  generate(data, relations, {html, language}) {
    const {sections: sec} = relations;

    return relations.layout
      .slots({
        title: data.name,
        headingMode: 'sticky',

        cover:
          (relations.cover
            ? relations.cover.slots({
                path: [
                  'media.artistAvatar',
                  data.directory,
                  data.avatarFileExtension,
                ],
              })
            : null),

        mainContent: [
          sec.contextNotes && [
            html.tag('p', language.$('releaseInfo.note')),
            html.tag('blockquote',
              sec.contextNotes.content),
          ],

          sec.visit &&
            html.tag('p',
              language.$('releaseInfo.visitOn', {
                links:
                  language.formatDisjunctionList(
                    sec.visit.externalLinks.map(link =>
                      link.slots({
                        context: 'artist',
                        style: 'platform',
                      }))),
              })),

          sec.artworks?.artistGalleryLink &&
            html.tag('p',
              language.$('artistPage.viewArtGallery', {
                link: sec.artworks.artistGalleryLink.slots({
                  content: language.$('artistPage.viewArtGallery.link'),
                }),
              })),

          (sec.commentary) &&
            html.tag('p',
              language.$('misc.jumpTo.withLinks', {
                links: language.formatUnitList(
                  [
                    sec.commentary &&
                      html.tag('a',
                        {href: '#commentary'},
                        language.$('artistPage.commentaryList.title')),
                  ].filter(Boolean)),
              })),

          sec.stories && [
            sec.stories.heading
              .slots({
                tag: 'h2',
                id: 'stories',
                title: language.$('artistPage.storyList.title'),
              }),

            html.tag('p',
              language.$('artistPage.storyList.storiesContributedLine', {
                artist:
                  data.name,

                stories:
                  language.countStories(data.totalStoryCount, {unit: true}),
              })),

            sec.stories.list,
          ],

          sec.commentary && [
            sec.commentary.heading
              .slots({
                tag: 'h2',
                id: 'commentary',
                title: language.$('artistPage.commentaryList.title'),
              }),

            sec.commentary.list,
          ],
        ],

        navLinkStyle: 'hierarchical',
        navLinks:
          relations.artistNavLinks
            .slots({
              showExtraLinks: true,
            })
            .content,
      });
  },
};
