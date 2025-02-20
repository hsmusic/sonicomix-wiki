import {unique} from '#sugar';

export default {
  contentDependencies: [
    'generateArtistInfoPageCommentaryChunkedList',
    // 'generateArtistInfoPageStoriesChunkedList',
    'generateArtistNavLinks',
    'generateContentHeading',
    'generateCoverArtwork',
    'generatePageLayout',
    'linkArtistGallery',
    'linkExternal',
    'transformContent',
  ],

  extraDependencies: ['html', 'language'],

  query: (artist) => ({
    allStories:
      unique([
        ...artist.storiesAsWriter,
        ...artist.storiesAsArtist,
      ]),

    hasGallery:
      false,
  }),

  relations: (relation, query, artist) => ({
    layout:
      relation('generatePageLayout'),

    artistNavLinks:
      relation('generateArtistNavLinks', artist),

    cover:
      (artist.hasAvatar
        ? relation('generateCoverArtwork', [], [])
        : null),

    contentHeading:
      relation('generateContentHeading'),

    contextNotes:
      relation('transformContent', artist.contextNotes),

    visitLinks:
      artist.urls
        .map(url => relation('linkExternal', url)),

    // storiesChunkedList:
    //   relation('generateArtistInfoPageStoriesChunkedList', artist),

    commentaryChunkedList:
      relation('generateArtistInfoPageCommentaryChunkedList', artist),
  }),

  data: (query, artist) => ({
    name:
      artist.name,

    directory:
      artist.directory,

    avatarFileExtension:
      (artist.hasAvatar
        ? artist.avatarFileExtension
        : null),

    totalStoryCount:
      query.allStories.length,
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('artistPage', pageCapsule =>
      relations.layout.slots({
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
          html.tags([
            html.tag('p',
              {[html.onlyIfSiblings]: true},
              language.$('releaseInfo.note')),

            html.tag('blockquote',
              {[html.onlyIfContent]: true},
              relations.contextNotes),
          ]),

          html.tag('p',
            {[html.onlyIfContent]: true},

            language.$('releaseInfo.visitOn', {
              [language.onlyIfOptions]: ['links'],

              links:
                language.formatDisjunctionList(
                  relations.visitLinks
                    .map(link => link.slot('context', 'artist'))),
            })),

          html.tag('p',
            {[html.onlyIfContent]: true},

            language.$('misc.jumpTo.withLinks', {
              [language.onlyIfOptions]: ['links'],

              links:
                language.formatUnitList([
                  !html.isBlank(relations.commentaryChunkedList) &&
                    html.tag('a',
                      {href: '#commentary'},
                      language.$(pageCapsule, 'commentaryList.title')),
                ].filter(Boolean)),
            })),

          html.tags([
            relations.contentHeading.clone()
              .slots({
                tag: 'h2',
                attributes: {id: 'stories'},
                title: language.$(pageCapsule, 'storyList.title'),
              }),

            html.tag('p',
              {[html.onlyIfSiblings]: true},

              language.$(pageCapsule, 'storyList.storiesContributedLine', {
                artist:
                  data.name,

                stories:
                  language.countStories(data.totalStoryCount, {unit: true}),
              })),

            relations.storiesChunkedList,
          ]),

          html.tags([
            relations.contentHeading.clone()
              .slots({
                tag: 'h2',
                attributes: {id: 'stories'},
                title: language.$(pageCapsule, 'storyList.title'),
              }),

            html.tag('p',
              {[html.onlyIfSiblings]: true},

              language.$(pageCapsule, 'storyList.storiesContributedLine', {
                artist:
                  data.name,

                stories:
                  language.countStories(data.totalStoryCount, {unit: true}),
              })),

            relations.storiesChunkedList,
          ]),

          html.tags([
            relations.contentHeading.clone()
              .slots({
                tag: 'h2',
                attributes: {id: 'commentary'},
                title: language.$(pageCapsule, 'commentaryList.title'),
              }),

            relations.commentaryChunkedList,
          ]),
        ],

        navLinkStyle: 'hierarchical',
        navLinks:
          relations.artistNavLinks
            .slots({
              showExtraLinks: true,
            })
            .content,
      })),
};
