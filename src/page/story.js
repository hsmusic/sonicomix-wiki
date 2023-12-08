import {empty} from '#sugar';

export const description = `per-story info pages`;

export function targets({wikiData}) {
  return wikiData.storyData;
}

export function pathsForTarget(story) {
  return [
    {
      type: 'page',
      path: ['story', story.publisher.directory, story.directory],

      contentFunction: {
        name: 'generateStoryInfoPage',
        args: [story],
      },
    },
  ];
}
