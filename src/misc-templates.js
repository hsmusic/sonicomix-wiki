// Miscellaneous utility functions which are useful across page specifications.
// These are made available right on a page spec's ({wikiData, language, ...})
// args object!

import T from './data/things/index.js';

import {
  empty,
  repeat,
  unique,
} from './util/sugar.js';

import {thumb} from './util/urls.js';

import {
  getTotalDuration,
  sortAlbumsTracksChronologically,
  sortChronologically,
} from './util/wiki-data.js';

// "Additional Files" listing

function unbound_generateAdditionalFilesShortcut(additionalFiles, {
  html,
  language,
}) {
  if (empty(additionalFiles)) return '';

  return language.$('releaseInfo.additionalFiles.shortcut', {
    anchorLink:
      html.tag('a',
        {href: '#additional-files'},
        language.$('releaseInfo.additionalFiles.shortcut.anchorLink')),
    titles: language.formatUnitList(
      additionalFiles.map(g => g.title)),
  });
}

// Chronology links

function unbound_generateChronologyLinks(currentThing, {
  html,
  language,
  link,

  generateNavigationLinks,

  dateKey = 'date',
  contribKey,
  getThings,
  headingString,
}) {
  const contributions = currentThing[contribKey];

  if (empty(contributions)) {
    return [];
  }

  if (contributions.length > 8) {
    return html.tag('div', {class: 'chronology'},
      language.$('misc.chronology.seeArtistPages'));
  }

  return contributions
    .map(({who: artist}) => {
      const thingsUnsorted = unique(getThings(artist))
        .filter((t) => t[dateKey]);

      // Kinda a hack, but we automatically detect which is (probably) the
      // right function to use here.
      const args = [thingsUnsorted, {getDate: (t) => t[dateKey]}];
      const things = (
        thingsUnsorted.every(t => t instanceof T.Album || t instanceof T.Track)
          ? sortAlbumsTracksChronologically(...args)
          : sortChronologically(...args));

      if (things.length === 0) return '';

      const index = things.indexOf(currentThing);

      if (index === -1) return '';

      const heading = (
        html.tag('span', {class: 'heading'},
          language.$(headingString, {
            index: language.formatIndex(index + 1, {language}),
            artist: link.artist(artist),
          })));

      const navigation = things.length > 1 &&
        html.tag('span',
          {
            [html.onlyIfContent]: true,
            class: 'buttons',
          },
          generateNavigationLinks(currentThing, {
            data: things,
            isMain: false,
          }));

      return (
        html.tag('div', {class: 'chronology'},
          (navigation
            ? language.$('misc.chronology.withNavigation', {
                heading,
                navigation,
              })
            : heading)));
    });
}

// Content warning tags

function unbound_getRevealStringFromContentWarningMessage(warnings, {
  html,
  language,
}) {
  return (
    language.$('misc.contentWarnings', {warnings}) +
    html.tag('br') +
    html.tag('span', {class: 'reveal-interaction'},
      language.$('misc.contentWarnings.reveal'))
  );
}

function unbound_getRevealStringFromArtTags(tags, {
  getRevealStringFromContentWarningMessage,
  language,
}) {
  return (
    tags?.some(tag => tag.isContentWarning) &&
      getRevealStringFromContentWarningMessage(
        language.formatUnitList(
          tags
            .filter(tag => tag.isContentWarning)
            .map(tag => tag.name)))
  );
}

// Cover art links

function unbound_generateCoverLink({
  html,
  img,
  language,
  link,

  getRevealStringFromArtTags,

  alt,
  path,
  src,
  tags = [],
  to,
  wikiData,
}) {
  const {wikiInfo} = wikiData;

  if (!src && path) {
    src = to(...path);
  }

  if (!src) {
    throw new Error(`Expected src or path`);
  }

  const linkedTags = tags.filter(tag => !tag.isContentWarning);

  return html.tag('div', {id: 'cover-art-container'}, [
    img({
      src,
      alt,
      thumb: 'medium',
      id: 'cover-art',
      link: true,
      square: true,
      reveal: getRevealStringFromArtTags(tags),
    }),

    wikiInfo.enableArtTagUI &&
    linkedTags.length &&
      html.tag('p', {class: 'tags'},
        language.$('releaseInfo.artTags.inline', {
          tags: language.formatUnitList(
            linkedTags.map(tag => link.tag(tag))),
        })),
  ]);
}

// Divided track lists

function unbound_generateTrackListDividedByGroups(tracks, {
  html,
  language,

  getTrackItem,
  wikiData,
}) {
  const {divideTrackListsByGroups: groups} = wikiData.wikiInfo;

  if (empty(groups)) {
    return html.tag('ul',
      tracks.map(t => getTrackItem(t)));
  }

  const lists = Object.fromEntries(
    groups.map((group) => [
      group.directory,
      {group, tracks: []}
    ]));

  const other = [];

  for (const track of tracks) {
    const {album} = track;
    const group = groups.find((g) => g.albums.includes(album));
    if (group) {
      lists[group.directory].tracks.push(track);
    } else {
      other.push(track);
    }
  }

  const dt = name =>
    html.tag('dt',
      language.$('trackList.group', {
        group: name,
      }));

  const ddul = tracks =>
    html.tag('dd',
      html.tag('ul',
        tracks.map(t => getTrackItem(t))));

  return html.tag('dl', [
    ...Object.values(lists)
      .filter(({tracks}) => tracks.length)
      .flatMap(({group, tracks}) => [
        dt(group.name),
        ddul(tracks),
      ]),

    ...html.fragment(
      other.length && [
        dt(language.$('trackList.group.other')),
        ddul(other),
      ]),
  ]);
}

// Fancy lookin' links

function unbound_fancifyURL(url, {
  html,
  language,

  album = false,
} = {}) {
  let local = Symbol();
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (error) {
    // No support for relative local URLs yet, sorry! (I.e, local URLs must
    // be absolute relative to the domain name in order to work.)
    domain = local;
  }

  return html.tag('a',
    {
      href: url,
      class: 'nowrap',
    },

    // truly unhinged indentation here
    domain === local
      ? language.$('misc.external.local')
  : domain.includes('bandcamp.com')
    ? language.$('misc.external.bandcamp')
  : BANDCAMP_DOMAINS.includes(domain)
    ? language.$('misc.external.bandcamp.domain', {domain})
  : MASTODON_DOMAINS.includes(domain)
    ? language.$('misc.external.mastodon.domain', {domain})
  : domain.includes('youtu')
    ? album
      ? url.includes('list=')
        ? language.$('misc.external.youtube.playlist')
        : language.$('misc.external.youtube.fullAlbum')
      : language.$('misc.external.youtube')
  : domain.includes('soundcloud')
    ? language.$('misc.external.soundcloud')
  : domain.includes('tumblr.com')
    ? language.$('misc.external.tumblr')
  : domain.includes('twitter.com')
    ? language.$('misc.external.twitter')
  : domain.includes('deviantart.com')
    ? language.$('misc.external.deviantart')
  : domain.includes('wikipedia.org')
    ? language.$('misc.external.wikipedia')
  : domain.includes('poetryfoundation.org')
    ? language.$('misc.external.poetryFoundation')
  : domain.includes('instagram.com')
    ? language.$('misc.external.instagram')
  : domain.includes('patreon.com')
    ? language.$('misc.external.patreon')
  : domain.includes('spotify.com')
    ? language.$('misc.external.spotify')
  : domain.includes('newgrounds.com')
    ? language.$('misc.external.newgrounds')
    : domain);
}

function unbound_fancifyFlashURL(url, flash, {
  html,
  language,

  fancifyURL,
}) {
  const link = fancifyURL(url);
  return html.tag('span',
    {class: 'nowrap'},
    url.includes('homestuck.com')
      ? isNaN(Number(flash.page))
        ? language.$('misc.external.flash.homestuck.secret', {link})
        : language.$('misc.external.flash.homestuck.page', {
            link,
            page: flash.page,
          })
  : url.includes('bgreco.net')
    ? language.$('misc.external.flash.bgreco', {link})
  : url.includes('youtu')
    ? language.$('misc.external.flash.youtube', {link})
    : link);
}

// Grids

function unbound_getGridHTML({
  img,
  html,
  language,

  getRevealStringFromArtTags,

  entries,
  srcFn,
  linkFn,
  noSrcTextFn = () => '',
  altFn = () => '',
  detailsFn = null,
  lazy = true,
}) {
  return entries
    .map(({large, item}, i) =>
      linkFn(item, {
        class: ['grid-item', 'box', large && 'large-grid-item'],
        text: html.fragment([
          img({
            src: srcFn(item),
            alt: altFn(item),
            thumb: 'medium',
            lazy: typeof lazy === 'number' ? i >= lazy : lazy,
            square: true,
            reveal: getRevealStringFromArtTags(item.artTags, {language}),
            noSrcText: noSrcTextFn(item),
          }),
          html.tag('span', item.name),
          detailsFn &&
            html.tag('span', detailsFn(item)),
        ]),
      }))
    .join('\n');
}

function unbound_getAlbumGridHTML({
  getAlbumCover,
  getGridHTML,
  link,
  language,
  details = false,
  ...props
}) {
  return getGridHTML({
    srcFn: getAlbumCover,
    linkFn: link.album,
    detailsFn:
      details &&
      ((album) =>
        language.$('misc.albumGrid.details', {
          tracks: language.countTracks(album.tracks.length, {unit: true}),
          time: language.formatDuration(getTotalDuration(album.tracks)),
        })),
    noSrcTextFn: (album) =>
      language.$('misc.albumGrid.noCoverArt', {
        album: album.name,
      }),
    ...props,
  });
}

function unbound_getFlashGridHTML({
  link,

  getFlashCover,
  getGridHTML,
  ...props
}) {
  return getGridHTML({
    srcFn: getFlashCover,
    linkFn: link.flash,
    ...props,
  });
}

// Images

function unbound_img({
  getSizeOfImageFile,
  html,
  to,

  src,
  alt,
  noSrcText = '',
  thumb: thumbKey,
  reveal,
  id,
  class: className,
  width,
  height,
  link = false,
  lazy = false,
  square = false,
}) {
  const willSquare = square;
  const willLink = typeof link === 'string' || link;

  const originalSrc = src;
  const thumbSrc = src && (thumbKey ? thumb[thumbKey](src) : src);

  const href =
    (willLink
      ? (typeof link === 'string'
          ? link
          : originalSrc)
      : null);

  let fileSize = null;
  const mediaRoot = to('media.root');
  if (href?.startsWith(mediaRoot)) {
    fileSize = getSizeOfImageFile(href.slice(mediaRoot.length).replace(/^\//, ''));
  }

  const imgAttributes = {
    id: link ? '' : id,
    class: className,
    alt,
    width,
    height,
    'data-original-size': fileSize,
  };

  const noSrcHTML =
    !src &&
      wrap(
        html.tag('div',
          {class: 'image-text-area'},
          noSrcText));

  const nonlazyHTML =
    src &&
      wrap(
        html.tag('img', {
          ...imgAttributes,
          src: thumbSrc,
        }));

  const lazyHTML =
    src &&
    lazy &&
      wrap(
        html.tag('img',
          {
            ...imgAttributes,
            class: [className, 'lazy'],
            'data-original': thumbSrc,
          }),
        true);

  if (!src) {
    return noSrcHTML;
  } else if (lazy) {
    return html.tag('noscript', nonlazyHTML) + '\n' + lazyHTML;
  } else {
    return nonlazyHTML;
  }

  function wrap(input, hide = false) {
    let wrapped = input;

    wrapped = html.tag('div', {class: 'image-container'}, wrapped);

    if (reveal) {
      wrapped = html.tag('div', {class: 'reveal'}, [
        wrapped,
        html.tag('span', {class: 'reveal-text-container'},
          html.tag('span', {class: 'reveal-text'}, reveal)),
      ]);
    }

    if (willSquare) {
      wrapped = html.tag('div', {class: 'square-content'}, wrapped);
      wrapped = html.tag('div',
        {class: ['square', hide && !willLink && 'js-hide']},
        wrapped);
    }

    if (willLink) {
      wrapped = html.tag('a',
        {
          id,
          class: ['box', hide && 'js-hide', 'image-link'],
          href,
        },
        wrapped);
    }

    return wrapped;
  }
}

// Carousel reels

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

function unbound_getCarouselHTML({
  html,
  img,

  items,
  lazy = false,

  altFn = () => '',
  linkFn = (x, {text}) => text,
  srcFn,
}) {
  if (empty(items)) {
    return;
  }

  const {rows, columns} = (
    items.length < minCarouselLayoutItems ? shortestCarouselLayout :
    items.length > maxCarouselLayoutItems ? longestCarouselLayout :
    carouselLayoutMap[items.length]);

  items = items.slice(0, maxCarouselLayoutItems + 1);

  return html.tag('div',
    {
      class: 'carousel-container',
      'data-carousel-rows': rows,
      'data-carousel-columns': columns,
    },
    repeat(3,
      html.tag('div',
        {
          class: 'carousel-grid',
          'aria-hidden': 'true',
        },
        items
          .filter(item => srcFn(item))
          .filter(item => item.artTags.every(tag => !tag.isContentWarning))
          .map((item, i) =>
            html.tag('div', {class: 'carousel-item'},
              linkFn(item, {
                attributes: {
                  tabindex: '-1',
                },
                text:
                  img({
                    src: srcFn(item),
                    alt: altFn(item),
                    thumb: 'small',
                    lazy: typeof lazy === 'number' ? i >= lazy : lazy,
                    square: true,
                  }),
              }))))));
}

// Nav-bar links

function unbound_generateInfoGalleryLinks(currentThing, isGallery, {
  link,
  language,

  linkKeyGallery,
  linkKeyInfo,
}) {
  return [
    link[linkKeyInfo](currentThing, {
      class: isGallery ? '' : 'current',
      text: language.$('misc.nav.info'),
    }),
    link[linkKeyGallery](currentThing, {
      class: isGallery ? 'current' : '',
      text: language.$('misc.nav.gallery'),
    }),
  ].join(', ');
}

// Generate "previous" and "next" links relative to a given current thing and a
// data set (array of things) which includes it, optionally including additional
// provided links like "random". This is for use in navigation bars and other
// inline areas.
//
// By default, generated links include ID attributes which enable client-side
// keyboard shortcuts. Provide isMain: false to disable this (if the generated
// links aren't the for the page's primary navigation).
function unbound_generateNavigationLinks(current, {
  language,
  link,

  additionalLinks = [],
  data,
  isMain = true,
  linkKey = 'anything',
  returnAsArray = false,
}) {
  let previousLink, nextLink;

  if (current) {
    const linkFn = link[linkKey].bind(link);

    const index = data.indexOf(current);
    const previousThing = data[index - 1];
    const nextThing = data[index + 1];

    previousLink = previousThing &&
      linkFn(previousThing, {
        attributes: {
          id: isMain && 'previous-button',
          title: previousThing.name,
        },
        text: language.$('misc.nav.previous'),
        color: false,
      });

    nextLink = nextThing &&
      linkFn(nextThing, {
        attributes: {
          id: isMain && 'next-button',
          title: nextThing.name,
        },
        text: language.$('misc.nav.next'),
        color: false,
      });
  }

  const links = [
    previousLink,
    nextLink,
    ...additionalLinks,
  ].filter(Boolean);

  if (returnAsArray) {
    return links;
  } else if (empty(links)) {
    return '';
  } else {
    return language.formatUnitList(links);
  }
}

// Sticky heading, ooooo

function unbound_generateStickyHeadingContainer({
  html,
  img,

  class: classes,
  coverSrc,
  coverAlt,
  coverArtTags,
  title,
}) {
  return html.tag('div',
    {class: [
      'content-sticky-heading-container',
      coverSrc && 'has-cover',
    ].concat(classes)},
    [
      html.tag('div', {class: 'content-sticky-heading-row'}, [
        html.tag('h1', title),

        // Cover art in the sticky heading never uses the 'reveal' setting
        // because it's too small to effectively display content warnings.
        // Instead, if art has content warnings, it's hidden from the sticky
        // heading by default, and will be enabled once the main cover art
        // is revealed.
        coverSrc &&
          html.tag('div', {class: 'content-sticky-heading-cover-container'},
            html.tag('div',
              {
                class: [
                  'content-sticky-heading-cover',
                  coverArtTags .some(tag => !tag.isContentWarning) &&
                    'content-sticky-heading-cover-needs-reveal',
                ],
              },
              img({
                src: coverSrc,
                alt: coverAlt,
                thumb: 'small',
                link: false,
                square: true,
              }))),
      ]),

      html.tag('div', {class: 'content-sticky-subheading-row'},
        html.tag('h2', {class: 'content-sticky-subheading'})),
    ]);
}

// Footer stuff

function unbound_getFooterLocalizationLinks({
  html,
  defaultLanguage,
  language,
  languages,
  pagePath,
  to,
}) {
  const links = Object.entries(languages)
    .filter(([code, language]) => code !== 'default' && !language.hidden)
    .map(([code, language]) => language)
    .sort(({name: a}, {name: b}) => (a < b ? -1 : a > b ? 1 : 0))
    .map((language) =>
      html.tag('span',
        html.tag('a',
          {
            href:
              language === defaultLanguage
                ? to(
                    'localizedDefaultLanguage.' + pagePath[0],
                    ...pagePath.slice(1))
                : to(
                    'localizedWithBaseDirectory.' + pagePath[0],
                    language.code,
                    ...pagePath.slice(1)),
          },
          language.name)));

  return html.tag('div', {class: 'footer-localization-links'},
    language.$('misc.uiLanguage', {
      languages: links.join('\n'),
    }));
}

// Exports

export {
  unbound_generateAdditionalFilesList as generateAdditionalFilesList,
  unbound_generateAdditionalFilesShortcut as generateAdditionalFilesShortcut,

  unbound_generateChronologyLinks as generateChronologyLinks,

  unbound_getRevealStringFromContentWarningMessage as getRevealStringFromContentWarningMessage,
  unbound_getRevealStringFromArtTags as getRevealStringFromArtTags,

  unbound_generateCoverLink as generateCoverLink,

  unbound_getThemeString as getThemeString,

  unbound_generateTrackListDividedByGroups as generateTrackListDividedByGroups,

  unbound_fancifyURL as fancifyURL,
  unbound_fancifyFlashURL as fancifyFlashURL,
  unbound_iconifyURL as iconifyURL,

  unbound_getGridHTML as getGridHTML,
  unbound_getAlbumGridHTML as getAlbumGridHTML,
  unbound_getFlashGridHTML as getFlashGridHTML,

  unbound_getCarouselHTML as getCarouselHTML,

  unbound_img as img,

  unbound_generateInfoGalleryLinks as generateInfoGalleryLinks,
  unbound_generateNavigationLinks as generateNavigationLinks,

  unbound_generateContentHeading as generateContentHeading,
  unbound_generateStickyHeadingContainer as generateStickyHeadingContainer,

  unbound_getFooterLocalizationLinks as getFooterLocalizationLinks,
}
