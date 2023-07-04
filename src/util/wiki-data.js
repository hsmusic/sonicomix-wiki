// Utility functions for interacting with wiki data.

import {
  accumulateSum,
  empty,
  stitchArrays,
  unique,
} from './sugar.js';

// Generic value operations

export function getKebabCase(name) {
  return name
    .split(' ')
    .join('-')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function chunkByConditions(array, conditions) {
  if (empty(array)) {
    return [];
  }

  if (empty(conditions)) {
    return [array];
  }

  const out = [];
  let cur = [array[0]];
  for (let i = 1; i < array.length; i++) {
    const item = array[i];
    const prev = array[i - 1];
    let chunk = false;
    for (const condition of conditions) {
      if (condition(item, prev)) {
        chunk = true;
        break;
      }
    }
    if (chunk) {
      out.push(cur);
      cur = [item];
    } else {
      cur.push(item);
    }
  }
  out.push(cur);
  return out;
}

export function chunkByProperties(array, properties) {
  return chunkByConditions(
    array,
    properties.map((p) => (a, b) => {
      if (a[p] instanceof Date && b[p] instanceof Date) return +a[p] !== +b[p];

      if (a[p] !== b[p]) return true;

      // Not sure if this line is still necessary with the specific check for
      // d8tes a8ove, 8ut, uh, keeping it anyway, just in case....?
      if (a[p] != b[p]) return true;

      return false;
    })
  ).map((chunk) => ({
    ...Object.fromEntries(properties.map((p) => [p, chunk[0][p]])),
    chunk,
  }));
}

// Sorting functions - all utils here are mutating, so make sure to initially
// slice/filter/somehow generate a new array from input data if retaining the
// initial sort matters! (Spoilers: If what you're doing involves any kind of
// parallelization, it definitely matters.)

// General sorting utilities! These don't do any sorting on their own but are
// handy in the sorting functions below (or if you're making your own sort).

export function compareCaseLessSensitive(a, b) {
  // Compare two strings without considering capitalization... unless they
  // happen to be the same that way.

  const al = a.toLowerCase();
  const bl = b.toLowerCase();

  return al === bl
    ? a.localeCompare(b, undefined, {numeric: true})
    : al.localeCompare(bl, undefined, {numeric: true});
}

// Subtract common prefixes and other characters which some people don't like
// to have considered while sorting. The words part of this is English-only for
// now, which is totally evil.
export function normalizeName(s) {
  // Turn (some) ligatures into expanded variant for cleaner sorting, e.g.
  // "ﬀ" into "ff", in decompose mode, so that "ü" is represented as two
  // bytes ("u" + \u0308 combining diaeresis).
  s = s.normalize('NFKD');

  // Replace one or more whitespace of any kind in a row, as well as certain
  // punctuation, with a single typical space, then trim the ends.
  s = s
    .replace(
      /[\p{Separator}\p{Dash_Punctuation}\p{Connector_Punctuation}]+/gu,
      ' '
    )
    .trim();

  // Discard anything that isn't a letter, number, or space.
  s = s.replace(/[^\p{Letter}\p{Number} ]/gu, '').trim();

  // Remove common English (only, for now) prefixes.
  s = s.replace(/^(?:an?|the) /i, '');

  return s;
}

// Sorts multiple arrays by an arbitrary function (which is the last argument).
// Values from each array are paired: (a_fromFirstArray, b_fromFirstArray,
// a_fromSecondArray, b_fromSecondArray), etc. This definitely only works if
// all arrays are of the same length.
export function sortMultipleArrays(...args) {
  const arrays = args.slice(0, -1);
  const fn = args.at(-1);

  const length = arrays[0].length;
  const symbols = new Array(length).fill(null).map(() => Symbol());
  const indexes = Object.fromEntries(symbols.map((symbol, index) => [symbol, index]));

  symbols.sort((a, b) => {
    const indexA = indexes[a];
    const indexB = indexes[b];

    const args = [];
    for (let i = 0; i < arrays.length; i++) {
      args.push(arrays[i][indexA]);
      args.push(arrays[i][indexB]);
    }

    return fn(...args);
  });

  for (const array of arrays) {
    // Note: We're mutating this array pulling values from itself, but only all
    // at once after all those values have been pulled.
    array.splice(0, array.length, ...symbols.map(symbol => array[indexes[symbol]]));
  }

  return arrays;
}

// Filters multiple arrays by an arbitrary function (which is the last argument).
// Values from each array are sequential: (value_fromFirstArray,
// value_fromSecondArray, value_fromThirdArray, index, [firstArray, secondArray,
// thirdArray]), etc. This definitely only works if all arrays are of the same
// length.
export function filterMultipleArrays(...args) {
  const arrays = args.slice(0, -1);
  const fn = args.at(-1);

  const length = arrays[0].length;
  const removed = new Array(length).fill(null).map(() => []);

  for (let i = length - 1; i >= 0; i--) {
    const args = arrays.map(array => array[i]);

    if (!fn(...args)) {
      for (let j = 0; j < arrays.length; j++) {
        const item = arrays[j][i];
        arrays[j].splice(i, 1);
        removed[j].unshift(item);
      }
    }
  }

  Object.assign(arrays, {removed});
  return arrays;
}

// Component sort functions - these sort by one particular property, applying
// unique particulars where appropriate. Usually you don't want to use these
// directly, but if you're making a custom sort they can come in handy.

// Universal method for sorting things into a predictable order, as directory
// is taken to be unique. There are two exceptions where this function (and
// thus any of the composite functions that start with it) *can't* be taken as
// deterministic:
//
//  1) Mixed data of two different Things, as directories are only taken as
//     unique within one given class of Things. For example, this function
//     won't be deterministic if its array contains both <album:ithaca> and
//     <track:ithaca>.
//
//  2) Duplicate directories, or multiple instances of the "same" Thing.
//     This function doesn't differentiate between two objects of the same
//     directory, regardless of any other properties or the overall "identity"
//     of the object.
//
// These exceptions are unavoidable except for not providing that kind of data
// in the first place, but you can still ensure the overall program output is
// deterministic by ensuring the input is arbitrarily sorted according to some
// other criteria - ex, although sortByDirectory itself isn't determinstic when
// given mixed track and album data, the final output (what goes on the site)
// will always be the same if you're doing sortByDirectory([...albumData,
// ...trackData]), because the initial sort places albums before tracks - and
// sortByDirectory will handle the rest, given all directories are unique
// except when album and track directories overlap with each other.
export function sortByDirectory(data, {
  getDirectory = object => object.directory,
} = {}) {
  const directories = data.map(getDirectory);

  sortMultipleArrays(data, directories,
    (a, b, directoryA, directoryB) =>
      compareCaseLessSensitive(directoryA, directoryB));

  return data;
}

export function sortByName(data, {
  getName = object => object.name,
} = {}) {
  const names = data.map(getName);
  const normalizedNames = names.map(normalizeName);

  sortMultipleArrays(data, normalizedNames, names,
    (
      a, b,
      normalizedA, normalizedB,
      nonNormalizedA, nonNormalizedB,
    ) =>
      compareNormalizedNames(
        normalizedA, normalizedB,
        nonNormalizedA, nonNormalizedB,
      ));

  return data;
}

export function compareNormalizedNames(
  normalizedA, normalizedB,
  nonNormalizedA, nonNormalizedB,
) {
  const comparison = compareCaseLessSensitive(normalizedA, normalizedB);
  return (
    (comparison === 0
      ? compareCaseLessSensitive(nonNormalizedA, nonNormalizedB)
      : comparison));
}

export function sortByDate(data, {
  getDate = object => object.date,
  latestFirst = false,
} = {}) {
  const dates = data.map(getDate);

  sortMultipleArrays(data, dates,
    (a, b, dateA, dateB) =>
      compareDates(dateA, dateB, {latestFirst}));

  return data;
}

export function compareDates(a, b, {
  latestFirst = false,
} = {}) {
  if (a && b) {
    return (latestFirst ? b - a : a - b);
  }

  // It's possible for objects with and without dates to be mixed
  // together in the same array. If that's the case, we put all items
  // without dates at the end.
  if (a) return -1;
  if (b) return 1;

  // If neither of the items being compared have a date, don't move
  // them relative to each other. This is basically the same as
  // filtering out all non-date items and then pushing them at the
  // end after sorting the rest.
  return 0;
}

export function getLatestDate(dates) {
  const filtered = dates.filter(Boolean);
  if (empty(filtered)) return null;

  return filtered
    .reduce(
      (accumulator, date) =>
        date > accumulator ? date : accumulator,
      -Infinity);
}

export function getEarliestDate(dates) {
  const filtered = dates.filter(Boolean);
  if (empty(filtered)) return null;

  return filtered
    .reduce(
      (accumulator, date) =>
        date < accumulator ? date : accumulator,
      Infinity);
}

// Funky sort which takes a data set and a corresponding list of "counts",
// which are really arbitrary numbers representing some property of each data
// object defined by the caller. It sorts and mutates *both* of these, so the
// sorted data will still correspond to the same indexed count.
export function sortByCount(data, counts, {
  greatestFirst = false,
} = {}) {
  sortMultipleArrays(data, counts, (data1, data2, count1, count2) =>
    (greatestFirst
      ? count2 - count1
      : count1 - count2));

  return data;
}

// Corresponding filter function for the above sort. By default, items whose
// corresponding count is zero will be removed.
export function filterByCount(data, counts, {
  min = 1,
  max = Infinity,
} = {}) {
  filterMultipleArrays(data, counts, (data, count) =>
    count >= min && count <= max);
}

export function sortByPositionInParent(data, {
  getParent,
  getChildren,
}) {
  return data.sort((a, b) => {
    const parentA = getParent(a);
    const parentB = getParent(b);

    // Don't change the sort when the two items are from separate parents.
    // This function doesn't change the order of parents or try to "merge"
    // two separated chunks of items from the same parent together.
    if (parentA !== parentB) {
      return 0;
    }

    // Don't change the sort when either (or both) of the items doesn't
    // even have a parent (e.g. it's the passed data is a mixed array of
    // children and parents).
    if (!parentA || !parentB) {
      return 0;
    }

    const indexA = getChildren(parentA).indexOf(a);
    const indexB = getChildren(parentB).indexOf(b);

    // If the getParent/getChildren relationship doesn't go both ways for
    // some reason, don't change the sort.
    if (indexA === -1 || indexB === -1) {
      return 0;
    }

    return indexA - indexB;
  });
}

export function sortByPositionInAlbum(data) {
  return sortByPositionInParent(data, {
    getParent: track => track.album,
    getChildren: album => album.tracks,
  });
}

export function sortByPositionInFlashAct(data) {
  return sortByPositionInParent(data, {
    getParent: flash => flash.act,
    getChildren: act => act.flashes,
  });
}

// Sorts data so that items are grouped together according to whichever of a
// set of arbitrary given conditions is true first. If no conditions are met
// for a given item, it's moved over to the end!
export function sortByConditions(data, conditions) {
  return data.sort((a, b) => {
    const ai = conditions.findIndex((f) => f(a));
    const bi = conditions.findIndex((f) => f(b));

    if (ai >= 0 && bi >= 0) {
      return ai - bi;
    } else if (ai >= 0) {
      return -1;
    } else if (bi >= 0) {
      return 1;
    } else {
      return 0;
    }
  });
}

// Composite sorting functions - these consider multiple properties, generally
// always returning the same output regardless of how the input was originally
// sorted (or left unsorted). If you're working with arbitrarily sorted inputs
// (typically wiki data, either in full or unsorted filter), these make sure
// what gets put on the actual website (or wherever) is deterministic. Also
// they're just handy sorting utilities.
//
// Note that because these are each comprised of multiple component sorting
// functions, they expect more than just one property to be present for full
// sorting (listed above each function). If you're mapping thing objects to
// another representation, try to include all of these listed properties.

// Expects thing properties:
//  * directory (or override getDirectory)
//  * name (or override getName)
export function sortAlphabetically(data, {
  getDirectory,
  getName,
} = {}) {
  sortByDirectory(data, {getDirectory});
  sortByName(data, {getName});
  return data;
}

// Expects thing properties:
//  * directory (or override getDirectory)
//  * name (or override getName)
//  * date (or override getDate)
export function sortChronologically(data, {
  latestFirst = false,
  getDirectory,
  getName,
  getDate,
} = {}) {
  sortAlphabetically(data, {getDirectory, getName});
  sortByDate(data, {latestFirst, getDate});
  return data;
}

// This one's a little odd! Sorts an array of {entry, thing} pairs using
// the provided sortFunction, which will operate on each item's `thing`, not
// its entry (or the item as a whole). If multiple entries are associated
// with the same thing, they'll end up bunched together in the output,
// retaining their original relative positioning.
export function sortEntryThingPairs(data, sortFunction) {
  const things = unique(data.map(item => item.thing));
  sortFunction(things);

  const outputArrays = [];
  const thingToOutputArray = new Map();

  for (const thing of things) {
    const array = [];
    thingToOutputArray.set(thing, array);
    outputArrays.push(array);
  }

  for (const item of data) {
    thingToOutputArray.get(item.thing).push(item);
  }

  data.splice(0, data.length, ...outputArrays.flat());

  return data;
}

/*
// Alternate draft version of sortEntryThingPairs.
// See: https://github.com/hsmusic/hsmusic-wiki/issues/90#issuecomment-1607412168

// Maps the provided "preparation" function across a list of arbitrary values,
// building up a list of sortable values; sorts these with the provided sorting
// function; and reorders the sources to match their corresponding prepared
// values. As usual, if multiple source items correspond to the same sorting
// data, this retains the source relative positioning.
export function prepareAndSort(sources, prepareForSort, sortFunction) {
  const prepared = [];
  const preparedToSource = new Map();

  for (const original of originals) {
    const prep = prepareForSort(source);
    prepared.push(prep);
    preparedToSource.set(prep, source);
  }

  sortFunction(prepared);

  sources.splice(0, ...sources.length, prepared.map(prep => preparedToSource.get(prep)));

  return sources;
}
*/

// Highly contextual sort functions - these are only for very specific types
// of Things, and have appropriately hard-coded behavior.

// Sorts so that tracks from the same album are generally grouped together in
// their original (album track list) order, while prioritizing date (by default
// release date but can be overridden) above all else.
//
// This function also works for data lists which contain only tracks.
export function sortAlbumsTracksChronologically(data, {
  latestFirst = false,
  getDate,
} = {}) {
  // Sort albums before tracks...
  sortByConditions(data, [(t) => t.album === undefined]);

  // Group tracks by album...
  sortByDirectory(data, {
    getDirectory: (t) => (t.album ? t.album.directory : t.directory),
  });

  // Sort tracks by position in album...
  sortByPositionInAlbum(data);

  // ...and finally sort by date. If tracks from more than one album were
  // released on the same date, they'll still be grouped together by album,
  // and tracks within an album will retain their relative positioning (i.e.
  // stay in the same order as part of the album's track listing).
  sortByDate(data, {latestFirst, getDate});

  return data;
}

export function sortFlashesChronologically(data, {
  latestFirst = false,
  getDate,
} = {}) {
  // Flash acts don't actually have any identifying properties because they
  // don't have dedicated pages (yet), so don't have a directory. Make up a
  // fake key identifying them so flashes can be grouped together.
  const flashActs = new Set(data.map(flash => flash.act));
  const flashActIdentifiers = new Map();

  let counter = 0;
  for (const act of flashActs) {
    flashActIdentifiers.set(act, ++counter);
  }

  // Group flashes by act...
  data.sort((a, b) => {
    return flashActIdentifiers.get(a.act) - flashActIdentifiers.get(b.act);
  });

  // Sort flashes by position in act...
  sortByPositionInFlashAct(data);

  // ...and finally sort by date. If flashes from more than one act were
  // released on the same date, they'll still be grouped together by act,
  // and flashes within an act will retain their relative positioning (i.e.
  // stay in the same order as the act's flash listing).
  sortByDate(data, {latestFirst, getDate});

  return data;
}

// Specific data utilities

export function filterAlbumsByCommentary(albums) {
  return albums
    .filter((album) => [album, ...album.tracks].some((x) => x.commentary));
}

export function getAlbumCover(album, {to}) {
  // Some albums don't have art! This function returns null in that case.
  if (album.hasCoverArt) {
    return to('media.albumCover', album.directory, album.coverArtFileExtension);
  } else {
    return null;
  }
}

export function getAlbumListTag(album) {
  return album.hasTrackNumbers ? 'ol' : 'ul';
}

// This gets all the track o8jects defined in every al8um, and sorts them 8y
// date released. Generally, albumData will pro8a8ly already 8e sorted 8efore
// you pass it to this function, 8ut individual tracks can have their own
// original release d8, distinct from the al8um's d8. I allowed that 8ecause
// in Homestuck, the first four Vol.'s were com8ined into one al8um really
// early in the history of the 8andcamp, and I still want to use that as the
// al8um listing (not the original four al8um listings), 8ut if I only did
// that, all the tracks would 8e sorted as though they were released at the
// same time as the compilation al8um - i.e, after some other al8ums (including
// Vol.'s 5 and 6!) were released. That would mess with chronological listings
// including tracks from multiple al8ums, like artist pages. So, to fix that,
// I gave tracks an Original Date field, defaulting to the release date of the
// al8um if not specified. Pretty reasona8le, I think! Oh, and this feature can
// 8e used for other projects too, like if you wanted to have an al8um listing
// compiling a 8unch of songs with radically different & interspersed release
// d8s, 8ut still keep the al8um listing in a specific order, since that isn't
// sorted 8y date.
export function getAllTracks(albumData) {
  return sortByDate(albumData.flatMap((album) => album.tracks));
}

export function getArtistNumContributions(artist) {
  return (
    (artist.tracksAsAny?.length ?? 0) +
    (artist.albumsAsCoverArtist?.length ?? 0) +
    (artist.flashesAsContributor?.length ?? 0)
  );
}

export function getFlashCover(flash, {to}) {
  return to('media.flashArt', flash.directory, flash.coverArtFileExtension);
}

export function getFlashLink(flash) {
  return `https://homestuck.com/story/${flash.page}`;
}

export function getTotalDuration(tracks, {
  originalReleasesOnly = false,
} = {}) {
  if (originalReleasesOnly) {
    tracks = tracks.filter(t => !t.originalReleaseTrack);
  }

  return accumulateSum(tracks, track => track.duration);
}

export function getTrackCover(track, {to}) {
  // Some albums don't have any track art at all, and in those, every track
  // just inherits the album's own cover art. Note that since cover art isn't
  // guaranteed on albums either, it's possible that this function returns
  // null!
  if (!track.hasCoverArt) {
    return getAlbumCover(track.album, {to});
  } else {
    return to('media.trackCover', track.album.directory, track.directory, track.coverArtFileExtension);
  }
}

export function getArtistAvatar(artist, {to}) {
  return to('media.artistAvatar', artist.directory, artist.avatarFileExtension);
}

// Big-ass homepage row functions

export function getNewAdditions(numAlbums, {wikiData}) {
  const sortedAlbums = wikiData.albumData
    .filter((album) => album.isListedOnHomepage)
    .sort((a, b) => {
      if (a.dateAddedToWiki > b.dateAddedToWiki) return -1;
      if (a.dateAddedToWiki < b.dateAddedToWiki) return 1;
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });

  // When multiple al8ums are added to the wiki at a time, we want to show
  // all of them 8efore pulling al8ums from the next (earlier) date. We also
  // want to show a diverse selection of al8ums - with limited space, we'd
  // rather not show only the latest al8ums, if those happen to all 8e
  // closely rel8ted!
  //
  // Specifically, we're concerned with avoiding too much overlap amongst
  // the primary (first/top-most) group. We do this 8y collecting every
  // primary group present amongst the al8ums for a given d8 into one
  // (ordered) array, initially sorted (inherently) 8y latest al8um from
  // the group. Then we cycle over the array, adding one al8um from each
  // group until all the al8ums from that release d8 have 8een added (or
  // we've met the total target num8er of al8ums). Once we've added all the
  // al8ums for a given group, it's struck from the array (so the groups
  // with the most additions on one d8 will have their oldest releases
  // collected more towards the end of the list).

  const albums = [];

  let i = 0;
  outerLoop: while (i < sortedAlbums.length) {
    // 8uild up a list of groups and their al8ums 8y order of decending
    // release, iter8ting until we're on a different d8. (We use a map for
    // indexing so we don't have to iter8te through the entire array each
    // time we access one of its entries. This is 8asically unnecessary
    // since this will never 8e an expensive enough task for that to
    // matter.... 8ut it's nicer code. BBBB) )
    const currentDate = sortedAlbums[i].dateAddedToWiki;
    const groupMap = new Map();
    const groupArray = [];
    for (let album; (album = sortedAlbums[i]) && +album.dateAddedToWiki === +currentDate; i++) {
      const primaryGroup = album.groups[0];
      if (groupMap.has(primaryGroup)) {
        groupMap.get(primaryGroup).push(album);
      } else {
        const entry = [album];
        groupMap.set(primaryGroup, entry);
        groupArray.push(entry);
      }
    }

    // Then cycle over that sorted array, adding one al8um from each to
    // the main array until we've run out or have met the target num8er
    // of al8ums.
    while (!empty(groupArray)) {
      let j = 0;
      while (j < groupArray.length) {
        const entry = groupArray[j];
        const album = entry.shift();
        albums.push(album);

        // This is the only time we ever add anything to the main al8um
        // list, so it's also the only place we need to check if we've
        // met the target length.
        if (albums.length === numAlbums) {
          // If we've met it, 8r8k out of the outer loop - we're done
          // here!
          break outerLoop;
        }

        if (empty(entry)) {
          groupArray.splice(j, 1);
        } else {
          j++;
        }
      }
    }
  }

  return albums.map((album) => ({item: album}));
}

export function getNewReleases(numReleases, {wikiData}) {
  return wikiData.albumData
    .filter((album) => album.isListedOnHomepage)
    .reverse()
    .slice(0, numReleases)
    .map((album) => ({item: album}));
}

// Carousel layout and utilities

// Layout constants:
//
// Carousels support fitting 4-18 items, with a few "dead" zones to watch out
// for, namely when a multiple of 6, 5, or 4 columns would drop the last tiles.
//
// Carousels are limited to 1-3 rows and 4-6 columns.
// Lower edge case: 1-3 items are treated as 4 items (with blank space).
// Upper edge case: all items past 18 are dropped (treated as 18 items).
//
// This is all done through JS instead of CSS because it's just... ANNOYING...
// to write a mapping like this in CSS lol.
const carouselLayoutMap = [
  // 0-3
  null, null, null, null,

  // 4-6
  {rows: 1, columns: 4}, //  4: 1x4, drop 0
  {rows: 1, columns: 5}, //  5: 1x5, drop 0
  {rows: 1, columns: 6}, //  6: 1x6, drop 0

  // 7-12
  {rows: 1, columns: 6}, //  7: 1x6, drop 1
  {rows: 2, columns: 4}, //  8: 2x4, drop 0
  {rows: 2, columns: 4}, //  9: 2x4, drop 1
  {rows: 2, columns: 5}, // 10: 2x5, drop 0
  {rows: 2, columns: 5}, // 11: 2x5, drop 1
  {rows: 2, columns: 6}, // 12: 2x6, drop 0

  // 13-18
  {rows: 2, columns: 6}, // 13: 2x6, drop 1
  {rows: 2, columns: 6}, // 14: 2x6, drop 2
  {rows: 3, columns: 5}, // 15: 3x5, drop 0
  {rows: 3, columns: 5}, // 16: 3x5, drop 1
  {rows: 3, columns: 5}, // 17: 3x5, drop 2
  {rows: 3, columns: 6}, // 18: 3x6, drop 0
];

const minCarouselLayoutItems = carouselLayoutMap.findIndex(x => x !== null);
const maxCarouselLayoutItems = carouselLayoutMap.length - 1;
const shortestCarouselLayout = carouselLayoutMap[minCarouselLayoutItems];
const longestCarouselLayout = carouselLayoutMap[maxCarouselLayoutItems];

export function getCarouselLayoutForNumberOfItems(numItems) {
  return (
    numItems < minCarouselLayoutItems ? shortestCarouselLayout :
    numItems > maxCarouselLayoutItems ? longestCarouselLayout :
    carouselLayoutMap[numItems]);
}

export function filterItemsForCarousel(items) {
  if (empty(items)) {
    return [];
  }

  return items
    .filter(item => item.hasCoverArt)
    .filter(item => item.artTags.every(tag => !tag.isContentWarning))
    .slice(0, maxCarouselLayoutItems + 1);
}
