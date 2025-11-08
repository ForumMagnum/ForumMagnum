import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { RankedItemMetadata, FeedItemSourceType, FeedCommentMetaInfo, FeedPostMetaInfo } from '../ultraFeed/ultraFeedTypes';
import LWTooltip from '../common/LWTooltip';
import { MenuItem } from '../common/Menus';
import ListItemIcon from '@/lib/vendor/@material-ui/core/src/ListItemIcon';
import ForumIcon from '../common/ForumIcon';
import { PostScoreBreakdownContent, ThreadScoreBreakdownContent } from '../ultraFeed/ScoreBreakdownContent';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';

const styles = defineStyles('ScoreBreakdownDropdownItem', (theme: ThemeType) => ({
  tooltipWrapper: {
    display: 'block',
  },
  title: {
    flexGrow: 1,
    overflowX: 'clip',
    textOverflow: 'ellipsis',
  },
  tooltip: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 3,
    boxShadow: theme.palette.boxShadow.lwCard,
  },
}));

const ScoreBreakdownDropdownItem = ({
  metadata,
  sources,
  commentMetaInfo,
  postMetaInfo,
}: {
  metadata: RankedItemMetadata;
  sources?: FeedItemSourceType[];
  commentMetaInfo?: FeedCommentMetaInfo;
  postMetaInfo?: FeedPostMetaInfo;
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  if (!userIsAdmin(currentUser)) {
    return null;
  }

  let tooltipContent: React.ReactNode;
  if (metadata.rankedItemType === 'commentThread') {
    tooltipContent = <ThreadScoreBreakdownContent breakdown={metadata.scoreBreakdown} sources={sources} metaInfo={commentMetaInfo} />;
  } else {
    tooltipContent = <PostScoreBreakdownContent breakdown={metadata.scoreBreakdown} sources={sources} metaInfo={postMetaInfo} />;
  }

  return (
    <LWTooltip title={tooltipContent} placement="auto" popperClassName={classes.tooltip} clickable className={classes.tooltipWrapper}>
      <MenuItem>
        <ListItemIcon>
          <ForumIcon icon="Insights" />
        </ListItemIcon>
        <span className={classes.title}>Why am I seeing this?</span>
      </MenuItem>
    </LWTooltip>
  );
};

export default ScoreBreakdownDropdownItem;

