// Check out the info on reverseReferenceList!
// This is its composable form.

import {input, templateCompositeFrom} from '#composite';

import {exitWithoutDependency} from '#composite/control-flow';
import {inputOptionalSort, withSortedList} from '#composite/data';

import inputWikiData from './inputWikiData.js';

export default templateCompositeFrom({
  annotation: `withReverseReferenceList`,

  inputs: {
    data: inputWikiData({allowMixedTypes: false}),
    list: input({type: 'string'}),
    sort: inputOptionalSort(),
  },

  outputs: ['#reverseReferenceList'],

  steps: () => [
    exitWithoutDependency({
      dependency: input('data'),
      value: input.value([]),
      mode: input.value('empty'),
    }),

    {
      dependencies: [input.myself(), input('data'), input('list')],

      compute: (continuation, {
        [input.myself()]: thisThing,
        [input('data')]: data,
        [input('list')]: refListProperty,
      }) =>
        continuation({
          ['#reverseReferenceList']:
            data.filter(thing => thing[refListProperty].includes(thisThing)),
        }),
    },

    input.subroutine('sort', {
      inputs: {things: '#reverseReferenceList'},
      outputs: {'#sortedThings': '#reverseReferenceList'}
    }),
  ],
});
