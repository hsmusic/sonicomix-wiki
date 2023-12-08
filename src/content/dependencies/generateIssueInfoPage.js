import {atOffset} from '#sugar';

export default {
  contentDependencies: [
    'generateBlurbSection',
    'generateContentHeading',
    'generateIssueCoverArtworkGallery',
    'generateInterpageDotSwitcher',
    'generateNextLink',
    'generatePreviousLink',
    'generatePageLayout',
    'linkIssue',
    'linkPublisher',
    'linkStory',
  ],

  extraDependencies: ['html', 'language'],

  query(issue) {
    const issues = issue.publisher.publishedIssues;
    const index = issues.indexOf(issue);

    return {
      previousIssue:
        atOffset(issues, index, -1),

      nextIssue:
        atOffset(issues, index, +1),
    };
  },

  relations: (relation, query, issue) => ({
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

    navSwitcher:
      relation('generateInterpageDotSwitcher'),

    previousLink:
      relation('generatePreviousLink'),

    nextLink:
      relation('generateNextLink'),

    previousIssueLink:
      (query.previousIssue
        ? relation('linkIssue', query.previousIssue)
        : null),

    nextIssueLink:
      (query.nextIssue
        ? relation('linkIssue', query.nextIssue)
        : null),
  }),

  data: (_query, issue) => ({
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

        artworkColumnContent:
          relations.artworkGallery,

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
              {[html.onlyIfContent]: true},

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

        navBottomRowContent:
          relations.navSwitcher.slots({
            links: [
              relations.previousLink
                .slot('link', relations.previousIssueLink),

              relations.nextLink
                .slot('link', relations.nextIssueLink),
            ],
          }),
      })),
};
