import React from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { useCurrentUser } from '../common/withUser';
import Loading from '../vulcan-core/Loading';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { tagGetHistoryUrl } from '@/lib/collections/tags/helpers';
import { TagCommentType } from '@/lib/collections/comments/types';
import { ColoredNumber } from '../users/karmaChanges/ColoredNumber';
import { NewReactions } from '../users/karmaChanges/NewReactions';
import { UserKarmaChangesQuery } from '../users/karmaChanges/KarmaChangeNotifier';
import { useNavigate } from '@/lib/routeUtil';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles('NotificationsPageKarmaChangesList', (theme: ThemeType) => ({
  root: {
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
  item: {
    position: 'relative',
  },
  itemLink: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
    padding: '10px 16px 10px 0',
    borderBottom: theme.palette.border.faint,
    transition: 'background-color 80ms ease',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.07),
    },
  },
  scoreWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 48,
    ...theme.typography.body2,
    fontSize: 14,
    fontWeight: 600,
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  description: {
    ...theme.typography.body2,
    fontSize: 14,
    lineHeight: '20px',
    color: theme.palette.text.normal,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  reactions: {
    flexShrink: 0,
  },
  sectionHeader: {
    ...theme.typography.body2,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: theme.palette.text.dim55,
    padding: '12px 16px 6px 16px',
    borderBottom: theme.palette.border.faint,
  },
  empty: {
    ...theme.typography.body2,
    padding: '32px 16px',
    textAlign: 'center',
    color: theme.palette.text.dim55,
    fontSize: 14,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '32px 16px',
  },
}));

function KarmaChangeItemRow({link, scoreChange, addedReacts, description}: {
  link: string;
  scoreChange: number;
  addedReacts: ReadonlyArray<{reactionType: string; userId: string | null}> | null | undefined;
  description: string;
}) {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const hideNegativeScoreChange = currentUser?.karmaChangeNotifierSettings?.showNegativeKarma === false;
  const showScoreChange = scoreChange > 0 || (!hideNegativeScoreChange && scoreChange !== 0);

  return (
    <li className={classes.item}>
      <a
        href={link}
        className={classes.itemLink}
        onClick={(ev) => {
          if (ev.button > 0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) return;
          ev.preventDefault();
          navigate(link);
        }}
      >
        <span className={classes.scoreWrapper}>
          {showScoreChange && <ColoredNumber n={scoreChange} />}
        </span>
        <div className={classes.content}>
          <span className={classes.description}>{description}</span>
          <span className={classes.reactions}>
            <NewReactions reactionChanges={addedReacts as Array<{reactionType: string; userId: string | null}>} />
          </span>
        </div>
      </a>
    </li>
  );
}

const NotificationsPageKarmaChangesList = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { data, loading } = useQuery(UserKarmaChangesQuery, {
    variables: { documentId: currentUser?._id },
    skip: !currentUser,
  });

  const karmaChanges = data?.user?.result?.karmaChanges;

  if (loading) {
    return (
      <div className={classes.loading}>
        <Loading />
      </div>
    );
  }

  if (!karmaChanges) {
    return <div className={classes.empty}>No karma changes to show</div>;
  }

  const { posts, comments, tagRevisions } = karmaChanges;
  const hasAny = (posts?.length ?? 0) > 0 || (comments?.length ?? 0) > 0 || (tagRevisions?.length ?? 0) > 0;

  if (!hasAny) {
    return <div className={classes.empty}>No karma changes in the current period</div>;
  }

  return (
    <ul className={classes.root}>
      {posts && posts.length > 0 && (
        <>
          <li className={classes.sectionHeader}>Posts</li>
          {posts.map((postChange) => (
            <KarmaChangeItemRow
              key={postChange._id}
              link={postGetPageUrl(postChange)}
              scoreChange={postChange.scoreChange}
              addedReacts={postChange.addedReacts}
              description={postChange.title ?? ''}
            />
          ))}
        </>
      )}
      {comments && comments.length > 0 && (
        <>
          <li className={classes.sectionHeader}>Comments</li>
          {comments.map((commentChange) => (
            <KarmaChangeItemRow
              key={commentChange._id}
              link={commentGetPageUrlFromIds({
                postId: commentChange.postId ?? undefined,
                tagSlug: commentChange.tagSlug ?? undefined,
                tagCommentType: (commentChange.tagCommentType ?? undefined) as TagCommentType | undefined,
                commentId: commentChange._id,
              })}
              scoreChange={commentChange.scoreChange}
              addedReacts={commentChange.addedReacts}
              description={commentChange.description ?? ''}
            />
          ))}
        </>
      )}
      {tagRevisions && tagRevisions.length > 0 && (
        <>
          <li className={classes.sectionHeader}>Tag Revisions</li>
          {tagRevisions.map((tagChange) => (
            <KarmaChangeItemRow
              key={tagChange._id}
              link={`${tagGetHistoryUrl({ slug: tagChange.tagSlug ?? '' })}?user=${currentUser!.slug}`}
              scoreChange={tagChange.scoreChange}
              addedReacts={tagChange.addedReacts}
              description={tagChange.tagName ?? ''}
            />
          ))}
        </>
      )}
    </ul>
  );
};

export default NotificationsPageKarmaChangesList;
