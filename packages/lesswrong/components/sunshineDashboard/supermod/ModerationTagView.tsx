import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import { Link } from '@/lib/reactRouterWrapper';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import FormatDate from '@/components/common/FormatDate';
import UsersName from '@/components/users/UsersName';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import TagSmallPostLink from '@/components/tagging/TagSmallPostLink';
import Loading from '@/components/vulcan-core/Loading';
import KeystrokeDisplay from './KeystrokeDisplay';
import type { InboxAction } from './inboxReducer';
import { useTagReviewActions } from './useTagReviewActions';

const TagPostsQuery = gql(`
  query multiTagRelModerationTagViewQuery($selector: TagRelSelector, $limit: Int) {
    tagRels(selector: $selector, limit: $limit) {
      results {
        ...TagRelFragment
      }
    }
  }
`);

const TAG_POSTS_LIMIT = 20;

const styles = defineStyles('ModerationTagView', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  actionsSection: {
    padding: 16,
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    flexShrink: 0,
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    fontSize: 13,
    padding: '6px 12px',
    minWidth: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  buttonIcon: {
    width: 14,
    marginRight: 4,
  },
  contentSection: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
    backgroundColor: theme.palette.background.paper,
  },
  tagName: {
    ...theme.typography.headerStyle,
    display: 'block',
    fontSize: 32,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.palette.grey[600],
    marginTop: 24,
    marginBottom: 8,
  },
  noDescription: {
    fontSize: 14,
    color: theme.palette.grey[600],
  },
  post: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    marginBottom: 4,
    color: theme.palette.grey[700],
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

const TagPosts = ({ tag }: { tag: SunshineTagFragment }) => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(TagPostsQuery, {
    variables: {
      selector: { postsWithTag: { tagId: tag._id } },
      limit: TAG_POSTS_LIMIT,
    },
  });
  const tagRels = data?.tagRels?.results;

  if (!tagRels && loading) return <Loading />;
  if (!tagRels?.length) return <div className={classes.noDescription}>No posts</div>;

  return <>
    {tagRels.map(tagRel => tagRel.post && <div key={tagRel._id} className={classes.post}>
      <TagSmallPostLink post={tagRel.post} />
    </div>)}
  </>;
};

const ModerationTagView = ({
  tag,
  currentUser,
  dispatch,
}: {
  tag: SunshineTagFragment | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const { approveTag, deleteTag } = useTagReviewActions(tag, currentUser, dispatch);

  if (!tag) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          Select a wikitag to review
        </div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.actionsSection}>
        <div className={classes.buttonRow}>
          <Button onClick={approveTag} className={classes.button}>
            <DoneIcon className={classes.buttonIcon} />
            Approve
            <KeystrokeDisplay keystroke="A" withMargin />
          </Button>
          <Button onClick={deleteTag} className={classes.button}>
            <ClearIcon className={classes.buttonIcon} />
            Delete
            <KeystrokeDisplay keystroke="D" withMargin />
          </Button>
        </div>
      </div>
      <div className={classes.contentSection} key={tag._id}>
        <Link to={tagGetUrl(tag)} className={classes.tagName}>
          {tag.name}
        </Link>
        <div className={classes.meta}>
          Created by <UsersName user={tag.user} />, <FormatDate date={tag.createdAt} /> ago
        </div>
        {tag.description?.html
          ? <ContentStyles contentType="tag">
            <ContentItemBody dangerouslySetInnerHTML={{ __html: tag.description.html }} description={`tag ${tag._id}`} />
          </ContentStyles>
          : <div className={classes.noDescription}>No description</div>
        }
        <div className={classes.sectionTitle}>
          {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
        </div>
        <TagPosts tag={tag} />
      </div>
    </div>
  );
};

export default ModerationTagView;
