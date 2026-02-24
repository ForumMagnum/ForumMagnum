import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import PostsPageWrapper from '@/components/posts/PostsPage/PostsPageWrapper';
import { CurationNoticesForm } from '@/components/admin/CurationNoticesForm';
import { CurationNoticesItem } from '@/components/admin/CurationNoticesItem';
import BasicFormStyles from '@/components/form-components/BasicFormStyles';

const styles = defineStyles('CurationPostSidebar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  curationSection: {
    padding: 16,
    maxWidth: 720,
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    flexShrink: 0,
    overflow: 'auto',
    maxHeight: '50%',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 8,
  },
  postWrapper: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    paddingTop: 48,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

const CurationPostSidebar = ({post, currentUser}: {
  post: SunshineCurationPostsList | null;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);

  if (!post) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>Select a post to review</div>
      </div>
    );
  }

  const curationNotices = post.curationNotices ?? [];

  return (
    <div className={classes.root}>
      <div className={classes.curationSection}>
        {curationNotices.map(notice => (
          <CurationNoticesItem key={notice._id} curationNotice={notice} />
        ))}
        <div className={classes.sectionLabel}>
          {curationNotices.length > 0 ? 'New Curation Notice' : 'Write Curation Notice'}
        </div>
        <BasicFormStyles>
          <CurationNoticesForm currentUser={currentUser} postId={post._id} />
        </BasicFormStyles>
      </div>
      <div className={classes.postWrapper} key={post._id}>
        <PostsPageWrapper documentId={post._id} sequenceId={null} embedded />
      </div>
    </div>
  );
};

export default CurationPostSidebar;
