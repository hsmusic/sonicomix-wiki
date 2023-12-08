import {stitchArrays} from '#sugar';

export default {
  contentDependencies: ['generateContentHeading', 'linkCharacter'],
  extraDependencies: ['html', 'language'],

  relations: (relation, character) => ({
    contentHeading:
      relation('generateContentHeading'),

    containingGroupLinks:
      character.groupedUnderCharacters
        .map(({character}) => relation('linkCharacter', character)),

    groupedCharacterLinks:
      character.groupedCharacters
        .map(({character}) => relation('linkCharacter', character)),
  }),

  data: (character) => ({
    name:
      character.name,

    numGroupedCharacters:
      character.groupedCharacters.length,

    groupedCharacterAnnotations:
      character.groupedCharacters
        .map(({annotation}) => annotation),
  }),

  generate: (data, relations, {html, language}) =>
    language.encapsulate('characterPage', pageCapsule => [
      html.tag('p', {id: 'grouped-under-characters'},
        language.$(pageCapsule, 'groupedUnderCharacters', {
          [language.onlyIfOptions]: ['groups'],

          character:
            language.sanitize(data.name),

          groups:
            language.formatConjunctionList(relations.containingGroupLinks),
        })),

      language.encapsulate(pageCapsule, 'groupsCharacters', listCapsule =>
        html.tags([
          relations.contentHeading.slots({
            attributes: {id: 'groups-characters'},

            title:
              language.$(listCapsule, 'title', {
                [language.onlyIfOptions]: ['characters'],

                group:
                  language.sanitize(data.name),

                characters:
                  language.countCharacters(data.numGroupedCharacters, {
                    unit: true,
                    blankIfZero: true,
                  }),
              }),
          }),

          html.tag('ul',
            {[html.onlyIfContent]: true},

            stitchArrays({
              link: relations.groupedCharacterLinks,
              annotation: data.groupedCharacterAnnotations,
            }).map(({link, annotation}) =>
                html.tag('li',
                  language.encapsulate(listCapsule, 'item', workingCapsule => {
                    const workingOptions = {character: link};

                    if (annotation) {
                      workingCapsule += '.withAnnotation';
                      workingOptions.annotation =
                        language.sanitize(annotation);
                    }

                    return language.$(workingCapsule, workingOptions);
                  })))),
        ])),
    ]),
};
