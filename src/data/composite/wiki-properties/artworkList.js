import {input, templateCompositeFrom} from '#composite';
import {stitchArrays} from '#sugar';
import {isArtworkList, isDate, isString} from '#validators';
import {getKebabCase} from '#wiki-data';

import {exitWithoutDependency} from '#composite/control-flow';
import {withResolvedContribs} from '#composite/wiki-data';

import {
  fillMissingListItems,
  withFlattenedList,
  withPropertiesFromList,
  withUnflattenedList,
} from '#composite/data';

export default templateCompositeFrom({
  annotation: `artworkList`,

  compose: false,

  inputs: {
    directoryPrefix: input({
      validate: isString,
      default: '',
    }),

    date: input({
      validate: isDate,
      acceptsNull: true,
    }),
  },

  steps: () => [
    exitWithoutDependency({
      dependency: input.updateValue({
        validate: isArtworkList,
      }),

      value: input.value([]),
    }),

    withPropertiesFromList({
      list: input.updateValue(),
      properties: input.value([
        'name',
        'directory',
        'extension',
        'artistContribs',
      ]),
      prefix: input.value('#updateValue'),
    }),

    fillMissingListItems({
      list: '#updateValue.extension',
      fill: input.value('jpg'),
    }),

    fillMissingListItems({
      list: '#updateValue.artistContribs',
      fill: input.value([]),
    }),

    {
      dependencies: [
        '#updateValue.directory',
        '#updateValue.name',
      ],

      compute: (continuation, {
        ['#updateValue.directory']: directories,
        ['#updateValue.name']: names,
      }) => continuation({
        ['#directories']:
          stitchArrays({
            directory: directories,
            name: names,
          }).map(({directory, name}) =>
              directory ?? getKebabCase(name)),
      }),
    },

    {
      dependencies: ['#directories', input('directoryPrefix')],

      compute: (continuation, {
        ['#directories']: directories,
        [input('directoryPrefix')]: prefix,
      }) => continuation({
        ['#prefixedDirectories']:
          directories.map(directory => prefix + directory),
      }),
    },

    withFlattenedList({
      list: '#updateValue.artistContribs',
    }),

    withResolvedContribs({
      from: '#flattenedList',
      date: input('date'),
      notFoundMode: input.value('null'),
    }),

    withUnflattenedList({
      list: '#resolvedContribs',
    }).outputs({
      ['#unflattenedList']: '#artistContribLists',
    }),

    {
      dependencies: [
        '#prefixedDirectories',
        '#updateValue.name',
        '#updateValue.extension',
        '#artistContribLists',
      ],

      compute: ({
        ['#prefixedDirectories']: directories,
        ['#updateValue.name']: names,
        ['#updateValue.extension']: extensions,
        ['#artistContribLists']: artistContribLists,
      }) =>
        stitchArrays({
          directory: directories,
          name: names,
          extension: extensions,
          artistContribs: artistContribLists,
        }),
    },
  ],
});
