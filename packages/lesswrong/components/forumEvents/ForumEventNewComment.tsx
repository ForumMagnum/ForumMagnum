import React, { useCallback, useEffect, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';

const styles = (theme: ThemeType) => ({
  popperContent: {
    marginTop: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '140%',
    padding: 16,
    maxWidth: 350,
    color: theme.palette.grey[600],
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.default,
    position: 'relative',
    width: 'max-content',
    display: 'flex',
    flexDirection: 'column',
    gap: "16px",
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
    }
  },
  title: {
    color: theme.palette.grey[1000],
    fontSize: 16,
    fontWeight: 700
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
});

const ForumEventNewComment = ({
  open,
  forumEventId,
  onClose,
  post,
  followElement,
  classes,
}: {
  open: boolean;
  forumEventId: string;
  followElement: HTMLElement | null;
  post: PostsMinimumInfo;
  onClose: () => void;
  classes: ClassesType<typeof styles>;
}) => {
  const { CommentsNewForm, LWPopper, ForumIcon } = Components;

  const [positionStyle, setPositionStyle] = useState<React.CSSProperties | null>(null);
  const { flash } = useMessages();

  const onSubmit = useCallback(() => {
    flash("Comment submitted. Go to the Debate Week post to view it.")
    onClose()
  }, [flash, onClose])

  // TODO move this whole thing into the user icon, MUST DO because currently this infinitely rerenders
  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      if (followElement) {
        const rect = followElement.getBoundingClientRect();
        const newStyle = {
          position: 'absolute' as const,
          transform: 'translateX(-50%)' as const,
          top: rect.bottom + window.scrollY,
          left: rect.left + (rect.width / 2) + window.scrollX,
        };

        setPositionStyle(newStyle);
      }
      // Note: This is pretty inefficient, but it only runs while this is open so it's not a huge deal
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    if (open) {
      updatePosition();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [followElement, open]);

  if (!open || !followElement?.isConnected) {
    return null;
  }

  return positionStyle ? (
    <LWPopper open={open} anchorEl={null} placement="bottom-start">
      <div className={classes.popperContent} style={positionStyle}>
        <div className={classes.triangle}></div>
        <ForumIcon icon="Close" className={classes.closeIcon} onClick={onClose} />
        <div className={classes.title}>What made you vote this way?</div>
        <div>
          Your response will appear as a comment on the Debate week post, and show next to your avatar on this banner.
        </div>
        <CommentsNewForm
          type="reply"
          post={post}
          enableGuidelines={false}
          cancelCallback={onClose}
          successCallback={onSubmit}
          prefilledProps={{
            forumEventId
          }}
          className={classes.commentForm}
        />
      </div>
    </LWPopper>
  ) : null;
};

const ForumEventNewCommentComponent = registerComponent(
  'ForumEventNewComment',
  ForumEventNewComment,
  { styles }
);

declare global {
  interface ComponentTypes {
    ForumEventNewComment: typeof ForumEventNewCommentComponent;
  }
}
