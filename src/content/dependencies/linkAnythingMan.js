export default {
  contentDependencies: [],

  query: (thing) => ({
    referenceType: thing.constructor[Symbol.for('Thing.referenceType')],
  }),

  relations: (_relation, _query, _thing) => ({
    link:
      null,
  }),

  generate: (relations) =>
    relations.link,
};
