// Compute a directory from a name.

import {input, templateCompositeFrom} from '#composite';

import {isName} from '#validators';
import {getKebabCase} from '#wiki-data';

import {raiseOutputWithoutDependency} from '#composite/control-flow';

export default templateCompositeFrom({
  annotation: `withDirectoryFromName`,

  inputs: {
    name: input({
      validate: isName,
      acceptsNull: true,
    }),
  },

  outputs: ['#directory'],

  steps: () => [
    raiseOutputWithoutDependency({
      dependency: input('name'),
      mode: input.value('falsy'),
      output: input.value({
        ['#directory']: null,
      }),
    }),

    {
      dependencies: [input('name')],
      compute: (continuation, {
        [input('name')]: name,
      }) => continuation({
        ['#directory']:
          getKebabCase(name),
      }),
    },
  ],
});
