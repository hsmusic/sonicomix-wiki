import {input, templateCompositeFrom} from '#composite';

import {withPropertyFromList} from '#composite/data';
import {withReverseReferenceList} from '#composite/wiki-data';

export default templateCompositeFrom({
  annotation: `withEarliestIssueDate`,

  outputs: ['#earliestIssueDate'],

  steps: () => [
    withReverseReferenceList({
      data: 'issueData',
      list: input.value('featuredStories'),
    }).outputs({
      '#reverseReferenceList': '#issues',
    }),

    withPropertyFromList({
      list: '#issues',
      property: input.value('date'),
    }),

    // TODO: Implement this step more nicely.
    {
      dependencies: ['#issues.date'],
      compute: (continuation, {
        ['#issues.date']: dates,
      }) => continuation({
        ['#earliestIssueDate']:
          dates
            .filter(Boolean)
            .sort()
            [0],
      }),
    },
  ],
});
