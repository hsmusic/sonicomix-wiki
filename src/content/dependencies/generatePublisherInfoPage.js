import {sortChronologically} from '#sort';
import {stitchArrays} from '#sugar';

export default {
  contentDependencies: [
    'generateAbsoluteDatetimestamp',
    'generateContentHeading',
    'generatePageLayout',
    'linkIssue',
  ],

  extraDependencies: ['html', 'language'],

  query(publisher) {
    const query = {};

    // TODO: roll this sort into publishedIssues
    query.issues =
      sortChronologically(
        publisher.publishedIssues.slice());

    return query;
  },

  relations: (relation, query, _publisher) => ({
    layout:
      relation('generatePageLayout'),

    contentHeading:
      relation('generateContentHeading'),

    issueLinks:
      query.issues
        .map(issue => relation('linkIssue', issue)),

    issueDatetimestamps:
      query.issues
        .map(issue =>
          relation('generateAbsoluteDatetimestamp', issue.date)),
  }),

  data: (_query, publisher) => ({
    name:
      publisher.name,

    issueCount:
      publisher.publishedIssues.length,
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('publisherPage', pageCapsule =>
      relations.layout.slots({
        title: language.$(pageCapsule, 'title', {publisher: data.name}),
        headingMode: 'sticky',

        mainContent: [
          html.tags([
            relations.contentHeading.clone()
              .slots({
                attributes: {id: 'published-issues'},
                title:
                  language.$(pageCapsule, 'publishedIssues.title', {
                    issues:
                      language.countIssues(data.issueCount, {unit: true}),
                  }),
              }),

            html.tag('ul',
              {[html.onlyIfContent]: true},

              stitchArrays({
                issueLink: relations.issueLinks,
                datetimestamp: relations.issueDatetimestamps,
              }).map(({issueLink, datetimestamp}) =>
                  html.tag('li',
                    language.$(pageCapsule, 'publishedIssues.item', {
                      issue: issueLink,
                      year:
                        datetimestamp.slots({
                          style: 'year',
                          tooltip: true,
                        }),
                    })))),
          ]),
        ],

        navLinkStyle: 'hierarchical',
        navLinks: [
          {auto: 'home'},
          {auto: 'current'},
        ],
      })),
};
