export default {
  contentDependencies: ['linkIssue'],

  relations: (relation, cover) => ({
    issueLink:
      relation('linkIssue', cover.issue),
  }),

  data: (cover) => ({
    coverDirectory:
      cover.directory,
  }),

  generate: (data, relations) =>
    relations.issueLink.slots({
      hash: data.coverDirectory,
    }),
};
