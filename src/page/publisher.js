export const description = `per-publisher info pages`;

export function targets({wikiData}) {
  return wikiData.publisherData;
}

export function pathsForTarget(publisher) {
  return [
    {
      type: 'page',
      path: ['publisher', publisher.directory],

      contentFunction: {
        name: 'generatePublisherInfoPage',
        args: [publisher],
      },
    },
  ];
}
