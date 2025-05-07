import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';


import { CommentsList, PostsWithNavigation, PostsWithNavigationAndRevision } from '@/lib/generated/gql-codegen/graphql';

const styles = (theme: ThemeType) => ({
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: theme.palette.border.normal,
    height: 0,
    position: 'relative',
    marginBottom: '16px'
  },
  dividerLabel: {
    width: 'fit-content',
    paddingLeft: 6,
    paddingRight: 6,
    background: theme.palette.background.pageActiveAreaBackground,
    ...theme.typography.subheading
  },
});

export interface DebateResponseWithReplies {
  comment: CommentsList;
  replies: CommentsList[];
}

export const DebateResponseBlock = ({ responses, post, orderedParticipantList, daySeparator, classes }: {
  responses: DebateResponseWithReplies[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  orderedParticipantList: string[],
  daySeparator?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { DebateResponse } = Components;

  return <div>
    {daySeparator && <div className={classes.divider}>
      <span className={classes.dividerLabel}>{daySeparator}</span>
    </div>}
    {responses.map(({ comment, replies }, idx) => <DebateResponse 
      key={`debateBlock${comment._id}`}
      comment={comment} 
      replies={replies} 
      idx={idx} 
      responseCount={responses.length} 
      orderedParticipantList={orderedParticipantList}
      responses={responses}
      post={post}
     />)}
  </div>;
}

const DebateResponseBlockComponent = registerComponent('DebateResponseBlock', DebateResponseBlock, {styles, stylePriority: 200});

declare global {
  interface ComponentTypes {
    DebateResponseBlock: typeof DebateResponseBlockComponent
  }
}
