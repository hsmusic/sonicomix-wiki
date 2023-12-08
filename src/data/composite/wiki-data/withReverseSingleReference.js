// Check out the info on reverseSingleReference!
// This is its composable form.

import {input, templateCompositeFrom} from '#composite';

import {exitWithoutDependency} from '#composite/control-flow';
import {inputOptionalSort, withSortedList} from '#composite/data';

import inputWikiData from './inputWikiData.js';

export default templateCompositeFrom({
  annotation: `withReverseSingleReference`,

  inputs: {
    data: inputWikiData({allowMixedTypes: false}),
    property: input({type: 'string'}),
    sort: inputOptionalSort(),
  },

  outputs: ['#reverseSingleReference'],

  steps: () => [
    exitWithoutDependency({
      dependency: input('data'),
      value: input.value([]),
      mode: input.value('empty'),
    }),

    {
      dependencies: [input.myself(), input('data'), input('property')],

      compute: (continuation, {
        [input.myself()]: thisThing,
        [input('data')]: data,
        [input('property')]: refProperty,
      }) =>
        continuation({
          ['#reverseSingleReference']:
            data.filter(thing => thing[refProperty] === thisThing),
        }),
    },

    input.subroutine('sort', {
      inputs: {
        things: '#reverseSingleReference',
      },

      outputs: {
        '#sortedThings': '#reverseSingleReference',
      },
    }),
  ],
});
