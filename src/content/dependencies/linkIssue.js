export default {
  contentDependencies: ['linkThing'],

  relations: (relation, issue) => ({
    link:
      relation('linkThing', null, issue),
  }),

  data: (issue) => ({
    path:
      ['localized.issue', issue.publisher.directory, issue.directory],
  }),

  generate: (data, relations) =>
    relations.link.slots({
      path: data.path,
    }),
};
