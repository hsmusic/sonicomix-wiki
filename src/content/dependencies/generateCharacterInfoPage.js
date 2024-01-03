import {empty, stitchArrays} from '#sugar';

export default {
  contentDependencies: [
    'generateContentHeading',
    'generatePageLayout',
    'linkStory',
  ],

  extraDependencies: ['html', 'language'],

  relations(relation, character) {
    const relations = {};
    const sec = relations.sections = {};

    relations.layout =
      relation('generatePageLayout');

    if (!empty(character.featuredInStories)) {
      sec.featuredInStories = {};

      sec.featuredInStories.heading =
        relation('generateContentHeading');

      sec.featuredInStories.storyLinks =
        character.featuredInStories
          .map(({story}) => relation('linkStory', story));
    }

    return relations;
  },

  data(character) {
    const data = {};

    data.name =
      character.name;

    data.color =
      character.color;

    data.numStories =
      character.featuredInStories.length;

    data.featuredInStoryHows =
      character.featuredInStories
        .map(({how}) => how);

    return data;
  },

  generate(data, relations, {html, language}) {
    const sec = relations.sections;

    return relations.layout.slots({
      title: language.$('characterPage.title', {character: data.name}),
      headingMode: 'sticky',
      color: data.color,

      cover: relations.artworkGallery ?? null,

      mainContent: [
        sec.featuredInStories && [
          sec.featuredInStories.heading.slots({
            id: 'featured-in-stories',
            title:
              language.$('characterPage.featuredInStories.title', {
                character:
                  language.sanitize(data.name),
                stories:
                  language.countStories(data.numStories, {unit: true}),
              }),
          }),

          html.tag('ul',
            stitchArrays({
              storyLink: sec.featuredInStories.storyLinks,
              hows: data.featuredInStoryHows,
            }).map(({storyLink, hows}) => {
                const parts = ['characterPage.featuredInStories.item'];
                const options = {story: storyLink};

                if (!empty(hows)) {
                  parts.push('withHow');
                  options.how = language.formatUnitList(hows);
                }

                return html.tag('li', language.$(...parts, options));
              })),
        ],
      ],

      navLinkStyle: 'hierarchical',
      navLinks: [
        {auto: 'home'},
        {auto: 'current'},
      ],
    });
  },
};
