import React, { useCallback, useState } from "react";
import { registerComponent, Components, decodeIntlError } from "../../lib/vulcan-lib";
import { addForumEventVoteQuery } from "./ForumEventPoll";
import { useMutation } from "@apollo/client";
import { usePostsList } from "../posts/usePostsList";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import FormattedMessage from "@/lib/vulcan-i18n/message";
import Checkbox from "@material-ui/core/Checkbox";

const styles = (theme: ThemeType) => ({
  dialog: {
    color: theme.palette.grey[1000],
    fontFamily: theme.palette.fonts.sansSerifStack,
    lineHeight: '140%',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: '21px',
    fontWeight: 500,
    marginBottom: 26,
  },
  postsSection: {
    overflowY: 'scroll',
  },
  buttons: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    columnGap: '16px',
    marginTop: 24,
  },
  somethingElseButton: {
    background: 'none',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    color: theme.palette.primary.main,
    padding: 0,
    '&:hover': {
      color: theme.palette.primary.dark,
    }
  },
  doneButton: {
    minWidth: 110,
    padding: '12px 20px',
  },
});

type ForumEventVoteData = {
  forumEventId: string,
  x: number,
  delta: number,
  postIds?: string[]
}

/**
 * Modal that handles post selection before submitting a vote for a forum event with a poll.
 * Built for the EA Forum, so if others want to use it you will want to audit the code first.
 */
const ForumEventPostSelectionDialog = ({ tag, voteData, onClose, classes }: {
  tag: TagBasicInfo,
  voteData: ForumEventVoteData,
  onClose?: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  
  const {
    loading,
    error,
    orderedResults,
    itemProps,
  } = usePostsList({
    terms: {
      filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
      view: "tagRelevance",
      tagId: tag._id,
      sortedBy: 'magic',
      limit: 50
    },
    hideTag: true,
  });
  
  const [addVote] = useMutation(
    addForumEventVoteQuery,
    {errorPolicy: "all"},
  )
  
  /**
   * Save the user's vote whenever they close the modal,
   * and include the selected posts if they clicked the "Done" button
   */
  const handleDone = useCallback((e: React.MouseEvent, includePosts=false) => {
    void addVote({variables: {
      ...voteData,
      postIds: includePosts ? selectedPosts : []
    }})
    onClose?.()
  }, [selectedPosts, onClose])
  
  const { LWDialog, EAButton, PostsNoResults, EAPostsItem, PostsLoading } = Components;
  
  const postsError = decodeIntlError(error)

  return (
    <LWDialog
      open
      onClose={handleDone}
      dialogClasses={{
        paper: classes.dialog,
      }}
    >
      <h2 className={classes.title}>
        Which posts changed your mind?
      </h2>
      <div className={classes.description}>
        When you change your vote, we turn the distance into points.
        Each post you select gets full credit for this change.
        We add up everyone's points to get a list of the most influential posts.
      </div>
      <div className={classes.postsSection}>
        {/* Adapted from PostsList2 */}
        {error && <>
          <FormattedMessage id={postsError.id} values={{value: postsError.value}}/>{postsError.message}
        </>}
        {!orderedResults && loading && <PostsLoading placeholderCount={7} viewType="list" />}
        {orderedResults && !orderedResults.length && <PostsNoResults />}
        <AnalyticsContext viewType="list">
          {itemProps?.map((props) => <EAPostsItem
            key={props.post._id}
            {...props}
            openInNewTab
            secondaryInfoNode={
              <div>
                <Checkbox
                  onChange={(event, checked) => {
                    if (checked) {
                      selectedPosts.push(props.post._id)
                      setSelectedPosts(selectedPosts)
                    } else {
                      setSelectedPosts(selectedPosts.filter(p => p !== props.post._id))
                    }
                  }}
                />
              </div>
            }
          />)}
        </AnalyticsContext>
      </div>
      <div className={classes.buttons}>
        <button onClick={handleDone} className={classes.somethingElseButton}>
          Something else changed my mind
        </button>
        <EAButton onClick={(e) => handleDone(e, true)} className={classes.doneButton}>
          Done
        </EAButton>
      </div>
    </LWDialog>
  );
};

const ForumEventPostSelectionDialogComponent = registerComponent("ForumEventPostSelectionDialog", ForumEventPostSelectionDialog, {
  styles,
});

declare global {
  interface ComponentTypes {
    ForumEventPostSelectionDialog: typeof ForumEventPostSelectionDialogComponent;
  }
}
