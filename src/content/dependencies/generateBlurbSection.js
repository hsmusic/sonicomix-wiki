export default {
  contentDependencies: ['transformContent'],
  extraDependencies: ['html'],

  relations: (relation, blurb) => ({
    content:
      relation('transformContent', blurb),
  }),

  generate: (relations, {html}) =>
    html.tag('blockquote', {class: 'blurb'},
      {[html.onlyIfContent]: true},

      relations.content.slots({
        mode: 'multiline',
      })),
}
