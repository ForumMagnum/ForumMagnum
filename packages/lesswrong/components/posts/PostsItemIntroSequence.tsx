import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { useRecordPostView } from '../hooks/useRecordPostView';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { KARMA_WIDTH } from './LWPostsItem';
import { isFriendlyUI } from '../../themes/forumTheme';
import { KarmaDisplay } from "../common/KarmaDisplay";
import { PostsTitle } from "./PostsTitle";
import { PostsUserAndCoauthors } from "./PostsUserAndCoauthors";
import { PostsItem2MetaInfo } from "./PostsItem2MetaInfo";
import { PostsItemTooltipWrapper } from "./PostsItemTooltipWrapper";
import { AnalyticsTracker } from "../common/AnalyticsTracker";

const IMAGE_WIDTH = 292;
const IMAGE_HEIGHT = 96;

export const styles = (theme: ThemeType)=> ({
  root: {
    position: "relative",
    borderRadius: isFriendlyUI ? theme.borderRadius.small : undefined,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
  },
  background: {
    width: "100%",
    background: theme.palette.panelBackground.default,
  },
  translucentBackground: {
    width: "100%",
    background: theme.palette.panelBackground.translucent,
    backdropFilter: "blur(1px)",
  },
  postsItem: {
    display: "grid",
    gridTemplateColumns: "min-content 1fr min-content",
    gridTemplateAreas: '"karma title author"',
    position: "relative",
    padding: 10,
    alignItems: "center",
    flexWrap: "nowrap",
    [theme.breakpoints.down('xs')]: {
      gridTemplateAreas: '"karma title" "karma author"',
      flexWrap: "wrap",
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
    },
  },
  postsItemWithImage: {
    gridTemplateAreas: '"karma title" "karma author"',
    paddingTop: 15,
    paddingBottom: 15,
  },
  bottomBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  karma: {
    width: KARMA_WIDTH,
    justifyContent: "center",
    gridArea: "karma",
  },
  title: {
    minHeight: 26,
    flexGrow: 1,
    flexShrink: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: 12,
    gridArea: "title",
    [theme.breakpoints.up('sm')]: {
      position: "relative",
      top: 3,
    },
    [theme.breakpoints.down('xs')]: {
      maxWidth: '80%',
      paddingRight: theme.spacing.unit,
    },
    '&:hover': {
      opacity: 1,
    },
  },
  author: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    marginRight: theme.spacing.unit*1.5,
    zIndex: theme.zIndexes.postItemAuthor,
    gridArea: "author",
    width: "min-content",
  },
  mobileSecondRowSpacer: {
    [theme.breakpoints.up('sm')]: {
      display: "none",
    },
    flexGrow: 1,
  },
  sequenceImage: {
    position: "absolute",
    height: "100%",
    marginTop: 0,
    marginBottom: 0,
    overflow: 'hidden',
    right: 0,
    bottom: 0,
    aspectRatio: `${IMAGE_WIDTH}/${IMAGE_HEIGHT}`,

    // Overlay a white-to-transparent gradient over the image
    "&:after": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      background: `linear-gradient(to right, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent2} 30%, transparent 100%)`,
    },
  },
  sequenceImageImg: {
    height: "100%",
    width: 'auto',
    opacity: 0.6,
  },
  dense: {
    paddingTop: 7,
    paddingBottom:8,
  },
})

const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

const PostsItemIntroSequenceInner = ({
  post,
  sequence,
  showBottomBorder=true,
  hideAuthor=false,
  classes,
  curatedIconLeft=false,
  translucentBackground=false,
  withImage,
}: {
  post: PostsList,
  chapter?: any,
  sequence?: SequencesPageFragment,
  showBottomBorder?: boolean,
  showPostedAt?: boolean,
  defaultToShowUnreadComments?: boolean,
  dense?: boolean,
  hideAuthor?: boolean,
  classes: ClassesType<typeof styles>,
  curatedIconLeft?: boolean,
  translucentBackground?: boolean,
  withImage?: boolean,
}) => {
  const { isRead } = useRecordPostView(post);
  const postLink = postGetPageUrl(post, false, sequence?._id);

  return (
    <AnalyticsContext pageElementContext="postItem" postId={post._id}>
      <div className={classNames(
        classes.root,
        {
          [classes.background]: !translucentBackground,
          [classes.translucentBackground]: translucentBackground,
          [classes.bottomBorder]: showBottomBorder,
        })}
      >
        <PostsItemTooltipWrapper
          post={post}
          className={classNames(
            classes.postsItem,
            {
              [classes.postsItemWithImage]: withImage,
            }
          )}
        >
          <PostsItem2MetaInfo className={classes.karma}>
            {<KarmaDisplay document={post} />}
          </PostsItem2MetaInfo>
          <span className={classes.title}>
            <AnalyticsTracker
              eventType={"postItem"}
              captureOnMount={(eventData) => eventData.capturePostItemOnMount}
              captureOnClick={false}
            >
              <PostsTitle
                postLink={postLink}
                post={post}
                read={isRead}
                curatedIconLeft={curatedIconLeft}
              />
            </AnalyticsTracker>
          </span>
          {!post.isEvent && !hideAuthor && <PostsItem2MetaInfo className={classes.author}>
            <PostsUserAndCoauthors post={post} abbreviateIfLong={true} />
          </PostsItem2MetaInfo>}

          <div className={classes.mobileSecondRowSpacer}/>

          {withImage && sequence?.gridImageId && <div className={classes.sequenceImage}>
            <img className={classes.sequenceImageImg}
              src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_${IMAGE_HEIGHT},q_auto,w_${IMAGE_WIDTH}/v1/${
                sequence.gridImageId
              }`}
            />
          </div>}
        </PostsItemTooltipWrapper>

      </div>
    </AnalyticsContext>
  )
};

export const PostsItemIntroSequence = registerComponent('PostsItemIntroSequence', PostsItemIntroSequenceInner, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    PostsItemIntroSequence: typeof PostsItemIntroSequence
  }
}
