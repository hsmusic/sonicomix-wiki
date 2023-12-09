import {empty, stitchArrays} from '#sugar';

import {
  filterByCount,
  filterMultipleArrays,
  sortAlphabetically,
  sortByCount,
} from '#wiki-data';

export default {
  contentDependencies: ['generateListingPage', 'linkArtist'],
  extraDependencies: ['html', 'language', 'wikiData'],

  sprawl({artistData}) {
    return {
      artistData,
    };
  },

  query(sprawl, spec) {
    const query = {
      spec,
    };

    const queryContributionInfo = (artistsKey, countsKey, fn) => {
      const artists = sortAlphabetically(sprawl.artistData.slice());
      const counts = artists.map(artist => fn(artist));

      filterByCount(artists, counts);
      sortByCount(artists, counts, {greatestFirst: true});

      query[artistsKey] = artists;
      query[countsKey] = counts;
    };

    return query;
  },

  relations(relation, query) {
    const relations = {};

    relations.page =
      relation('generateListingPage', query.spec);

    return relations;
  },

  data() {
    const data = {};

    return data;
  },

  generate(data, relations, {language}) {
    const listChunkIDs = [];
    const listTitleStringsKeys = [];
    const listCountFunctions = [];

    const listArtistLinks = [];

    const listArtistCounts = [];

    filterMultipleArrays(
      listChunkIDs,
      listTitleStringsKeys,
      listCountFunctions,
      listArtistLinks,
      listArtistCounts,
      (_chunkID, _titleStringsKey, _countFunction, artistLinks, _artistCounts) =>
        !empty(artistLinks));

    return relations.page.slots({
      type: 'chunks',

      showSkipToSection: true,
      chunkIDs: listChunkIDs,

      chunkTitles:
        listTitleStringsKeys.map(stringsKey => ({stringsKey})),

      chunkRows:
        stitchArrays({
          artistLinks: listArtistLinks,
          artistCounts: listArtistCounts,
          countFunction: listCountFunctions,
        }).map(({artistLinks, artistCounts, countFunction}) =>
            stitchArrays({
              artistLink: artistLinks,
              artistCount: artistCounts,
            }).map(({artistLink, artistCount}) => ({
                artist: artistLink,
                contributions: language[countFunction](artistCount, {unit: true}),
              }))),
    });
  },
};
