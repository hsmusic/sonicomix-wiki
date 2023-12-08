// Just like reverseReferenceList, but for finding things which reference this
// directly on the property value (rather than in a list).

import {input, templateCompositeFrom} from '#composite';

import {exposeDependency} from '#composite/control-flow';
import {inputOptionalSort} from '#composite/data';
import {inputWikiData, withReverseSingleReference} from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `reverseSingleReference`,

  compose: false,

  inputs: {
    data: inputWikiData({allowMixedTypes: false}),
    property: input({type: 'string'}),
    sort: inputOptionalSort(),
  },

  steps: () => [
    withReverseSingleReference({
      data: input('data'),
      property: input('property'),
      sort: input('sort'),
    }),

    exposeDependency({dependency: '#reverseSingleReference'}),
  ],
});
