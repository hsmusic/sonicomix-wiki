export default {
  contentDependencies: [
    'generateCharacterInfoPageFeaturedInStoriesSection',
    'generateCharacterInfoPageGroupSection',
    'generatePageLayout',
  ],

  extraDependencies: ['html', 'language'],

  relations: (relation, character) => ({
    layout:
      relation('generatePageLayout'),

    groupSection:
      relation('generateCharacterInfoPageGroupSection', character),

    featuredInStoriesSection:
      relation('generateCharacterInfoPageFeaturedInStoriesSection', character),
  }),

  data: (character) => ({
    name:
      character.name,

    color:
      character.color,
  }),

  generate: (data, relations, {language}) =>
    language.encapsulate('characterPage', pageCapsule =>
      relations.layout.slots({
        title: language.$(pageCapsule, 'title', {character: data.name}),
        headingMode: 'sticky',
        color: data.color,

        cover: relations.artworkGallery ?? null,

        mainContent: [
          relations.groupSection,
          relations.featuredInStoriesSection,
        ],

        navLinkStyle: 'hierarchical',
        navLinks: [
          {auto: 'home'},
          {auto: 'current'},
        ],
      })),
};
