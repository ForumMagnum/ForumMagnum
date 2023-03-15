import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import NoSSR from 'react-no-ssr';
import { DebateCommentWithReplies } from './DebateCommentBlock';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq'
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  },
});

export const DebateBody = ({ debateComments, post, classes }: {
  debateComments: DebateCommentWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  classes: ClassesType,
}) => {
  const { DebateCommentBlock } = Components;
  const orderedParticipantList = uniq(debateComments.map(({ comment }) => comment.userId));

  return (<NoSSR>
    <div className={classes.root}>
      {
        Object.entries(groupBy(debateComments, ({ comment }) => moment(comment.postedAt).format('MMM DD, YYYY')))
        .sort(([firstDate], [secondDate]) => moment(firstDate).diff(secondDate))
        .flatMap(([daySeparator, perDayDebateComments]) => {
          const debateCommentBlocks: DebateCommentWithReplies[][] = [];
          let lastAuthorId: string;

          perDayDebateComments.sort((c1, c2) => moment(c1.comment.postedAt).diff(c2.comment.postedAt)).forEach((debateComment) => {
            const currentAuthorId = debateComment.comment.userId;
            if (currentAuthorId === lastAuthorId) {
              const authorBlock = debateCommentBlocks.pop() ?? [];
              authorBlock.push(debateComment);
              debateCommentBlocks.push(authorBlock);
            } else {
              lastAuthorId = currentAuthorId;
              const authorBlock = [debateComment];
              debateCommentBlocks.push(authorBlock);
            }
          });

          return debateCommentBlocks.map((debateCommentBlock, blockIdx) => {
            const showDaySeparator = blockIdx === 0;
            const daySeparatorAttribute = showDaySeparator ? { daySeparator } : {};
            return <DebateCommentBlock
              comments={debateCommentBlock}
              post={post}
              orderedParticipantList={orderedParticipantList}
              { ...daySeparatorAttribute }
            />;
          });
        })
      }
    </div>
  </NoSSR>);
}

const DebateBodyComponent = registerComponent('DebateBody', DebateBody, {styles});

declare global {
  interface ComponentTypes {
    DebateBody: typeof DebateBodyComponent
  }
}

