import React, { useCallback, useEffect, useRef, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { State } from '@popperjs/core/lib/types';
import { useIsAboveScreenWidth } from '../hooks/useScreenWidth';
import { POLL_MAX_WIDTH } from './ForumEventPoll';

const WIDTH = 350;

const styles = (theme: ThemeType) => ({
  popperContent: {
    margin: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '140%',
    padding: 16,
    maxWidth: WIDTH,
    color: theme.palette.grey[600],
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.default,
    position: 'relative',
    width: 'max-content',
    display: 'flex',
    flexDirection: 'column',
    gap: "12px",
    boxShadow: theme.palette.boxShadow.eaCard,
  },
  closeIcon: {
    position: "absolute",
    right: 8,
    top: 8,
    cursor: "pointer",
    width: "20px",
    height: "20px"
  },
  commentForm: {
    padding: 0,
    '& .EditorFormComponent-root': {
      border: `1px solid ${theme.palette.grey[400]}`,
      borderRadius: theme.borderRadius.default,
      minHeight: 190
    },
    '& .EditorFormComponent-editor': {
      padding: 12
    },
    '& .CommentsNewForm-form': {
      padding: 0
    },
    '& .form-input': {
      marginTop: 0
    },
    '& .form-submit': {
      margin: 0
    }
  },
  header: {
    '& a': {
      textDecoration: 'underline',
      textUnderlineOffset: '3px',
      '&:hover': {
        textDecoration: 'underline',
      }
    }
  },
  title: {
    color: theme.palette.grey[1000],
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12
  },
  triangle: {
    position: 'absolute',
    top: -5,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: `5px solid ${theme.palette.background.paper}`,
  },
  editButton: {
    color: theme.palette.primary.main,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    width: "fit-content",
    marginLeft: "auto",
    '&:hover': {
      opacity: 0.7
    }
  }
});

const ForumEventCommentForm = ({
  open,
  comment,
  forumEventId,
  post,
  refetch,
  onClose,
  anchorEl,
  title,
  subtitle,
  successMessage="Comment posted successfully",
  classes,
}: {
  open: boolean;
  comment: ShortformComments | null;
  forumEventId: string;
  anchorEl: HTMLElement | null;
  post: PostsMinimumInfo;
  onClose: () => void;
  refetch: () => Promise<void>;
  title: ((post: PostsMinimumInfo, comment: ShortformComments | null) => React.ReactNode) | React.ReactNode;
  subtitle: ((post: PostsMinimumInfo, comment: ShortformComments | null) => React.ReactNode) | React.ReactNode;
  successMessage?: string;
  classes: ClassesType<typeof styles>;
}) => {
  const { CommentsNewForm, LWPopper, ForumIcon, CommentsEditForm, CommentBody } = Components;

  const isDesktop = useIsAboveScreenWidth(POLL_MAX_WIDTH);

  const [editFormOpen, setEditFormOpen] = useState(false);
  const { flash } = useMessages();
  const updatePopperRef = useRef<(() => Promise<Partial<State>>) | undefined>(undefined);

  const onSubmit = useCallback(async () => {
    flash(successMessage)
    await refetch();
    onClose();
  }, [flash, onClose, refetch, successMessage])

  useEffect(() => {
    const updatePopperPos = () => {
      void updatePopperRef.current?.();
    };

    // Backup to prevent it from sticking in the wrong place forever
    const intervalId = setInterval(() => {
      updatePopperPos();
    }, 1000);

    document.addEventListener('pointerup', updatePopperPos);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('pointerup', updatePopperPos);
    };
  }, []);

  if (!open || !anchorEl?.isConnected || !isDesktop) {
    return null;
  }

  const debateWeekLink = comment ? commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id}) : postGetPageUrl(post)

  return (
    <LWPopper open={open} anchorEl={anchorEl} placement="bottom" allowOverflow={false} updateRef={updatePopperRef}>
      <div className={classes.popperContent}>
        <div className={classes.triangle}></div>
        <ForumIcon icon="Close" className={classes.closeIcon} onClick={onClose} />
        <div className={classes.header}>
          <div className={classes.title}>{typeof title === 'function' ? title(post, comment) : title}</div>
          {typeof subtitle === 'function' ? subtitle(post, comment) : subtitle}
        </div>
        {!comment && !editFormOpen && (
          <CommentsNewForm
            type="reply"
            post={post}
            enableGuidelines={false}
            cancelCallback={() => onClose()}
            successCallback={onSubmit}
            prefilledProps={{
              forumEventId,
            }}
            className={classes.commentForm}
          />
        )}
        {comment && !editFormOpen && (
          <>
            <CommentBody comment={comment} />
            <div className={classes.editButton} onClick={() => setEditFormOpen(true)}>
              Edit comment
            </div>
          </>
        )}
        {comment && editFormOpen && (
          <CommentsEditForm
            comment={comment}
            cancelCallback={() => setEditFormOpen(false)}
            successCallback={async () => {
              await refetch();
              setEditFormOpen(false);
            }}
            className={classes.commentForm}
          />
        )}
      </div>
    </LWPopper>
  );
};

const ForumEventCommentFormComponent = registerComponent(
  'ForumEventCommentForm',
  ForumEventCommentForm,
  { styles, stylePriority: 1 }
);

declare global {
  interface ComponentTypes {
    ForumEventCommentForm: typeof ForumEventCommentFormComponent;
  }
}
