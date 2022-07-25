import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { useRecordPostView } from '../common/withRecordPostView';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { KARMA_WIDTH } from './PostsItem2';

export const styles = (theme: ThemeType): JssStyles=> ({
  root: {
    position: "relative",
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
    display: "flex",
    alignItems: "center",
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
    display: "flex",
    position: "relative",
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: "center",
    flexWrap: "nowrap",
    flexGrow: 1,
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap",
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
    },
  },
  postsItemWithImage: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: 15,
    paddingBottom: 15,
  },
  bottomBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  karma: {
    width: KARMA_WIDTH,
    justifyContent: "center",
  },
  title: {
    minHeight: 26,
    flexGrow: 1,
    flexShrink: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: 12,
    [theme.breakpoints.up('sm')]: {
      position: "relative",
      top: 3,
    },
    [theme.breakpoints.down('xs')]: {
      order:-1,
      height: "unset",
      maxWidth: "unset",
      width: "100%",
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
    [theme.breakpoints.down('xs')]: {
      justifyContent: "flex-end",
      width: "unset",
      marginLeft: 0,
      flex: "unset",
    },
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
  },
  dense: {
    paddingTop: 7,
    paddingBottom:8,
  },
})

const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

const PostsItemIntroSequence = ({
  // post: The post displayed.
  post,
  // sequenceId, chapter: If set, these will be used for making a nicer URL.
  sequenceId,
  chapter,
  sequence,
  showBottomBorder=true,
  // dense: (bool) Slightly reduce margins to make this denser. Used on the
  // All Posts page.
  dense=false,
  hideAuthor=false,
  classes,
  curatedIconLeft=false,
  translucentBackground=false,
  withImage,
}: {
  post: PostsList,
  sequenceId?: string,
  chapter?: any,
  sequence: SequencesPageFragment,
  showBottomBorder?: boolean,
  showPostedAt?: boolean,
  defaultToShowUnreadComments?: boolean,
  dense?: boolean,
  hideAuthor?: boolean,
  classes: ClassesType,
  curatedIconLeft?: boolean,
  translucentBackground?: boolean,
  withImage?: boolean,
}) => {
  const { isRead } = useRecordPostView(post);

  const { PostsItemKarma, PostsTitle, PostsUserAndCoauthors, PostsItem2MetaInfo, PostsItemTooltipWrapper, AnalyticsTracker } = (Components as ComponentTypes)

  const postLink = postGetPageUrl(post, false, sequenceId || chapter?.sequenceId);

  return (
      <AnalyticsContext pageElementContext="postItem" postId={post._id}>
        <div className={classNames(
          classes.root,
          {
            [classes.background]: !translucentBackground,
            [classes.translucentBackground]: translucentBackground,
            [classes.bottomBorder]: showBottomBorder,
            [classes.isRead]: isRead,
          })}
        >
          <PostsItem2MetaInfo className={classes.karma}>
            {<PostsItemKarma post={post} />}
          </PostsItem2MetaInfo>
          <PostsItemTooltipWrapper
            post={post}
            className={classNames(
              classes.postsItem,
              {
                [classes.dense]: dense,
                [classes.postsItemWithImage]: withImage,
              }
            )}
          >
            <span className={classNames(classes.title)}>
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

            {withImage && <div className={classes.sequenceImage}>
              <img className={classes.sequenceImageImg}
                src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
                  sequence.gridImageId
                }`}
              />
            </div>}
          </PostsItemTooltipWrapper>

        </div>
      </AnalyticsContext>
  )
};

const PostsItemIntroSequenceComponent = registerComponent('PostsItemIntroSequence', PostsItemIntroSequence, {
  styles,
  hocs: [withErrorBoundary],
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    PostsItemIntroSequence: typeof PostsItemIntroSequenceComponent
  }
}
