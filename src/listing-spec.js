import {empty, showAggregate} from '#sugar';

const listingSpec = [];

listingSpec.push({
  directory: 'artists/by-name',
  stringsKey: 'listArtists.byName',
  contentFunction: 'listArtistsByName',
  seeAlso: ['artists/by-contribs', 'artists/by-group'],
});

listingSpec.push({
  directory: 'artists/by-contribs',
  stringsKey: 'listArtists.byContribs',
  contentFunction: 'listArtistsByContributions',
  seeAlso: ['artists/by-name', 'artists/by-group'],
});

listingSpec.push({
  directory: 'artists/by-commentary',
  stringsKey: 'listArtists.byCommentary',
  contentFunction: 'listArtistsByCommentaryEntries',
});

listingSpec.push({
  directory: 'random',
  stringsKey: 'other.randomPages',
  contentFunction: 'listRandomPageLinks',
  groupUnderOther: true,
});

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
      listing.seeAlso = null;
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
    stringsKey: 'album',
    listings: filterListings('album'),
  },
  {
    stringsKey: 'artist',
    listings: filterListings('artist'),
  },
  {
    stringsKey: 'group',
    listings: filterListings('group'),
  },
  {
    stringsKey: 'track',
    listings: filterListings('track'),
  },
  {
    stringsKey: 'tag',
    listings: filterListings('tag'),
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
