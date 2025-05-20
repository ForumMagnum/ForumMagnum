import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import { postGetCommentCountStr, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { hasRejectedContentSectionSetting } from '../../lib/instanceSettings';
import { useDialog } from '../common/withDialog';
import { DialogContent } from '../widgets/DialogContent';
import { highlightHtmlWithLlmDetectionScores } from './helpers';
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import PostsTitle from "../posts/PostsTitle";
import SmallSideVote from "../votes/SmallSideVote";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import ContentStyles from "../common/ContentStyles";
import LinkPostMessage from "../posts/LinkPostMessage";
import RejectContentButton from "./RejectContentButton";
import RejectedReasonDisplay from "./RejectedReasonDisplay";
import LWDialog from "../common/LWDialog";

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
  automatedContentEvaluations: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'flex-end',
  },
  aiOutput: {
    fontSize: '0.9em',
    textWrap: 'pretty',
  },
})


const SunshineNewUserPostsList = ({posts, user, classes}: {
  posts?: SunshinePostsList[],
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList
}) => {
  const { openDialog } = useDialog();

  function handleLLMScoreClick(
    automatedContentEvaluation: NonNullable<NonNullable<SunshinePostsList['contents']>['automatedContentEvaluations']>,
    htmlContent: string | null | undefined
  ) {
    const highlightedHtml = highlightHtmlWithLlmDetectionScores(
      htmlContent || "",
      automatedContentEvaluation.sentenceScores || []
    );

    openDialog({
      name: "LLMScoreDialog",
      contents: ({onClose}) => (
        <LWDialog open={true} onClose={onClose}>
          <DialogContent>
            <div>
              <p>LLM Score: {automatedContentEvaluation.score}</p>
              <p>Post with highlighted sentences:</p>
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            </div>
          </DialogContent>
        </LWDialog>
      ),
    });
  }

  function handleAiJudgementClick(automatedContentEvaluations: NonNullable<NonNullable<SunshinePostsList['contents']>['automatedContentEvaluations']>) {
    openDialog({
      name: "AiJudgementDialog",
      contents: ({onClose}) => (
        <LWDialog open={true} onClose={onClose}>
          <DialogContent>
            <p><strong>AI Choice:</strong> {automatedContentEvaluations.aiChoice}</p>
            <p><strong>AI Reasoning:</strong></p>
            <pre className={classes.aiOutput}>{automatedContentEvaluations.aiReasoning}</pre>
            <p><strong>AI CoT:</strong></p>
            <pre className={classes.aiOutput}>{automatedContentEvaluations.aiCoT}</pre>
          </DialogContent>
        </LWDialog>
      ),
    });
  }

  if (!posts) return null

  const newPosts = user.reviewedAt ? posts.filter(post => post.postedAt > user.reviewedAt!) : posts

  return (
    <div>
      {newPosts.map(post => {
        const automatedContentEvaluations = post.contents?.automatedContentEvaluations
        return <div className={classes.post} key={post._id}>
          <div className={classes.row}>
            <div>
              <Link to={`/posts/${post._id}`}>
                <PostsTitle post={post} showIcons={false} wrap />
                {(post.status !== 2) && <MetaInfo>[Spam] {post.status}</MetaInfo>}
              </Link>
              <div>
                <span className={classes.meta}>
                  <span className={classes.vote}>
                    <SmallSideVote document={post} collectionName="Posts" />
                  </span>
                  <MetaInfo>
                    <FormatDate date={post.postedAt} />
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
              {post.rejected && <RejectedReasonDisplay reason={post.rejectedReason} />}
              {automatedContentEvaluations && (
                <div className={classes.automatedContentEvaluations}>
                  <span
                    className={classes.llmScore}
                    onClick={() => handleLLMScoreClick(
                      automatedContentEvaluations,
                      post.contents!.html
                    )}
                  >
                    <strong>LLM Score:</strong> {automatedContentEvaluations.score.toFixed(2)}
                  </span>
                  <span
                    className={classes.llmScore}
                    onClick={() => handleAiJudgementClick(automatedContentEvaluations)}
                  >
                    <strong>AI judgement:</strong> {automatedContentEvaluations.aiChoice}
                  </span>
                </div>
              )}
              <RejectContentButton contentWrapper={{ collectionName: 'Posts', content: post }} />
            </span>}

            <PostActionsButton post={post} />
          </div>
          {!post.draft && <div className={classes.postBody}>
            <LinkPostMessage post={post} />
            <ContentStyles contentType="postHighlight">
              <div dangerouslySetInnerHTML={{ __html: (post.contents?.html || "") }} />
            </ContentStyles>
          </div>}
        </div>
      })}
    </div>
  )
}

export default registerComponent('SunshineNewUserPostsList', SunshineNewUserPostsList, {styles});


