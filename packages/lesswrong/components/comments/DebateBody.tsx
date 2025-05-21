import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq'
import moment from 'moment';
import DebateResponseBlock, { DebateResponseWithReplies } from './DebateResponseBlock';
import DeferRender from '../common/DeferRender';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import DebateTypingIndicator from "./DebateTypingIndicator";

const styles = (theme: ThemeType) => ({
  root: {

  },
});

export const DebateBody = ({ debateResponses, post, classes }: {
  debateResponses: DebateResponseWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  classes: ClassesType<typeof styles>,
}) => {
  const orderedParticipantList = filterNonnull(uniq(debateResponses.map(({ comment }) => comment.userId)));

  return (<DeferRender ssr={false}>
    <div className={classes.root}>
      {
        // First group all responses by day, for the client's timezone (which is why this is in a NoSSR block)
        Object.entries(groupBy(debateResponses, ({ comment }) => moment(comment.postedAt).format('MMM DD, YYYY')))
        // Then sort them by day, descending, since we're reading the debate in order
        .sort(([firstDate], [secondDate]) => moment(firstDate).diff(secondDate))
        // Now, we're going to create blocks of sequential-responses-by-author
        .flatMap(([daySeparator, perDayDebateResponses], dayIdx) => {
          const debateResponseBlocks: DebateResponseWithReplies[][] = [];
          let lastAuthorId: string | null;

          perDayDebateResponses.sort((c1, c2) => moment(c1.comment.postedAt).diff(c2.comment.postedAt)).forEach((debateResponse) => {
            const currentAuthorId = debateResponse.comment.userId;
            if (currentAuthorId === lastAuthorId) {
              const authorBlock = debateResponseBlocks.pop() ?? [];
              authorBlock.push(debateResponse);
              debateResponseBlocks.push(authorBlock);
            } else {
              lastAuthorId = currentAuthorId;
              const authorBlock = [debateResponse];
              debateResponseBlocks.push(authorBlock);
            }
          });

          return debateResponseBlocks.map((debateResponseBlock, blockIdx) => {
            // We only want to show the day separator above the first response in the block
            const showDaySeparator = blockIdx === 0;
            const daySeparatorAttribute = showDaySeparator ? { daySeparator } : {};
            return <DebateResponseBlock
              key={`debate-comment-block-${dayIdx}-${blockIdx}`}
              responses={debateResponseBlock}
              post={post}
              orderedParticipantList={orderedParticipantList}
              { ...daySeparatorAttribute }
            />;
          });
        })
      }
    </div>
    <div>
      <DebateTypingIndicator post={post} />
    </div>
  </DeferRender>);
}

export default registerComponent('DebateBody', DebateBody, {styles});


