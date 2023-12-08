import {empty} from '#sugar';

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

  relations(relation, issue) {
    const relations = {};
    const sec = relations.sections = {};

    relations.layout =
      relation('generatePageLayout');

    sec.releaseInfo = {};

    sec.releaseInfo.publisherLink =
      relation('linkPublisher', issue.publisher);

    if (issue.blurb) {
      sec.blurb =
        relation('generateBlurbSection', issue.blurb);
    }

    if (!empty(issue.coverArtworks)) {
      relations.artworkGallery =
        relation('generateIssueCoverArtworkGallery', issue);
    }

    if (!empty(issue.featuredStories)) {
      sec.featuredStories = {};

      sec.featuredStories.heading =
        relation('generateContentHeading');

      sec.featuredStories.storyLinks =
        issue.featuredStories
          .map(story => relation('linkStory', story));
    }

    sec.nav = {};

    sec.nav.publisherLink =
      relation('linkPublisher', issue.publisher);

    return relations;
  },

  data(issue) {
    const data = {};

    data.name =
      issue.name;

    data.date =
      issue.date;

    return data;
  },

  generate(data, relations, {html, language}) {
    const sec = relations.sections;

    return relations.layout.slots({
      title: language.$('issuePage.title', {issue: data.name}),
      headingMode: 'sticky',

      cover: relations.artworkGallery ?? null,

      mainContent: [
        html.tag('p', {
          [html.onlyIfContent]: true,
          [html.joinChildren]: html.tag('br'),
        }, [
          data.date &&
            language.$('issuePage.published', {
              date: language.formatDate(data.date),
              publisher: sec.releaseInfo.publisherLink,
            }),
        ]),

        sec.blurb,

        sec.featuredStories && [
          sec.featuredStories.heading.slots({
            id: 'featured-stories',
            title: language.$('issuePage.storiesFeatured.title'),
          }),

          html.tag('ul',
            sec.featuredStories.storyLinks.map(storyLink =>
              html.tag('li',
                language.$('issuePage.storiesFeatured.item', {
                  story: storyLink,
                })))),
        ],
      ],

      navLinkStyle: 'hierarchical',
      navLinks: [
        {auto: 'home'},
        {html:
          sec.nav.publisherLink.slots({
            color: false,
            preferShortName: true,
          })},
        {auto: 'current'},
      ],
    });
  },
};
