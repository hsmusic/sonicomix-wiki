export default {
  contentDependencies: ['linkThing'],

  relations: (relation, story) => ({
    link:
      relation('linkThing', null, story),
  }),

  data: (story) => ({
    path:
      ['localized.story', story.publisher.directory, story.directory],
  }),

  generate: (data, relations) =>
    relations.link.slots({
      path: data.path,
    }),
};
