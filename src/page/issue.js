export const description = `per-issue info pages`;

export function targets({wikiData}) {
  return wikiData.issueData;
}

export function pathsForTarget(issue) {
  return [
    {
      type: 'page',
      path: ['issue', issue.publisher.directory, issue.directory],

      contentFunction: {
        name: 'generateIssueInfoPage',
        args: [issue],
      },
    },
  ];
}
