import React from 'react';
import { MenuItemLink } from '@/components/common/Menus';
import { Typography } from '@/components/common/Typography';
import { useCurrentUser } from '@/components/common/withUser';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { TagCommentType } from '@/lib/collections/comments/types';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { tagGetHistoryUrl } from '@/lib/collections/tags/helpers';
import { Link } from '@/lib/reactRouterWrapper';
import { getKarmaNotificationTimingChoices } from '../KarmaChangeNotifierSettings';
import { NewReactions } from './NewReactions';
import { ColoredNumber } from './ColoredNumber';

export const styles = defineStyles("KarmaChangesDisplay", (theme: ThemeType) => ({
  title: {
    display: 'block',
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8
  },
  votedItems: {},
  votedItemRow: {
    height: 20
  },
  votedItemScoreChange: {
    display: "inline-block",
    minWidth: 20,
    textAlign: "right",
  },
  votedItemDescription: {
    display: "inline-block",
    marginLeft: 5,
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 250,
    textOverflow: "ellipsis"
  },
  settings: {
    display: 'block',
    textAlign: 'right',
    paddingTop: 8,
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[500]
    }
  },
}), { stylePriority: -1 });

const KarmaChangesDisplay = ({ karmaChanges, handleClose }: {
  karmaChanges: KarmaChanges;
  handleClose: (ev: React.MouseEvent) => any;
}) => {
  const classes = useStyles(styles);
  const { posts, comments, tagRevisions, updateFrequency } = karmaChanges;
  const noKarmaChanges = !(
    (posts && (posts.length > 0))
    || (comments && (comments.length > 0))
    || (tagRevisions && (tagRevisions.length > 0))
  );

  const karmaNotificationTimingChoices = getKarmaNotificationTimingChoices();

  return (
    <Typography variant="body2">
      {noKarmaChanges
        ? <span className={classes.title}>{karmaNotificationTimingChoices[updateFrequency].emptyText}</span>
        : <div>
            <span className={classes.title}>{karmaNotificationTimingChoices[updateFrequency].infoText}</span>
            <div className={classes.votedItems}>
              {karmaChanges.posts?.map((postChange) => <KarmaChangePost postChange={postChange} key={postChange._id}/>)}
              {karmaChanges.comments?.map((commentChange) => <KarmaChangeComment commentChange={commentChange} key={commentChange._id}/>)}
              {karmaChanges.tagRevisions?.map((tagChange) => <KarmaChangeTagRevision tagChange={tagChange} key={tagChange._id}/>)}
            </div>
          </div>
      }
      <Link to={`/account`} onClick={handleClose}>
        <span className={classes.settings}>Change Settings</span>
      </Link>
    </Typography>
  );
};

function KarmaChangePost({ postChange }: {
  postChange: PostKarmaChange;
}) {
  return <KarmaChangeRow
    link={postGetPageUrl(postChange)}
    scoreChange={postChange.scoreChange}
    addedReacts={postChange.addedReacts}
    description={postChange.title ?? ""}
  />
}

function KarmaChangeComment({ commentChange }: {
  commentChange: CommentKarmaChange;
}) {
  return <KarmaChangeRow
    link={commentGetPageUrlFromIds({ postId: commentChange.postId, tagSlug: commentChange.tagSlug, tagCommentType: commentChange.tagCommentType as TagCommentType, commentId: commentChange._id })}
    scoreChange={commentChange.scoreChange}
    addedReacts={commentChange.addedReacts}
    description={commentChange.description ?? ""}
  />
}

function KarmaChangeTagRevision({ tagChange }: {
  tagChange: RevisionsKarmaChange;
}) {
  const currentUser = useCurrentUser();
  return <KarmaChangeRow
    link={`${tagGetHistoryUrl({ slug: tagChange.tagSlug ?? "" })}?user=${currentUser!.slug}`}
    scoreChange={tagChange.scoreChange}
    addedReacts={tagChange.addedReacts}
    description={tagChange.tagName ?? ""}
  />
}

function KarmaChangeRow({link, scoreChange, addedReacts, description}: {
  link: string;
  scoreChange: number;
  addedReacts: ReactionChange[]|null|undefined;
  description: string;
}) {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const hideNegativeScoreChange = currentUser?.karmaChangeNotifierSettings?.showNegativeKarma === false;
  const showScoreChange = scoreChange>0 || (!hideNegativeScoreChange && scoreChange !== 0);

  return <MenuItemLink
    className={classes.votedItemRow}
    to={link}
  >
    {showScoreChange && <span className={classes.votedItemScoreChange}>
      <ColoredNumber n={scoreChange} />
    </span>}
    <NewReactions reactionChanges={addedReacts} />
    <div className={classes.votedItemDescription}>
      {description}
    </div>
  </MenuItemLink>
}

export default KarmaChangesDisplay;
