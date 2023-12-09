import {stitchArrays} from '#sugar';

import {
  chunkByProperties,
  sortChronologically,
  sortEntryThingPairs,
} from '#wiki-data';

export default {
  contentDependencies: [
    'generateArtistInfoPageChunk',
    'generateArtistInfoPageChunkItem',
    'generateArtistInfoPageOtherArtistLinks',
  ],

  extraDependencies: ['html'],

  query() {
    const entries = [];

    sortEntryThingPairs(entries, sortChronologically);

    const chunks =
      chunkByProperties(
        entries.map(({entry}) => entry),
        []);

    return {chunks};
  },

  relations(relation, query) {
    return {
      chunks:
        query.chunks.map(() => relation('generateArtistInfoPageChunk')),

      items:
        query.chunks.map(({chunk}) =>
          chunk.map(() => relation('generateArtistInfoPageChunkItem'))),
    };
  },

  generate(relations, {html}) {
    return html.tag('dl',
      stitchArrays({
        chunk: relations.chunks,
        items: relations.items,
      }).map(({chunk, items}) =>
          chunk.slots({
            items:
              items.map(item =>
                item.slots({
                  content: null,
                })),
          })));
  },
};
