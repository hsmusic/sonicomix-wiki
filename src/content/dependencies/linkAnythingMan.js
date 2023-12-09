export default {
  relations: (_relation, _thing) => ({
    link:
      null,
  }),

  generate: (relations) =>
    relations.link,
};
