import {sortByDate, sortEntryThingPairs} from '#sort';
import {chunkByProperties, stitchArrays} from '#sugar';

export default {
  contentDependencies: [
    'generateArtistInfoPageChunk',
    'generateArtistInfoPageChunkItem',
    'generateArtistInfoPageOtherArtistLinks',
    'transformContent',
  ],

  extraDependencies: ['html'],

  query(artist) {
    // eslint-disable-next-line no-unused-vars
    const processEntry = ({
      /* eslint-disable no-unused-vars */
      thing,
      entry,

      chunkType,
      itemType,
      /* eslint-enable no-unused-vars */
    }) => ({
      thing: thing,
      entry: {
        chunkType,
        itemType,

        annotation: entry.annotation,
      },
    });

    // eslint-disable-next-line no-unused-vars
    const processEntries = ({things, processEntry}) =>
      things
        .flatMap(thing =>
          thing.commentary
            .filter(entry => entry.artists.includes(artist))
            .map(entry => processEntry({thing, entry})));

    const allEntries =
      sortEntryThingPairs(
        [],
        sortByDate);

    const chunks =
      chunkByProperties(
        allEntries.map(({entry}) => entry),
        ['chunkType']);

    return {chunks};
  },

  relations: (relation, query) => ({
    chunks:
      query.chunks
        .map(() => relation('generateArtistInfoPageChunk')),

    chunkLinks:
      query.chunks
        .map(() => null),

    items:
      query.chunks
        .map(({chunk}) => chunk
          .map(() => relation('generateArtistInfoPageChunkItem'))),

    itemLinks:
      query.chunks
        .map(({chunk}) => chunk
          .map(() => null)),

    itemAnnotations:
      query.chunks
        .map(({chunk}) => chunk
          .map(({annotation}) =>
            (annotation
              ? relation('transformContent', annotation)
              : null))),
  }),

  data: (query) => ({
    chunkTypes:
      query.chunks
        .map(({chunkType}) => chunkType),

    itemTypes:
      query.chunks
        .map(({chunk}) => chunk
          .map(({itemType}) => itemType)),
  }),

  generate: (data, relations, {html, language}) =>
    html.tag('dl',
      {[html.onlyIfContent]: true},

      /* eslint-disable no-unused-vars */
      stitchArrays({
        chunk: relations.chunks,
        chunkLink: relations.chunkLinks,
        chunkType: data.chunkTypes,

        items: relations.items,
        itemLinks: relations.itemLinks,
        itemAnnotations: relations.itemAnnotations,
        itemTypes: data.itemTypes,
      }).map(({
          chunk,
          chunkLink,
          chunkType,

          items,
          itemLinks,
          itemAnnotations,
          itemTypes,
        }) =>
          language.encapsulate('artistPage.creditList.entry', _capsule =>
            null))),
      /* eslint-enable no-unused-vars */
};
