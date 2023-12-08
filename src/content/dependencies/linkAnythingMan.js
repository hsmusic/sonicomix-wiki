export default {
  relations: (relation, thing) => ({
    link:
      (thing.isIssueCover
        ? relation('linkCover', thing)
        : null),
  }),

  generate: (relations) =>
    relations.link,
};
