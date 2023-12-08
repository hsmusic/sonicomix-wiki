import {empty, stitchArrays} from '#sugar';
import {sortChronologically} from '#wiki-data';

export default {
  contentDependencies: [
    'generateContentHeading',
    'generateIssueCoverArtworkGallery',
    'generatePageLayout',
    'linkIssue',
    'linkPublisher',
  ],

  extraDependencies: ['html', 'language'],

  query(story) {
    const query = {};

    query.featuredInIssues =
      story.featuredInIssues.slice();

    sortChronologically(query.featuredInIssues);

    return query;
  },

  relations(relation, query, story) {
    const relations = {};
    const sec = relations.sections = {};

    relations.layout =
      relation('generatePageLayout');

    sec.releaseInfo = {};

    if (query.featuredInIssues.length === 1) {
      sec.releaseInfo.publisherLink =
        relation('linkPublisher', story.publisher);

      sec.releaseInfo.issueLink =
        relation('linkIssue', query.featuredInIssues[0]);
    }

    if (query.featuredInIssues.length >= 2) {
      sec.featuredInIssues = {};

      sec.featuredInIssues.heading =
        relation('generateContentHeading');

      sec.featuredInIssues.publisherLink =
        relation('linkPublisher', story.publisher);

      sec.featuredInIssues.issueLinks =
        query.featuredInIssues
          .map(issue => relation('linkIssue', issue));
    }

    if (!empty(story.featuredCharacters)) {
      sec.featuredCharacters = {};

      sec.featuredCharacters.heading =
        relation('generateContentHeading');

      sec.featuredCharacters.storyLinks =
        story.featuredCharacters
          .map(character => relation('linkCharacter', character));
    }

    sec.nav = {};

    sec.nav.publisherLink =
      relation('linkPublisher', story.publisher);

    return relations;
  },

  data(query, story) {
    const data = {};

    data.name =
      story.name;

    if (query.featuredInIssues.length === 1) {
      data.issueDate =
        query.featuredInIssues[0].date;
    } else if (query.featuredInIssues.length >= 2) {
      data.issueDates =
        query.featuredInIssues
          .map(issue => issue.date);
    }

    return data;
  },

  generate(data, relations, {html, language}) {
    const sec = relations.sections;

    return relations.layout.slots({
      title: language.$('storyPage.title', {story: data.name}),
      headingMode: 'sticky',

      mainContent: [
        html.tag('p', {
          [html.onlyIfContent]: true,
          [html.joinChildren]: html.tag('br'),
        }, [
          sec.releaseInfo.issueLink &&
            language.$('storyPage.featuredInIssues.single', {
              issue: sec.releaseInfo.issueLink,
              date: language.formatDate(data.issueDate),
              publisher: sec.releaseInfo.publisherLink,
            }),
        ]),

        sec.featuredInIssues && [
          sec.featuredInIssues.heading.slots({
            id: 'featured-in-issues',
            title:
              language.$('storyPage.featuredInIssues.listTitle', {
                publisher: sec.featuredInIssues.publisherLink,
              }),
          }),

          html.tag('ul',
            stitchArrays({
              issueLink: sec.featuredInIssues.issueLinks,
              issueDate: data.issueDates,
            }).map(({issueLink, issueDate}) =>
                html.tag('li',
                  language.$('storyPage.featuredInIssues.listItem', {
                    issue: issueLink,
                    date: language.formatDate(issueDate),
                  })))),
        ],

        sec.featuredStories && [
          sec.featuredStories.heading.slots({
            id: 'featured-stories',
            title: language.$('storyPage.storiesFeatured.title'),
          }),

          html.tag('ul',
            sec.featuredStories.storyLinks.map(storyLink =>
              html.tag('li',
                language.$('storyPage.storiesFeatured.item', {
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
