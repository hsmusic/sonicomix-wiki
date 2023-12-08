// An optional short name! This can be used in references just like
// the normal name.

import {isName} from '#validators';

export default function() {
  return {
    flags: {update: true, expose: true},
    update: {validate: isName},
    expose: {
      dependencies: ['name'],
      transform: (value, {name}) => value ?? name,
    },
  };
}
