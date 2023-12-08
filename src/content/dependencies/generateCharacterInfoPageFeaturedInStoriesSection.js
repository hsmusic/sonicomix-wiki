import {chunkByProperties, empty, stitchArrays} from '#sugar';

export default {
  contentDependencies: ['generateContentHeading', 'linkStory'],
  extraDependencies: ['html', 'language'],

  query(character) {
    const query = {};

    // If a character is featured in a story with multiple featuring types,
    // then those are separate entries. We're going to present them together
    // as a single item in content, so combine like-stories and track the
    // annotations as independent items.

    const chunks =
      chunkByProperties(character.featuredInStories, ['story']);

    query.stories =
      chunks.map(({story}) => story);

    query.howFeatured =
      chunks.map(({chunk}) =>
        chunk.flatMap(({how}) =>
          how ? [how] : []));

    return query;
  },

  relations: (relation, query, _character) => ({
    contentHeading:
      relation('generateContentHeading'),

    storyLinks:
      query.stories
        .map(story => relation('linkStory', story)),
  }),

  data: (query, character) => ({
    shortName:
      character.shortName,

    // Count the number of stories we're presenting the character as
    // featured in, which is less than the number of times they're featured,
    // if some features are to the same story.
    numStories:
      query.stories.length,

    howFeatured:
      query.howFeatured,
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('characterPage', pageCapsule =>
      html.tags([
        relations.contentHeading.clone()
          .slots({
            attributes: {id: 'featured-in-stories'},

            title:
              language.$(pageCapsule, 'featuredInStories.title', {
                character:
                  language.sanitize(data.shortName),

                stories:
                  language.countStories(data.numStories, {unit: true}),
              }),
          }),

        html.tag('ul',
          {[html.onlyIfContent]: true},

          stitchArrays({
            storyLink: relations.storyLinks,
            howFeatured: data.howFeatured,
          }).map(({storyLink, howFeatured}) =>
              html.tag('li',
                language.encapsulate(pageCapsule, 'featuredInStories.item', workingCapsule => {
                  const workingOptions = {story: storyLink};

                  if (!empty(howFeatured)) {
                    workingCapsule += '.withHow';
                    workingOptions.how =
                      language.formatUnitList(howFeatured);
                  }

                  return language.$(workingCapsule, workingOptions);
                })))),
      ])),
};
