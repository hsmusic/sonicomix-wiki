import {empty, stitchArrays} from '#sugar';
import {sortChronologically} from '#wiki-data';

export default {
  contentDependencies: [
    'generateArtistInfoPageChunk',
    'generateArtistInfoPageChunkedList',
    'generateArtistInfoPageChunkItem',
    'linkIssue',
    'linkStory',
  ],

  extraDependencies: ['language'],

  query(artist) {
    const chunks = [];

    const storyToRecord = new Map();

    const getStoryRecord = story => {
      odear;

      if (storyToRecord.has(story)) {
        return storyToRecord.get(story);
      }

      const record = {
        kind: {
          story: false,
          art: false,
        },

        annotations: {
          story: [],
          art: [],
        },
      };

      storyToRecord.set(story, record);

      return record;
    };

    const processContribs = (record, contribs, kind) => {
      for (const contrib of contribs) {
        if (contrib.who !== artist) {
          continue;
        }

        record.kind[kind] = true;

        if (contrib.what) {
          record.annotations[kind].push(contrib.what);
        }
      }
    };

    const processStories = (stories, contribSpec) => {
      for (const story of stories) {
        const record = getStoryRecord(story);
        for (const [key, kind] of contribSpec) {
          processContribs(record, story[key], kind);
        }
      }
    };

    processStories(artist.storiesAsWriter, [
      ['storyContribs', 'story'],
    ]);

    processStories(artist.storiesAsArtist, [
      ['artContribs', 'art'],
    ]);

    const issues = new Set();
    const storyToFirstIssue = new Map();

    for (const story of storyToRecord.keys()) {
      storyToFirstIssue.set(
        story,
        sortChronologically(story.featuredInIssues.slice())[0]);

      for (const issue of story.featuredInIssues) {
        issues.add(issue);
      }
    }

    for (const issue of sortChronologically(Array.from(issues))) {
      // Retains order from issue's featuredStories.
      const stories =
        issue.featuredStories
          .filter(story => storyToRecord.has(story));

      chunks.push({
        issue,
        date: issue.date,
        chunk:
          stories
            .map(story => [story, storyToRecord.get(story)])
            .map(([story, record]) => ({
              story,
              kind: record.kind,
              annotations: record.annotations,
              reissue: issue !== storyToFirstIssue.get(story),
            })),
      });
    }

    return {chunks};
  },

  relations: (relation, query) => ({
    chunkedList:
      relation('generateArtistInfoPageChunkedList'),

    chunks:
      query.chunks
        .map(() => relation('generateArtistInfoPageChunk')),

    issueLinks:
      query.chunks
        .map(({issue}) => relation('linkIssue', issue)),

    items:
      query.chunks
        .map(({chunk}) => chunk
          .map(() => relation('generateArtistInfoPageChunkItem'))),

    storyLinks:
      query.chunks
        .map(({chunk}) => chunk
          .map(({story}) => relation('linkStory', story))),
  }),

  data: (query) => ({
    chunkDates:
      query.chunks
        .map(({date}) => date),

    storyReissues:
      query.chunks
        .map(({chunk}) => chunk
          .map(({reissue}) => reissue)),

    storyContributionKinds:
      query.chunks
        .map(({chunk}) => chunk
          .map(({kind}) => kind)),

    storyContributionAnnotations:
      query.chunks
        .map(({chunk}) => chunk
          .map(({annotations}) => annotations)),
  }),

  generate: (data, relations, {language}) =>
    relations.chunkedList.slots({
      chunks:
        stitchArrays({
          chunk: relations.chunks,
          issueLink: relations.issueLinks,
          date: data.chunkDates,

          items: relations.items,
          storyLinks: relations.storyLinks,
          storyContributionKinds: data.storyContributionKinds,
          storyContributionAnnotations: data.storyContributionAnnotations,
          storyReissues: data.storyReissues,
        }).map(({
            chunk,
            issueLink,
            date,

            items,
            storyLinks,
            storyContributionKinds,
            storyContributionAnnotations,
            storyReissues,
          }) =>
            chunk.slots({
              mode: 'issue',
              issueLink,
              date,

              items:
                stitchArrays({
                  item: items,
                  storyLink: storyLinks,

                  contributionKind: storyContributionKinds,
                  contributionAnnotations: storyContributionAnnotations,
                  reissue: storyReissues,
                }).map(({
                    item,
                    storyLink,
                    contributionKind,
                    contributionAnnotations,
                    reissue,
                  }) =>
                    item.slots({
                      reissue,

                      contribution:
                        language.formatUnitList([
                          (contributionKind.story
                            ? (empty(contributionAnnotations.story)
                                ? language.$('artistPage.creditList.entry.story.story')
                                : contributionAnnotations.story)
                            : []),

                          (contributionKind.art
                            ? (empty(contributionAnnotations.art)
                                ? language.$('artistPage.creditList.entry.story.art')
                                : contributionAnnotations.art)
                            : []),
                        ].flat(Infinity)),

                      content:
                        language.$('artistPage.creditList.entry.story', {
                          story: storyLink,
                        }),
                    }))
            }))
    }),
};
