import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import { postGetCommentCountStr, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { hasRejectedContentSectionSetting } from '../../lib/instanceSettings';
import { useDialog } from '../common/withDialog';
import { DialogContent } from '../widgets/DialogContent';

const styles = (theme: ThemeType) => ({
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    marginTop: 12,
    fontSize: "1rem",
    '& li, & h1, & h2, & h3': {
      fontSize: "1rem"
    }
  },
  meta: {
    display: 'inline-block'
  },
  vote: {
    marginRight: 10
  },
  rejectButton: {
    marginLeft: 'auto',
  },
  llmScore: {
    cursor: 'pointer',
  },
  llmScoreSentenceBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 5,
    alignItems: 'center',
  },
  llmScoreSentence: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    maxWidth: '70%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',

  },
  llmScoreSentenceScore: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    maxWidth: '20%',
  },
})

const SunshineNewUserPostsList = ({posts, user, classes}: {
  posts?: SunshinePostsList[],
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {
  const { MetaInfo, FormatDate, PostsTitle, SmallSideVote, PostActionsButton, ContentStyles, LinkPostMessage, RejectContentButton, RejectedReasonDisplay, LWDialog } = Components
  const { openDialog } = useDialog();

  function handleLLMScoreClick(automatedContentEvaluation: SunshinePostsList_contents_automatedContentEvaluations) {
    openDialog({
      name: "LLMScoreDialog",
      contents: () => (
        <LWDialog open={true}>
          <DialogContent>
            <div>
              <p>LLM Score: {automatedContentEvaluation.score}</p>
              <p>LLM Score per sentence: </p>
              {automatedContentEvaluation.sentenceScores.map(
                (
                  sentenceScore: {
                    sentence: string;
                    score: number;
                  },
                  index: number
                ) => (
                  <div key={index} className={classes.llmScoreSentenceBlock}>
                    <p className={classes.llmScoreSentence}>{sentenceScore.sentence}</p>
                    <p className={classes.llmScoreSentenceScore}>Score: {sentenceScore.score}</p>
                  </div>
                )
              )}
            </div>
          </DialogContent>
        </LWDialog>
      ),
    });
  }

 
  if (!posts) return null

  const newPosts = user.reviewedAt ? posts.filter(post => post.postedAt > user.reviewedAt!) : posts

  return (
    <div>
      {newPosts.map(post=><div className={classes.post} key={post._id}>
        <div className={classes.row}>
          <div>
            <Link to={`/posts/${post._id}`}>
              <PostsTitle post={post} showIcons={false} wrap/> 
              {(post.status !==2) && <MetaInfo>[Spam] {post.status}</MetaInfo>}
            </Link>
            <div>
              <span className={classes.meta}>
                <span className={classes.vote}>
                  <SmallSideVote document={post} collectionName="Posts"/>
                </span>
                <MetaInfo>
                  <FormatDate date={post.postedAt}/>
                </MetaInfo>
                <MetaInfo>
                  <Link to={`${postGetPageUrl(post)}#comments`}>
                    {postGetCommentCountStr(post)}
                  </Link>
                </MetaInfo>
              </span>
            </div>
          </div>
          
          {hasRejectedContentSectionSetting.get() && <span className={classes.rejectButton}>
            {post.rejected && <RejectedReasonDisplay reason={post.rejectedReason}/>}
            {post.contents?.automatedContentEvaluations && <span className={classes.llmScore} onClick={() => handleLLMScoreClick(post.contents!.automatedContentEvaluations!)}>
              LLM Score: {post.contents?.automatedContentEvaluations.score.toFixed(2)}
              </span>}
            <RejectContentButton contentWrapper={{ collectionName: 'Posts', content: post }}/>
          </span>}
          
          <PostActionsButton post={post} />
        </div>
        {!post.draft && <div className={classes.postBody}>
          <LinkPostMessage post={post}/>
          <ContentStyles contentType="postHighlight">
            <div dangerouslySetInnerHTML={{__html: (post.contents?.html || "")}} />
          </ContentStyles>
        </div>}
      </div>)}
    </div>
  )
}

const SunshineNewUserPostsListComponent = registerComponent('SunshineNewUserPostsList', SunshineNewUserPostsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUserPostsList: typeof SunshineNewUserPostsListComponent
  }
}
