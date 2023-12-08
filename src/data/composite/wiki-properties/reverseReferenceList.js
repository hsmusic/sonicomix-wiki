// Neat little shortcut for "reversing" the reference lists stored on other
// things - for example, tracks specify a "referenced tracks" property, and
// you would use this to compute a corresponding "referenced *by* tracks"
// property. Naturally, the passed ref list property is of the things in the
// wiki data provided, not the requesting Thing itself.

import {input, templateCompositeFrom} from '#composite';

import {exposeDependency} from '#composite/control-flow';
import {inputOptionalSort} from '#composite/data';
import {inputWikiData, withReverseReferenceList} from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `reverseReferenceList`,

  compose: false,

  inputs: {
    data: inputWikiData({allowMixedTypes: false}),
    list: input({type: 'string'}),
    sort: inputOptionalSort(),
  },

  steps: () => [
    withReverseReferenceList({
      data: input('data'),
      list: input('list'),
      sort: input('sort'),
    }),

    exposeDependency({dependency: '#reverseReferenceList'}),
  ],
});
