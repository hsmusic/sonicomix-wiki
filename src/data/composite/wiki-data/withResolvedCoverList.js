import {input, templateCompositeFrom} from '#composite';
import thingConstructors from '#things';

import {raiseOutputWithoutDependency} from '#composite/control-flow';
import {withMappedList} from '#composite/data';

export default templateCompositeFrom({
  annotation: `withResolvedCoverList`,

  inputs: {
    from: input({type: 'array', acceptsNull: true}),
  },

  outputs: ['#resolvedCoverList'],

  steps: () => [
    raiseOutputWithoutDependency({
      dependency: input('from'),
      mode: input.value('empty'),
      output: input.value({
        ['#resolvedCoverList']: [],
      }),
    }),

    {
      dependencies: [
        input.myself(),
        'artistData',
      ],

      compute: (continuation, {
        [input.myself()]: myself,
        ['artistData']: artistData,
      }) => continuation({
        ['#map']:
          details => ({
            ...details,
            issue: myself,
            artistData: artistData,
          }),
      }),
    },

    withMappedList({
      list: input('from'),
      map: '#map',
    }).outputs({
      '#mappedList': '#details',
    }),

    withMappedList({
      list: '#details',
      map:
        input.value(details =>
          Object.assign(new thingConstructors.Cover, details)),
    }).outputs({
      '#mappedList': '#resolvedCoverList',
    }),
  ],
});
