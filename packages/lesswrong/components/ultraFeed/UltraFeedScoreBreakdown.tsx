import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { RankedItemMetadata, FeedItemSourceType, FeedCommentMetaInfo, FeedPostMetaInfo } from './ultraFeedTypes';
import LWTooltip from '../common/LWTooltip';
import ForumIcon from '../common/ForumIcon';
import { PostScoreBreakdownContent, ThreadScoreBreakdownContent } from './ScoreBreakdownContent';
import { useUltraFeedContext } from './UltraFeedContextProvider';

const styles = defineStyles('UltraFeedScoreBreakdown', (theme: ThemeType) => ({
  container: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  score: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.text.secondary,
    marginLeft: 8,
    marginRight: 4,
  },
  icon: {
    cursor: 'pointer',
    color: theme.palette.grey[400],
    fontSize: 18,
    marginLeft: 8,
    verticalAlign: 'middle',
    position: 'relative',
    bottom: 1,
  },
  tooltip: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 3,
    boxShadow: theme.palette.boxShadow.lwCard,
  },
  headerText: {
    padding: '12px 16px',
    fontSize: 16,
    // marginBottom: 12,
    color: theme.palette.text.primary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    padding: '0 12px',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  constraints: {
    fontSize: 12,
    color: theme.palette.primary.main,
    marginTop: 8,
    fontStyle: 'italic',
    padding: '0 12px',
  },
}));

const UltraFeedScoreBreakdown = ({ metadata, isFirstCommentInThread, sources, commentMetaInfo, postMetaInfo }: { 
  metadata?: RankedItemMetadata;
  isFirstCommentInThread?: boolean;
  sources?: FeedItemSourceType[];
  commentMetaInfo?: FeedCommentMetaInfo;
  postMetaInfo?: FeedPostMetaInfo;
}) => {
  const classes = useStyles(styles);
  const { showScoreBreakdown, setShowScoreBreakdown } = useUltraFeedContext();
  
  // For comment threads, only show on the first comment
  // For posts, isFirstCommentInThread will be undefined, so we always show
  if (isFirstCommentInThread === false) {
    return null;
  }
  
  const isThreadBreakdown = metadata?.rankedItemType === 'commentThread';
  const isPostShowingThreadScore = isThreadBreakdown && !isFirstCommentInThread;
  
  if (!metadata) {
    return null;
  }
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowScoreBreakdown(!showScoreBreakdown);
  };

  let tooltipContent;
  
  if (isPostShowingThreadScore) {
    tooltipContent = (
      <>
        <div className={classes.headerText}>
          Post displayed because of comment thread
        </div>
        <ThreadScoreBreakdownContent 
          breakdown={metadata.scoreBreakdown} 
          metaInfo={commentMetaInfo}
        />
        {metadata.selectionConstraints.length > 0 && (
          <div className={classes.constraints}>
            Thread constraints: {metadata.selectionConstraints.join(', ')}
          </div>
        )}
      </>
    );
  } else if (metadata.rankedItemType === 'commentThread') {
    tooltipContent = (
      <>
        <ThreadScoreBreakdownContent 
          breakdown={metadata.scoreBreakdown} 
          sources={sources} 
          metaInfo={commentMetaInfo}
        />
        {metadata.selectionConstraints.length > 0 && (
          <div className={classes.constraints}>
            Constraints: {metadata.selectionConstraints.join(', ')}
          </div>
        )}
      </>
    );
  } else {
    tooltipContent = (
      <>
        <PostScoreBreakdownContent 
          breakdown={metadata.scoreBreakdown} 
          sources={sources} 
          metaInfo={postMetaInfo}
        />
        {metadata.selectionConstraints.length > 0 && (
          <div className={classes.constraints}>
            Constraints: {metadata.selectionConstraints.join(', ')}
          </div>
        )}
      </>
    );
  }
  
  return (
    <span className={classes.container}>
      {showScoreBreakdown && (
        <span className={classes.score}>
          {metadata.scoreBreakdown.total.toFixed(2)}
        </span>
      )}
      <LWTooltip 
        title={tooltipContent} 
        placement="top"
        popperClassName={classes.tooltip}
        clickable={true}
      >
        <ForumIcon icon="Insights" className={classes.icon} onClick={handleClick} />
      </LWTooltip>
    </span>
  );
};

export default UltraFeedScoreBreakdown;
