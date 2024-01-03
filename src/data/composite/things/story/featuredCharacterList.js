import {input, templateCompositeFrom} from '#composite';
import {isFeaturedCharacterList} from '#validators';

import {exposeConstant, exposeDependencyOrContinue}
  from '#composite/control-flow';

import withResolvedFeaturedCharacters from './withResolvedFeaturedCharacters.js';

export default templateCompositeFrom({
  annotation: `featuredCharacterList`,

  compose: false,

  steps: () => [
    withResolvedFeaturedCharacters({
      from: input.updateValue({
        validate: isFeaturedCharacterList,
      }),
    }),

    exposeDependencyOrContinue({dependency: '#resolvedFeaturedCharacters'}),
    exposeConstant({value: input.value([])}),
  ],
})

