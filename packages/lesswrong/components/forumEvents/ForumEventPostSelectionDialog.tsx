import React, { useCallback, useMemo, useState } from "react";
import { registerComponent, Components, decodeIntlError } from "../../lib/vulcan-lib";
import { ForumEventVoteData, addForumEventVoteQuery } from "./ForumEventPoll";
import { useMutation } from "@apollo/client";
import { usePostsList } from "../posts/usePostsList";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import FormattedMessage from "@/lib/vulcan-i18n/message";
import Checkbox from "@material-ui/core/Checkbox";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";

const styles = (theme: ThemeType) => ({
  dialog: {
    color: theme.palette.grey[1000],
    fontFamily: theme.palette.fonts.sansSerifStack,
    lineHeight: '140%',
    padding: 32,
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: 24,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 16,
  },
  closeIcon: {
    fontSize: 20,
    color: theme.palette.grey[700],
    cursor: 'pointer',
    transform: 'translate(4px, -4px)',
    '&:hover': {
      color: theme.palette.grey[1000],
    }
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
  const {refetch} = useCurrentForumEvent()
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  
  const postsListProps = useMemo(() => ({
    terms: {
      filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
      view: "tagRelevance",
      tagId: tag._id,
      sortedBy: 'magic',
      limit: 50
    } as const,
    hideTag: true,
  }), [tag])
  const {loading, error, orderedResults, itemProps} = usePostsList(postsListProps)
  
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
    refetch?.()
    onClose?.()
  }, [selectedPosts, addVote, voteData, refetch, onClose])
  
  const {
    LWDialog, EAButton, PostsNoResults, EAPostsItem, PostsLoading, ForumIcon
  } = Components;
  const postsError = decodeIntlError(error)

  return (
    <LWDialog
      open
      dialogClasses={{
        paper: classes.dialog,
      }}
    >
      <h2 className={classes.title}>
        Which posts changed your mind?
        <ForumIcon icon="Close" className={classes.closeIcon} onClick={handleDone} />
      </h2>
      <div className={classes.description}>
        Selecting a post in this list will assign it points for changing your mind.
        We use these points to rank debate week posts in order of influence.
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
                  checked={selectedPosts.includes(props.post._id)}
                  onChange={(event, checked) => {
                    if (checked) {
                      setSelectedPosts(prev => [...prev, props.post._id])
                    } else {
                      setSelectedPosts(prev => prev.filter(p => p !== props.post._id))
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
          I changed my mind for other reasons
        </button>
        <EAButton onClick={(e) => handleDone(e, true)} className={classes.doneButton}>
          Done
        </EAButton>
      </div>
    </LWDialog>
  );
};

const ForumEventPostSelectionDialogComponent = registerComponent(
  "ForumEventPostSelectionDialog",
  ForumEventPostSelectionDialog,
  {styles}
);

declare global {
  interface ComponentTypes {
    ForumEventPostSelectionDialog: typeof ForumEventPostSelectionDialogComponent;
  }
}
