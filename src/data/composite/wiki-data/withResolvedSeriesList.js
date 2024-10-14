import {input, templateCompositeFrom} from '#composite';
import find from '#find';
import {stitchArrays} from '#sugar';
import {isSeriesList} from '#validators';

import {
  fillMissingListItems,
  withFlattenedList,
  withUnflattenedList,
  withPropertiesFromList,
} from '#composite/data';

import withResolvedReferenceList from './withResolvedReferenceList.js';

export default templateCompositeFrom({
  annotation: `withResolvedSeriesList`,

  inputs: {
    list: input({validate: isSeriesList}),
  },

  outputs: ['#resolvedSeriesList'],

  steps: () => [
    withPropertiesFromList({
      list: input('list'),
      prefix: input.value('#serieses'),
      properties: input.value([
        'name',
        'description',
        'albums',
      ]),
    }),

    fillMissingListItems({
      list: '#serieses.albums',
      fill: input.value([]),
    }),

    withFlattenedList({
      list: '#serieses.albums',
    }),

    withResolvedReferenceList({
      list: '#flattenedList',
      data: 'albumData',
      find: input.value(find.album),
      notFoundMode: input.value('null'),
    }),

    withUnflattenedList({
      list: '#resolvedReferenceList',
    }).outputs({
      '#unflattenedList': '#serieses.albums',
    }),

    fillMissingListItems({
      list: '#serieses.description',
      fill: input.value(null),
    }),

    {
      dependencies: [
        '#serieses.name',
        '#serieses.description',
        '#serieses.albums',
      ],

      compute: (continuation, {
        ['#serieses.name']: name,
        ['#serieses.description']: description,
        ['#serieses.albums']: albums,
      }) => continuation({
        ['#resolvedSeriesList']:
          stitchArrays({
            name,
            description,
            albums,
          }),
      }),
    },
  ],
});
