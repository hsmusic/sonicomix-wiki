export default {
  contentDependencies: ['linkThing'],

  relations: (relation, publisher) =>
    ({link: relation('linkThing', 'localized.publisher', publisher)}),

  generate: (relations) => relations.link,
};
