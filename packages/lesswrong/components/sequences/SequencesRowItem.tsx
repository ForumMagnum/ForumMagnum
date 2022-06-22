import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import find from 'lodash/find';
import classNames from 'classnames';
import { useHover } from '../common/withHover';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    marginBottom: 20,
    background: theme.palette.panelBackground.default,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  text: {
    padding: 16,
    paddingBottom: 10,
    position: "relative",
    maxWidth: 600
  },
  title: {
    ...theme.typography.display0,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 2,
    fontVariant: "small-caps",
  },
  postStyle: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  author: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.text.dim,
    fontStyle: "italic",
    marginBottom: 10
  },
  sequenceImage: {
    position: "absolute",
    top: 0,
    right: 0,
    height: "100%",
    width: 220,
    zIndex: 0,

    [theme.breakpoints.down('xs')]: {
      marginTop: 0,
      marginBottom: 0,
      position: "absolute",
      overflow: 'hidden',
      right: 0,
      bottom: 0,
      height: "100%",
    },

    // Overlay a white-to-transparent gradient over the image
    "&:after": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      background: `linear-gradient(to right, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent4} 50%, transparent 100%)`,
    }
  },
  sequenceImageImg: {
    height: "100%",
    width: 240,
    objectFit: "cover",
    [theme.breakpoints.down('xs')]: {
      height: "100%",
      width: 'auto'
    },
  },
  postIcon: {
    height: 14,
    width: 11,
    marginRight: 4,
    opacity: .25
  },
  postRead: {
    opacity: .5
  },
  postTitle: {
    ...theme.typography.smallFont,
    ...theme.typography.postStyle
  },
  posts: {
    marginTop: 5
  },
  read: {
    width: 14,
    color: theme.palette.primary.light
  },
  unread: {
    width: 14,
    color: theme.palette.grey[400]
  },
  bottom: {
    display: "flex",
    justifyContent: "space-between"
  },
  nextUnreadSection: {
    fontSize: "1.1rem",
    ...theme.typography.commentStyle,
    marginTop: 8,
    color: theme.palette.grey[600],
    marginBottom: 6
  },
  nextUnreadPost: {
    color: theme.palette.primary.main
  },
  nextIcon: {
    color: theme.palette.grey[900],
    width: 16
  }
});

export const SequencesRowItem = ({sequence, showAuthor=true, classes}: {
  sequence: SequencesPageFragment,
  showAuthor?: boolean,
  classes: ClassesType,
}) => {
  const { UsersName, ContentStyles, LWTooltip, ContentItemTruncated, PostsPreviewTooltip, CloudinaryImage } = Components

  const { hover, eventHandlers } = useHover()

  const [expanded, setExpanded] = useState<boolean>(false)

  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  const { results: chapters } = useMulti({
    terms: {
      view: "SequenceChapters",
      sequenceId: sequence._id,
      limit: 100
    },
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
    enableTotal: false,
  });

  let posts : PostsList[] = []
  chapters?.forEach(chapter => chapter.posts.forEach(post=>posts.push(post)))

  const nextUnreadPost = find(posts, post => !post.lastVisitedAt)
  const unreadMessage = nextUnreadPost ? nextUnreadPost._id === posts[0]._id ? "First Post: " : "Next Post: " : ""


  return <div className={classes.root}>
      <div className={classes.sequenceImage}>
        {/* <CloudinaryImage
          publicId={sequence.bannerImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
          width="240"
          height="auto"
        /> */}
        <img className={classes.sequenceImageImg}
          src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
            sequence.bannerImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"
          }`}
          />
      </div>
      <div className={classes.text}>
        <Link to={'/s/' + sequence._id} className={classes.title}>{sequence.title}</Link>
        { showAuthor && sequence.user &&
          <div className={classes.author}>
            by <UsersName user={sequence.user} />
          </div>}
        <ContentStyles contentType="postHighlight" className={classes.description}>
          <ContentItemTruncated
              maxLengthWords={100}
              graceWords={20}
              rawWordCount={sequence.contents?.wordCount || 0}
              expanded={expanded}
              getTruncatedSuffix={() => null}
              dangerouslySetInnerHTML={{__html: sequence.contents?.htmlHighlight || ""}}
              description={`sequence ${sequence._id}`}
            />
        </ContentStyles>
        <div className={classes.posts}>
          {posts.map(post=> <LWTooltip title={<PostsPreviewTooltip post={post}/>} key={post._id} inlineBlock={false} tooltip={false}>
              <Link to={postGetPageUrl(post)}>
                {!!post.lastVisitedAt ? 
                  <CheckBoxTwoToneIcon className={classes.read}/>
                  :
                  <CheckBoxOutlineBlankIcon className={classNames(classes.unread, {[classes.nextIcon]: hover && nextUnreadPost?._id === post._id})}/>
                }
              </Link>
            </LWTooltip>
          )}
        </div>
        {nextUnreadPost && <div className={classes.nextUnreadSection}>{unreadMessage} <LWTooltip title={<PostsPreviewTooltip post={nextUnreadPost}/>} key={nextUnreadPost._id} inlineBlock={false} tooltip={false} flip={false} placement="bottom-start">
          <Link to={postGetPageUrl(nextUnreadPost)} className={classes.nextUnreadPost} {...eventHandlers}>
            {nextUnreadPost.title}
          </Link>
        </LWTooltip></div>}
      </div>
  </div>
}

const SequencesRowItemComponent = registerComponent('SequencesRowItem', SequencesRowItem, {styles});

declare global {
  interface ComponentTypes {
    SequencesRowItem: typeof SequencesRowItemComponent
  }
}

