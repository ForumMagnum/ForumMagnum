import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import NoSSR from 'react-no-ssr';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq'
import moment from 'moment';
import type { DebateResponseWithReplies } from './DebateResponseBlock';
import {isDialogueParticipant} from '../posts/PostsPage/PostsPage';
import {useCurrentUser} from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  },
});

export const DebateBody = ({ debateResponses, post, classes, chatCommentId }: {
  debateResponses: DebateResponseWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  chatCommentId?: string,
  classes: ClassesType,
}) => {
  const { DebateResponseBlock, DebateTypingIndicator } = Components;
  const orderedParticipantList = uniq(debateResponses.map(({ comment }) => comment.userId));
  const { CommentsNewForm } = Components
  const currentUser = useCurrentUser()
  
  return (<NoSSR>
    <div className={classes.root}>
      {
        // First group all responses by day, for the client's timezone (which is why this is in a NoSSR block)
        Object.entries(groupBy(debateResponses, ({ comment }) => moment(comment.postedAt).format('MMM DD, YYYY')))
        // Then sort them by day, descending, since we're reading the debate in order
        .sort(([firstDate], [secondDate]) => moment(firstDate).diff(secondDate))
        // Now, we're going to create blocks of sequential-responses-by-author
        .flatMap(([daySeparator, perDayDebateResponses], dayIdx) => {
          const debateResponseBlocks: DebateResponseWithReplies[][] = [];
          let lastAuthorId: string;

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
    <CommentsNewForm
      post={post}
      // replyFormStyle='minimalist'
      enableGuidelines={false}
      formProps={{post, fields:['body']}}
      prefilledProps={{
        debateResponse: true ,
        title: chatCommentId // TODO: figure out what to do here instead of title.... 
      }}
      type="comment"
    />
  </NoSSR>);
}

const DebateBodyComponent = registerComponent('DebateBody', DebateBody, {styles});

declare global {
  interface ComponentTypes {
    DebateBody: typeof DebateBodyComponent
  }
}
