import {empty, stitchArrays} from '#sugar';
import {sortChronologically} from '#wiki-data';

export default {
  contentDependencies: [
    'generateAbsoluteDatetimestamp',
    'generateContentHeading',
    'generatePageLayout',
    'linkIssue',
  ],

  extraDependencies: ['html', 'language'],

  relations(relation, publisher) {
    const relations = {};
    const sec = relations.sections = {};

    relations.layout =
      relation('generatePageLayout');

    if (!empty(publisher.publishedIssues)) {
      sec.publishedIssues = {};

      // TODO: roll this sort into publishedIssues
      const issues =
        sortChronologically(
          publisher.publishedIssues.slice());

      sec.publishedIssues.heading =
        relation('generateContentHeading');

      sec.publishedIssues.issueLinks =
        issues
          .map(issue => relation('linkIssue', issue));

      sec.publishedIssues.datetimestamps =
        issues
          .map(issue =>
            relation('generateAbsoluteDatetimestamp', issue.date));
    }

    return relations;
  },

  data(publisher) {
    const data = {};

    data.name =
      publisher.name;

    data.issueCount =
      publisher.publishedIssues.length;

    return data;
  },

  generate(data, relations, {html, language}) {
    const sec = relations.sections;

    return relations.layout.slots({
      title: language.$('publisherPage.title', {publisher: data.name}),
      headingMode: 'sticky',

      mainContent: [
        sec.publishedIssues && [
          sec.publishedIssues.heading.slots({
            id: 'published-issues',
            title:
              language.$('publisherPage.publishedIssues.title', {
                issues:
                  language.countIssues(data.issueCount, {unit: true}),
              }),
          }),

          html.tag('ul',
            stitchArrays({
              issueLink: sec.publishedIssues.issueLinks,
              datetimestamp: sec.publishedIssues.datetimestamps,
            }).map(({issueLink, datetimestamp}) =>
                html.tag('li',
                  language.$('publisherPage.publishedIssues.item', {
                    issue: issueLink,
                    year:
                      datetimestamp.slots({
                        style: 'year',
                        tooltip: true,
                      }),
                  })))),
        ],
      ],

      navLinkStyle: 'hierarchical',
      navLinks: [
        {auto: 'home'},
        {auto: 'current'},
      ],
    });
  },
};
