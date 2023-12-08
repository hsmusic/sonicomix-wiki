/* Note: This file is unused, code just kept for reference */

/*
import {input, templateCompositeFrom} from '#composite';
import {validateWikiData} from '#validators';

export const inputOptionalSort_fallback = templateCompositeFrom({
  annotation: `inputOptionalSort_fallback`,

  inputs: {
    things: input({validate: validateWikiData}),
  },

  outputs: ['#sortedThings'],

  steps: () => [
    {
      dependencies: [input('things')],
      compute: (continuation, {[input('things')]: things}) =>
        continuation({['#sortedThings']: things}),
    },
  ],
});

export default function inputOptionalSort() {
  return input.subroutine({
    defaultTemplate: inputOptionalSort_fallback,
    inputs: ['things'],
    outputs: ['#sortedThings'],
  });
}
*/
