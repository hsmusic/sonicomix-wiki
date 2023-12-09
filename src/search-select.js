// Complements the specs in search-shape.js with the functions that actually
// process live wiki data into records that are appropriate for storage.
// These files totally go together, so read them side by side, okay?

import baseSearchSpec from '#search-shape';

function prepareArtwork(artwork, thing, {
  checkIfImagePathHasCachedThumbnails,
  getThumbnailEqualOrSmaller,
  urls,
}) {
  if (!artwork) {
    return undefined;
  }

  const artworkPath =
    artwork.path;

  if (!artworkPath) {
    return undefined;
  }

  const mediaSrc =
    urls
      .from('media.root')
      .to(...artworkPath);

  if (!checkIfImagePathHasCachedThumbnails(mediaSrc)) {
    return undefined;
  }

  const selectedSize =
    getThumbnailEqualOrSmaller('adorb', mediaSrc);

  const mediaSrcJpeg =
    mediaSrc.replace(/\.(png|jpg)$/, `.${selectedSize}.jpg`);

  const displaySrc =
    urls
      .from('thumb.root')
      .to('thumb.path', mediaSrcJpeg);

  const serializeSrc =
    displaySrc.replace(thing.directory, '<>');

  return serializeSrc;
}

function baselineProcess(thing, _opts) {
  const fields = {};

  fields.primaryName =
    thing.name;

  fields.artwork =
    null;

  fields.color =
    thing.color;

  fields.disambiguator =
    null;

  return fields;
}

function genericSelect(wikiData) {
  return [
    wikiData.artistData
      .filter(artist => !artist.isAlias),
  ].flat();
}

function genericProcess(thing, opts) {
  const fields = baselineProcess(thing, opts);

  // eslint-disable-next-line no-unused-vars
  const boundPrepareArtwork = artwork =>
    prepareArtwork(artwork, thing, opts);

  fields.artwork =
    null;

  fields.parentName =
    null;

  fields.disambiguator =
    fields.parentName;

  fields.additionalNames =
    (thing.constructor.hasPropertyDescriptor('additionalNames')
      ? thing.additionalNames.map(entry => entry.name)
   : thing.constructor.hasPropertyDescriptor('artistAliases')
      ? thing.artistAliases.map(alias => alias.name)
      : []);

  const contribKeys = [];

  const contributions =
    contribKeys
      .flatMap(key => thing[key] ?? []);

  fields.contributors =
    contributions
      .flatMap(({artist}) => [
        artist.name,
        ...artist.artistAliases.map(alias => alias.name),
      ]);

  return fields;
}

const spiffySearchSpec = {
  generic: {
    ...baseSearchSpec.generic,

    select: genericSelect,
    process: genericProcess,
  },

  verbatim: {
    ...baseSearchSpec.verbatim,

    select: genericSelect,
    process: genericProcess,
  },
};

export default spiffySearchSpec;
