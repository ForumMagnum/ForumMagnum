import { AnnualReviewMarketInfo } from '../../lib/annualReviewMarkets';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useHover } from '../common/withHover';
import { highlightReviewWinnerThresholdSetting } from '@/lib/instanceSettings';
import { tagStyle } from '../tagging/FooterTag';
import { isFriendlyUI } from '@/themes/forumTheme';

const styles = (theme: ThemeType) => ({
  expectedWinner: {
    color: theme.palette.review.winner,
    border: '1px solid',
    borderColor: theme.palette.review.winner,
    borderRadius: '4px',
    fontFamily: theme.typography.fontFamily,
    width: 'fit-content',
    display: 'inline-block',
    padding: '5px',
    boxSizing: 'border-box',

    paddingLeft: 6,
    paddingRight: 6,
    marginRight: isFriendlyUI ? 3 : undefined,
    marginBottom: isFriendlyUI ? 8 : undefined,
    fontWeight: theme.typography.body1.fontWeight,
    ...theme.typography.commentStyle,
    cursor: "pointer",
    whiteSpace: isFriendlyUI ? "nowrap": undefined,
  },
  expectedLoser: {
    color: theme.palette.tag.text,
    fontFamily: theme.typography.fontFamily,
    width: 'fit-content',
    display: 'inline-block',
    padding: '5px',
    
    paddingLeft: 6,
    paddingRight: 6,
    marginRight: isFriendlyUI ? 3 : undefined,
    marginBottom: isFriendlyUI ? 8 : undefined,
    fontWeight: theme.typography.body1.fontWeight,
    ...theme.typography.commentStyle,
    cursor: "pointer",
    whiteSpace: isFriendlyUI ? "nowrap": undefined,
  },
  preview: {
    maxWidth: 400,
  },
});

const PostsAnnualReviewMarketTag = ({ post, annualReviewMarketInfo, classes }: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList | SunshinePostsList,
  annualReviewMarketInfo: AnnualReviewMarketInfo,
  classes: ClassesType<typeof styles>,
}) => {

  const { CommentsNode, LWPopper } = Components;
  const { anchorEl, hover, eventHandlers } = useHover();

  const { annualReviewMarketComment } = post;

  const golden = (annualReviewMarketInfo.probability >= highlightReviewWinnerThresholdSetting.get()) ? "expectedWinner" : "expectedLoser"

  const decimalPlaces = 0;
  return <span>
    <div className={classes[golden]} {...eventHandlers}>
      {annualReviewMarketInfo.year} Top Fifty: {parseFloat((annualReviewMarketInfo.probability * 100).toFixed(decimalPlaces))}%
      {!!annualReviewMarketComment &&
        <LWPopper
          open={hover}
          anchorEl={anchorEl}
          placement="bottom-end"
          clickable={true}
        >
          <div className={classes.preview}>
            <CommentsNode
              truncated
              nestingLevel={1}
              comment={annualReviewMarketComment}
              treeOptions={{
                post: post,
                forceNotSingleLine: true,
              }}
              hoverPreview
            />
          </div>
        </LWPopper>
      }
    </div>
  </span>
};

const PostsAnnualReviewMarketTagComponent = registerComponent('PostsAnnualReviewMarketTag', PostsAnnualReviewMarketTag, { styles });

declare global {
  interface ComponentTypes {
    PostsAnnualReviewMarketTag: typeof PostsAnnualReviewMarketTagComponent
  }
}
