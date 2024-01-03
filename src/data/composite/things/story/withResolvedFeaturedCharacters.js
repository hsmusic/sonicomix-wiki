import {input, templateCompositeFrom} from '#composite';
import find from '#find';
import {stitchArrays} from '#sugar';
import {is, isFeaturedCharacterList} from '#validators';
import {filterMultipleArrays} from '#wiki-data';

import {raiseOutputWithoutDependency} from '#composite/control-flow';
import {withPropertiesFromList} from '#composite/data';
import {withResolvedReferenceList} from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `withResolvedFeaturedCharacters`,

  inputs: {
    from: input({
      validate: isFeaturedCharacterList,
      acceptsNull: true,
    }),

    notFoundMode: input({
      validate: is('exit', 'filter', 'null'),
      defaultValue: 'null',
    }),
  },

  outputs: ['#resolvedFeaturedCharacters'],

  steps: () => [
    raiseOutputWithoutDependency({
      dependency: input('from'),
      mode: input.value('empty'),
      output: input.value({
        ['#resolvedFeaturedCharacters']: [],
      }),
    }),

    withPropertiesFromList({
      list: input('from'),
      properties: input.value(['who', 'how']),
      prefix: input.value('#characters'),
    }),

    withResolvedReferenceList({
      list: '#characters.who',
      data: 'characterData',
      find: input.value(find.character),
      notFoundMode: input('notFoundMode'),
    }).outputs({
      ['#resolvedReferenceList']: '#characters.who',
    }),

    {
      dependencies: ['#characters.who', '#characters.how'],

      compute(continuation, {
        ['#characters.who']: who,
        ['#characters.how']: how,
      }) {
        filterMultipleArrays(who, how, (who, _how) => who);
        return continuation({
          ['#resolvedFeaturedCharacters']: stitchArrays({who, how}),
        });
      },
    },
  ],
});
