import {unique} from '#sugar';

export default {
  query: (artist) => ({
    allStories:
      unique([
        ...artist.storyStoryContributions,
        ...artist.storyArtistContributions,
      ].map(contrib => contrib.thing)),

    artworkContributions: [],

    hasGallery:
      false,
  }),

  relations: (relation, query, artist) => ({
    layout:
      relation('generatePageLayout'),

    artistNavLinks:
      relation('generateArtistNavLinks', artist),

    artworkColumn:
      relation('generateArtistArtworkColumn', artist),

    contentHeading:
      relation('generateContentHeading'),

    contextNotes:
      relation('transformContent', artist.contextNotes),

    visitLinks:
      artist.urls
        .map(url => relation('linkExternal', url)),

    // storiesChunkedList:
    //   relation('generateArtistInfoPageStoriesChunkedList', artist),

    artworksList:
      null,

    artistGalleryLink:
      (query.hasGallery
        ? relation('linkArtistGallery', artist)
        : null),

    commentaryList:
      null,
  }),

  data: (query, artist) => ({
    name:
      artist.name,

    totalStoryCount:
      query.allStories.length,
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('artistPage', pageCapsule =>
      relations.layout.slots({
        title: data.name,
        headingMode: 'sticky',

        artworkColumnContent:
          relations.artworkColumn,

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
                  !html.isBlank(relations.artworksList) &&
                    html.tag('a',
                      {href: '#art'},
                      language.$(pageCapsule, 'artList.title')),

                  !html.isBlank(relations.commentaryList) &&
                    html.tag('a',
                      {href: '#commentary'},
                      language.$(pageCapsule, 'commentaryList.title')),
                ].filter(Boolean)),
            })),

          /*
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
          */

          html.tags([
            relations.contentHeading.clone()
              .slots({
                tag: 'h2',
                attributes: {id: 'art'},
                title: language.$(pageCapsule, 'artList.title'),
              }),

            html.tag('p',
              {[html.onlyIfContent]: true},

              language.encapsulate(pageCapsule, 'viewArtGallery', capsule =>
                language.$(capsule, 'orBrowseList', {
                  [language.onlyIfOptions]: ['link'],

                  link:
                    relations.artistGalleryLink?.slots({
                      content: language.$(capsule, 'link'),
                    }),
                }))),

            relations.artworksList,
          ]),

          html.tags([
            relations.contentHeading.clone()
              .slots({
                tag: 'h2',
                attributes: {id: 'commentary'},
                title: language.$(pageCapsule, 'commentaryList.title'),
              }),

            relations.commentaryList,
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
