import {showAggregate} from '#aggregate';
import {empty} from '#sugar';

const listingSpec = [];

listingSpec.push({
  directory: 'artists/by-name',
  stringsKey: 'listArtists.byName',
  contentFunction: 'listArtistsByName',
  seeAlso: ['artists/by-contribs'],
});

listingSpec.push({
  directory: 'artists/by-contribs',
  stringsKey: 'listArtists.byContribs',
  contentFunction: 'listArtistsByContributions',
  seeAlso: ['artists/by-name'],
});

listingSpec.push({
  directory: 'artists/by-commentary',
  stringsKey: 'listArtists.byCommentary',
  contentFunction: 'listArtistsByCommentaryEntries',
});

listingSpec.push({
  directory: 'artists/by-latest',
  stringsKey: 'listArtists.byLatest',
  contentFunction: 'listArtistsByLatestContribution',
});

// listingSpec.push({
//   directory: 'random',
//   stringsKey: 'other.randomPages',
//   contentFunction: 'listRandomPageLinks',
//   groupUnderOther: true,
// });

// Dunkass mock. Listings should be Things! In the fuuuuture!
class Listing {
  static properties = {};

  constructor() {
    Object.assign(this, this.constructor.properties);
  }

  static hasPropertyDescriptor(key) {
    return Object.hasOwn(this.properties, key);
  }
}

for (const [index, listing] of listingSpec.entries()) {
  class ListingSubclass extends Listing {
    static properties = listing;
  }

  listingSpec.splice(index, 1, new ListingSubclass);
}

{
  const errors = [];

  for (const listing of listingSpec) {
    if (listing.seeAlso) {
      const suberrors = [];

      for (let i = 0; i < listing.seeAlso.length; i++) {
        const directory = listing.seeAlso[i];
        const match = listingSpec.find(listing => listing.directory === directory);

        if (match) {
          listing.seeAlso[i] = match;
        } else {
          listing.seeAlso[i] = null;
          suberrors.push(new Error(`(index: ${i}) Didn't find a listing matching ${directory}`))
        }
      }

      listing.seeAlso = listing.seeAlso.filter(Boolean);

      if (!empty(suberrors)) {
        errors.push(new AggregateError(suberrors, `Errors matching "see also" listings for ${listing.directory}`));
      }
    } else {
      listing.seeAlso = [];
    }
  }

  if (!empty(errors)) {
    const aggregate = new AggregateError(errors, `Errors validating listings`);
    showAggregate(aggregate, {showTraces: false});
  }
}

const filterListings = (directoryPrefix) =>
  listingSpec.filter(l => l.directory.startsWith(directoryPrefix));

const listingTargetSpec = [
  {
    stringsKey: 'artist',
    listings: filterListings('artist'),
  },
  {
    stringsKey: 'other',
    listings: listingSpec.filter(l => l.groupUnderOther),
  },
];

for (const target of listingTargetSpec) {
  for (const listing of target.listings) {
    listing.target = target;
  }
}

export {listingSpec, listingTargetSpec};
