import {sortChronologically} from '#sort';
import {stitchArrays} from '#sugar';

export default {
  contentDependencies: [
    'generateContentHeading',
    'generateIssueCoverArtworkGallery',
    'generatePageLayout',
    'generateReleaseInfoContributionsLine',
    'linkFeaturedCharacter',
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

  relations: (relation, query, story) => ({
    layout:
      relation('generatePageLayout'),

    contentHeading:
      relation('generateContentHeading'),

    publisherLink:
      relation('linkPublisher', story.publisher),

    issueLinks:
      query.featuredInIssues
        .map(issue => relation('linkIssue', issue)),

    storyContributionsLine:
      relation('generateReleaseInfoContributionsLine', story.storyContribs),

    artContributionsLine:
      relation('generateReleaseInfoContributionsLine', story.artContribs),

    characterLinks:
      story.featuredCharacters
        .map(feature => relation('linkFeaturedCharacter', feature)),

    navPublisherLink:
      relation('linkPublisher', story.publisher),
  }),

  data: (query, story) => ({
    name:
      story.name,

    issueDates:
      query.featuredInIssues
        .map(issue => issue.date),
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('storyPage', pageCapsule =>
      relations.layout.slots({
        title: language.$('storyPage.title', {story: data.name}),
        headingMode: 'sticky',

        mainContent: [
          relations.issueLinks.length === 1 &&
            html.tag('p',
              language.$(pageCapsule, 'featuredInIssues.single', {
                issue: relations.issueLinks[0],
                date: language.formatDate(data.issueDates[0]),
                publisher: relations.publisherLink,
              })),

          html.tag('p',
            {[html.onlyIfContent]: true},
            {[html.joinChildren]: html.tag('br')},

            [
              relations.storyContributionsLine.slots({
                stringKey: language.encapsulate(pageCapsule, 'storyBy'),
              }),

              relations.artContributionsLine.slots({
                stringKey: language.encapsulate(pageCapsule, 'artBy'),
              }),
            ]),

          html.tags([
            relations.contentHeading.clone()
              .slots({
                attributes: {id: 'featured-in-issues'},
                title:
                  language.$(pageCapsule, 'featuredInIssues.listTitle', {
                    publisher: relations.publisherLink,
                  }),
              }),

            relations.issueLinks.length >= 2 &&
              html.tag('ul',
                stitchArrays({
                  issueLink: relations.issueLinks,
                  issueDate: data.issueDates,
                }).map(({issueLink, issueDate}) =>
                    html.tag('li',
                      language.$(pageCapsule, 'featuredInIssues.listItem', {
                        issue: issueLink,
                        date: language.formatDate(issueDate),
                      })))),
          ]),

          html.tags([
            relations.contentHeading.clone()
              .slots({
                attributes: {id: 'featured-stories'},
                title:
                  language.$('storyPage.featuredCharacters.title', {
                    story:
                      html.tag('i',
                        language.sanitize(data.name)),
                  }),
              }),

            html.tag('ul',
              {[html.onlyIfContent]: true},

              relations.characterLinks.map(characterLink =>
                html.tag('li',
                  language.$('storyPage.featuredCharacters.item', {
                    character: characterLink,
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
