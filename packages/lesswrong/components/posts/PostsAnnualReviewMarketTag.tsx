import { AnnualReviewMarketInfo } from '../../lib/annualReviewMarkets';
import { useSingle } from '../../lib/crud/withSingle';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { CommentTreeOptions } from '../comments/commentTree';
import { PostsPreviewTooltip } from './PostsPreviewTooltip/PostsPreviewTooltip';
import { useHover } from '../common/withHover';

const styles = (theme: ThemeType) => ({
    root: {
        // marginTop: 8,
        // marginBottom: 8,
      },
    expectedWinner: {
        color: theme.palette.text.annualReviewMarketKarma,
        border: '2px solid', // Set the border color to gold
        borderColor: theme.palette.text.annualReviewMarketKarma,
        borderRadius: '4px', // Slightly rounded borders
        // backgroundColor: 'gold', // Set the background color to gold
        width: 'fit-content',
        display: 'inline-block',
        maxHeight: '100', // Fixed height size
        // textAlign: 'right', // Align text to the right
        padding: '5px', // Optional: Add some padding inside the box
        margin: '8px', // Optional: margins make it easier to align the text when using borders
        boxSizing: 'border-box', // Optional: Make sure padding doesn't affect the total width of the box
      },
    preview: {
      maxWidth: 400,
    },
  });

const PostsAnnualReviewMarketTag = ({post, annualReviewMarketInfo, classes}: {
    post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList,
    annualReviewMarketInfo: AnnualReviewMarketInfo | null,
    classes: ClassesType<typeof styles>,
  })  => {

    const { CommentsNode, LWPopper } = Components;
    const {anchorEl, hover, eventHandlers} = useHover();

    const annualReviewMarketCommentId = post.annualReviewMarketCommentId

    const {document: comment} = useSingle({
        documentId: annualReviewMarketCommentId,
        collectionName: "Comments",
        fragmentName: "CommentsList",
      });

    if (!annualReviewMarketInfo) {
      return <div></div>;
    }
    
    const decimalPlaces = 0;
    return <span className={classes.root}>
      <div className={classes.expectedWinner} {...eventHandlers}>
        {annualReviewMarketInfo?.year} Top Fifty: {parseFloat((annualReviewMarketInfo?.probability*100).toFixed(decimalPlaces))}%
        {!!comment && 
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
              comment={comment}
              treeOptions={{
                // ...treeOptions,
                post: post,
                // hideReply: true,
                // forceSingleLine: false,
                forceNotSingleLine: true,
                // switchAlternatingHighlights: false,
              }}
              hoverPreview
            >
            </CommentsNode>
          </div>
        </LWPopper>
        }
      {/* If the comment is not found, we should probably still have a tooltip explaining what it means, maybe with a link to the market? e.g. if the comment gets deleted */}
    </div>
    </span>
};

const PostsAnnualReviewMarketTagComponent = registerComponent('PostsAnnualReviewMarketTag', PostsAnnualReviewMarketTag, {styles});

declare global {
  interface ComponentTypes {
    PostsAnnualReviewMarketTag: typeof PostsAnnualReviewMarketTagComponent
  }
}
