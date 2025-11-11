import React, { useState, ReactNode } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { RankedItemMetadata, FeedItemSourceType, FeedCommentMetaInfo, FeedPostMetaInfo } from './ultraFeedTypes';
import LWTooltip from '../common/LWTooltip';
import ForumIcon from '../common/ForumIcon';
import { PostScoreBreakdownContent, ThreadScoreBreakdownContent, scoreBreakdownStyles } from './ScoreBreakdownContent';
import { useUltraFeedContext } from './UltraFeedContextProvider';
import AlterBonusesDialog from './AlterBonusesDialog';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';

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
  constraints: {
    fontSize: 12,
    color: theme.palette.primary.main,
    marginTop: 8,
    fontStyle: 'italic',
  },
}));

const ScoreBreakdownTooltip = ({ 
  children, 
  headerText, 
  constraints, 
  onAlterBonuses 
}: { 
  children: ReactNode;
  headerText?: string;
  constraints: string[];
  onAlterBonuses: () => void;
}) => {
  const classes = useStyles(styles);
  const breakdownClasses = useStyles(scoreBreakdownStyles);
  
  return (
    <div className={breakdownClasses.tooltipContent}>
      {headerText && (
        <div className={classes.headerText}>
          {headerText}
        </div>
      )}
      {children}
      {constraints.length > 0 && (
        <div className={classes.constraints}>
          {headerText ? 'Thread constraints' : 'Constraints'}: {constraints.join(', ')}
        </div>
      )}
      <button 
        className={breakdownClasses.alterBonusesButton}
        onClick={(e) => {
          e.stopPropagation();
          onAlterBonuses();
        }}
      >
        Alter Bonuses
      </button>
    </div>
  );
};

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
  const currentUser = useCurrentUser();
  
  if (!userIsAdmin(currentUser)) {
    return null;
  }
  
  if (isFirstCommentInThread === false) {
    return null;
  }
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowScoreBreakdown(!showScoreBreakdown);
  };

  const isThreadBreakdown = metadata.rankedItemType === 'commentThread';
  const isPostShowingThreadScore = isThreadBreakdown && !isFirstCommentInThread;
  
  const tooltipContent = isThreadBreakdown ? (
    <ScoreBreakdownTooltip
      headerText={isPostShowingThreadScore ? "Post displayed because of comment thread" : undefined}
      constraints={metadata.selectionConstraints}
      onAlterBonuses={() => setDialogOpen(true)}
    >
      <ThreadScoreBreakdownContent 
        breakdown={metadata.scoreBreakdown} 
        sources={isPostShowingThreadScore ? undefined : sources}
        metaInfo={commentMetaInfo}
      />
    </ScoreBreakdownTooltip>
  ) : (
    <ScoreBreakdownTooltip
      constraints={metadata.selectionConstraints}
      onAlterBonuses={() => setDialogOpen(true)}
    >
      <PostScoreBreakdownContent 
        breakdown={metadata.scoreBreakdown} 
        sources={sources} 
        metaInfo={postMetaInfo}
      />
    </ScoreBreakdownTooltip>
  );
  
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
