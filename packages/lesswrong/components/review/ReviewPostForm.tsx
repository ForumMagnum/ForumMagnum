import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  guidelines: {
    cursor: "default",
    marginTop: theme.spacing.unit,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    fontSize: "1rem",
    marginBottom: theme.spacing.unit,
    '& ul': {
      marginTop: 5,
      marginBottom: 5,
      paddingInlineStart: "30px"
    },
    '& li': {
      marginTop: 5,
      marginBottom: 5
    },
  },
  hidePrompt: {
    position: "absolute",
    right: 14,
    bottom: 14
  },
  moderatorsNote: {
    fontStyle: "italic",
    marginTop: theme.spacing.unit,
  }
})

const ReviewPostForm = ({classes, post, onClose}: {
  classes: ClassesType,
  post: PostsBase,
  onClose: () => void,
}) => {
  const { PopupCommentEditor, SingleLineComment } = Components;
  const currentUser = useCurrentUser();
  const [ showPrompt, setShowPrompt ] = useState(true)
  const [commentContent, setCommentContent] = useState<AnyBecauseHard>({
    _id: 'new',
    postId: post._id,
    contents: {
      html: '',
      _id: 'new',
      plaintextMainText: '',
      wordCount: 0,
    },
    user: currentUser,
    postedAt: new Date(),
    baseScore: 0,
    deleted: false,
    tagId: "fake",
    tag: null,
    relevantTagIds: [],
    af: false,
  });

  const handleFormChange = (formState: any) => {
    console.log('Form changed:', formState);
    setCommentContent((prevContent: any) => { console.log('prevContent', prevContent); return {
      ...prevContent,
      contents: {
        ...prevContent.contents,
        plaintextMainText: formState.data.content,
      },
    }});
  };

  return <PopupCommentEditor
    title={<>
      Reviewing "<Link to={postGetPageUrl(post)}>{post.title}</Link>"
    </>}
    guidelines={<div className={classes.guidelines}>
      {showPrompt && <div>
        Reviews should provide information that help evaluate a post 
        <ul>
          <li>What does this post add to the conversation?</li>
          <li>How did this post affect you, your thinking, and your actions?</li>
          <li>Does it make accurate claims? Does it carve reality at the joints? How do you know?</li>
          <li>Is there a subclaim of this post that you can test?</li>
          <li>What followup work would you like to see building on this post?</li>
        </ul>
        <div className={classes.moderatorsNote}>Moderators may promote comprehensive reviews to top-level posts.</div>
        <a className={classes.hidePrompt} onClick={() => setShowPrompt(false)}>(click to hide)</a>
      </div>}
      {!showPrompt && <div onClick={() => setShowPrompt(true)}>Reviews should ideally answer... <a onClick={() => setShowPrompt(false)}>(read more)</a></div>}
      <SingleLineComment
        comment={commentContent as AnyBecauseHard}
        treeOptions={{
          forceSingleLine: true,
          hideSingleLineMeta: true,
          // Add other options as needed
        }}
        nestingLevel={0}
      />
    </div>}
    onClose={onClose}
    commentFormProps={{
      post: post,
      removeFields: ['af'],
      prefilledProps: {
        reviewingForReview: REVIEW_YEAR.toString()
      }
    }}
    changeCallback={handleFormChange}
  />
}

const ReviewPostFormComponent = registerComponent('ReviewPostForm', ReviewPostForm, {styles});

declare global {
  interface ComponentTypes {
    ReviewPostForm: typeof ReviewPostFormComponent
  }
}
