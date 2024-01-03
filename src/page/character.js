import {empty} from '#sugar';

export const description = `per-character info pages`;

export function targets({wikiData}) {
  return wikiData.characterData;
}

export function pathsForTarget(character) {
  return [
    {
      type: 'page',
      path: ['character', character.directory],

      contentFunction: {
        name: 'generateCharacterInfoPage',
        args: [character],
      },
    },
  ];
}
