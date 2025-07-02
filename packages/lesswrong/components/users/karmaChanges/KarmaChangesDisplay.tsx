import React from 'react';
import { MenuItemLink } from '@/components/common/Menus';
import { Typography } from '@/components/common/Typography';
import { useCurrentUser } from '@/components/common/withUser';
import { useStyles } from '@/components/hooks/useStyles';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { TagCommentType } from '@/lib/collections/comments/types';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { tagGetHistoryUrl } from '@/lib/collections/tags/helpers';
import { Link } from '@/lib/reactRouterWrapper';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { getKarmaNotificationTimingChoices } from '../KarmaChangeNotifierSettings';
import { NewReactions } from './NewReactions';
import { ColoredNumber } from './ColoredNumber';
import { styles } from './styles';

const KarmaChangesDisplay = ({ karmaChanges, handleClose }: {
  karmaChanges: any;
  handleClose: (ev: React.MouseEvent) => any;
}) => {
  const classes = useStyles(styles);
  const { posts, comments, tagRevisions, updateFrequency } = karmaChanges;
  const currentUser = useCurrentUser();
  const noKarmaChanges = !(
    (posts && (posts.length > 0))
    || (comments && (comments.length > 0))
    || (tagRevisions && (tagRevisions.length > 0))
  );

  const karmaNotificationTimingChoices = getKarmaNotificationTimingChoices();

  return (
    <Typography variant="body2">
      {noKarmaChanges ?
        <span className={classes.title}>{karmaNotificationTimingChoices[updateFrequency].emptyText}</span>
        :
        <div>
          <span className={classes.title}>{karmaNotificationTimingChoices[updateFrequency].infoText}</span>
          <div className={classes.votedItems}>
            {karmaChanges.posts && karmaChanges.posts.map((postChange: AnyBecauseTodo) => (
              <MenuItemLink
                className={classes.votedItemRow}
                to={postGetPageUrl(postChange)}
                key={postChange._id}
              >
                {(postChange.scoreChange !== 0) && <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={postChange.scoreChange} />
                </span>}
                <span className={classes.votedItemReacts}>
                  <NewReactions reactionChanges={postChange.addedReacts} />
                </span>
                <div className={classes.votedItemDescription}>
                  {postChange.title}
                </div>
              </MenuItemLink>
            ))}
            {karmaChanges.comments && karmaChanges.comments.map((commentChange: AnyBecauseTodo) => (
              <MenuItemLink
                className={classes.votedItemRow}
                // tagCommentType is given a String type in packages/lesswrong/lib/collections/users/karmaChangesGraphQL.ts because we couldn't get an inline union of literal types to work,
                // but actually we know it will always be a TagCommentType because the db schema constrains it
                to={commentGetPageUrlFromIds({ postId: commentChange.postId, tagSlug: commentChange.tagSlug, tagCommentType: commentChange.tagCommentType as TagCommentType, commentId: commentChange._id })} key={commentChange._id}
              >
                {(commentChange.scoreChange !== 0) && <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={commentChange.scoreChange} />
                </span>}
                {!!commentChange.addedReacts.length && <span className={classes.votedItemReacts}>
                  <NewReactions reactionChanges={commentChange.addedReacts} />
                </span>}
                <div className={classes.votedItemDescription}>
                  {commentChange.description}
                </div>
              </MenuItemLink>
            ))}
            {karmaChanges.tagRevisions.map((tagChange: AnyBecauseTodo) => (
              <MenuItemLink
                className={classes.votedItemRow}
                key={tagChange._id}
                to={`${tagGetHistoryUrl({ slug: tagChange.tagSlug })}?user=${currentUser!.slug}`}
              >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={tagChange.scoreChange} />
                </span>
                <span className={classes.votedItemReacts}>
                  <NewReactions reactionChanges={tagChange.addedReacts} />
                </span>
                <div className={classes.votedItemDescription}>
                  {tagChange.tagName}
                </div>
              </MenuItemLink>
            ))}
          </div>
        </div>}
      <Link to={`/account`} onClick={handleClose}>
        <span className={classes.settings}>{preferredHeadingCase("Change Settings")}</span>
      </Link>
    </Typography>
  );
};

export default KarmaChangesDisplay;
