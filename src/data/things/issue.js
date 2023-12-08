import {input} from '#composite';
import find from '#find';

import {
  artworkList,
  directory,
  name,
  referenceList,
  simpleDate,
  singleReference,
  simpleString,
  wikiData,
} from '#composite/wiki-properties';

import Thing from './thing.js';

export class Issue extends Thing {
  static [Thing.referenceType] = 'issue';

  static [Thing.getPropertyDescriptors] = ({
    Artist,
    Publisher,
    Story,
  }) => ({
    name: name('Unnamed Issue'),
    directory: directory(),
    date: simpleDate(),

    blurb: simpleString(),

    publisher: singleReference({
      class: input.value(Publisher),
      find: input.value(find.publisher),
      data: 'publisherData',
    }),

    coverArtworks: artworkList({
      directoryPrefix: input.value('cover-'),
    }),

    featuredStories: referenceList({
      class: input.value(Story),
      find: input.value(find.story),
      data: 'storyData',
    }),

    artistData: wikiData({
      class: input.value(Artist),
    }),

    publisherData: wikiData({
      class: input.value(Publisher),
    }),

    storyData: wikiData({
      class: input.value(Story),
    }),
  });
}
