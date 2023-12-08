export default {
  contentDependencies: ['transformContent'],
  extraDependencies: ['html'],

  relations: (relation, blurb) => ({
    content:
      relation('transformContent', blurb),
  }),

  generate: (relations, {html}) =>
    html.tag('blockquote', {class: 'blurb'},
      relations.content.slots({
        mode: 'multiline',
      })),
}
