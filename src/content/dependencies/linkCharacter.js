export default {
  contentDependencies: ['linkThing'],

  relations: (relation, publisher) =>
    ({link: relation('linkThing', 'localized.character', publisher)}),

  generate: (relations) => relations.link,
};
