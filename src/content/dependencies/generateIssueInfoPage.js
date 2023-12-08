export default {
  contentDependencies: [
    'generateBlurbSection',
    'generateContentHeading',
    'generateIssueCoverArtworkGallery',
    'generatePageLayout',
    'linkPublisher',
    'linkStory',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, issue) => ({
    layout:
      relation('generatePageLayout'),

    contentHeading:
      relation('generateContentHeading'),

    artworkGallery:
      relation('generateIssueCoverArtworkGallery', issue),

    publisherLink:
      relation('linkPublisher', issue.publisher),

    blurb:
      relation('generateBlurbSection', issue.blurb),

    storyLinks:
      issue.featuredStories
        .map(story => relation('linkStory', story)),

    navPublisherLink:
      relation('linkPublisher', issue.publisher),
  }),

  data: (issue) => ({
    name:
      issue.name,

    date:
      issue.date,
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('issuePage', pageCapsule =>
      relations.layout.slots({
        title: language.$(pageCapsule, 'title', {issue: data.name}),
        headingMode: 'sticky',

        cover: relations.artworkGallery ?? null,

        mainContent: [
          html.tag('p', {
            [html.onlyIfContent]: true,
            [html.joinChildren]: html.tag('br'),
          }, [
            data.date &&
              language.$(pageCapsule, 'published', {
                date: language.formatDate(data.date),
                publisher: relations.publisherLink,
              }),
          ]),

          relations.blurb,

          html.tags([
            relations.contentHeading.clone()
              .slots({
                attributes: {id: 'featured-stories'},
                title: language.$(pageCapsule, 'storiesFeatured.title'),
              }),

            html.tag('ul',
              relations.storyLinks.map(storyLink =>
                html.tag('li',
                  language.$(pageCapsule, 'storiesFeatured.item', {
                    story: storyLink,
                  })))),
          ]),
        ],

        navLinkStyle: 'hierarchical',
        navLinks: [
          {auto: 'home'},
          {html:
            relations.navPublisherLink.slots({
              color: false,
              preferShortName: true,
            })},
          {auto: 'current'},
        ],
      })),
};
