import React, { useState } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { RankedItemMetadata, FeedItemSourceType, FeedCommentMetaInfo, FeedPostMetaInfo } from './ultraFeedTypes';
import LWTooltip from '../common/LWTooltip';
import ForumIcon from '../common/ForumIcon';
import { PostScoreBreakdownContent, ThreadScoreBreakdownContent, scoreBreakdownStyles } from './ScoreBreakdownContent';
import { useUltraFeedContext } from './UltraFeedContextProvider';
import AlterBonusesDialog from './AlterBonusesDialog';

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
    fontSize: 16,
    marginBottom: 12,
    color: theme.palette.text.primary,
    fontStyle: 'italic',
  },
  sectionTitle: {
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
  },
}));

const UltraFeedScoreBreakdown = ({ metadata, isFirstCommentInThread, sources, commentMetaInfo, postMetaInfo }: { 
  metadata: RankedItemMetadata;
  isFirstCommentInThread?: boolean;
  sources?: FeedItemSourceType[];
  commentMetaInfo?: FeedCommentMetaInfo;
  postMetaInfo?: FeedPostMetaInfo;
}) => {
  const classes = useStyles(styles);
  const breakdownClasses = useStyles(scoreBreakdownStyles);
  const { showScoreBreakdown, setShowScoreBreakdown } = useUltraFeedContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // For comment threads, only show on the first comment
  // For posts, isFirstCommentInThread will be undefined, so we always show
  if (isFirstCommentInThread === false) {
    return null;
  }
  
  const isThreadBreakdown = metadata.rankedItemType === 'commentThread';
  const isPostShowingThreadScore = isThreadBreakdown && !isFirstCommentInThread;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowScoreBreakdown(!showScoreBreakdown);
  };

  let tooltipContent;
  
  if (isPostShowingThreadScore) {
    tooltipContent = (
      <div className={breakdownClasses.tooltipContent}>
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
        <button 
          className={breakdownClasses.alterBonusesButton}
          onClick={(e) => {
            e.stopPropagation();
            setDialogOpen(true);
          }}
        >
          Alter Bonuses
        </button>
      </div>
    );
  } else if (metadata.rankedItemType === 'commentThread') {
    tooltipContent = (
      <div className={breakdownClasses.tooltipContent}>
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
        <button 
          className={breakdownClasses.alterBonusesButton}
          onClick={(e) => {
            e.stopPropagation();
            setDialogOpen(true);
          }}
        >
          Alter Bonuses
        </button>
      </div>
    );
  } else {
    tooltipContent = (
      <div className={breakdownClasses.tooltipContent}>
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
        <button 
          className={breakdownClasses.alterBonusesButton}
          onClick={(e) => {
            e.stopPropagation();
            setDialogOpen(true);
          }}
        >
          Alter Bonuses
        </button>
      </div>
    );
  }
  
  return (
    <span className={classes.container}>
      <LWTooltip 
        title={tooltipContent} 
        placement="top"
        popperClassName={classes.tooltip}
        clickable={true}
      >
        <span>
          {showScoreBreakdown && (
            <span className={classes.score}>
              {metadata.scoreBreakdown.total.toFixed(2)}
            </span>
          )}
          <ForumIcon icon="Insights" className={classes.icon} onClick={handleClick} />
        </span>
      </LWTooltip>
      <AlterBonusesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        className={breakdownClasses.alterBonusesDialogWrapper}
      />
    </span>
  );
};

export default UltraFeedScoreBreakdown;
