import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { siteImageSetting } from '../vulcan-core/App';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "100%",
    // white background
    background: theme.palette.background.pageActiveAreaBackground,
    borderRadius: 6,
    display: "flex",
    padding: 16,
  },
  imageContainer: {
    marginRight: 16,
    height: 85,
  },
  image: {
    borderRadius: 5,
    objectFit: "cover",
    objectPosition: "center",
  },
  fallbackImage: {
    width: 85,
    height: 85,
    borderRadius: 5,
    objectFit: "cover",
    objectPosition: "center",
  },
  tagInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0, // required for text-overflow to work
  },
  title: {
    ...theme.typography[isEAForum ? "headerStyle" : "headline"],
    fontSize: 16,
    lineHeight: "20px",
    fontWeight: isEAForum ? 600 : 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  postCount: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    lineHeight: "16px",
    marginTop: 4,
    color: theme.palette.grey[650],
  },
  subscribeButton: {
    marginTop: "auto",
  }
});

const CoreTagCard = ({tag, classes}: {
  tag: TagDetailsFragment
  classes: ClassesType,
}) => {
  const { CloudinaryImage2, SubscribeButton } = Components;

  const imageId = tag.squareImageId || tag.bannerImageId

  return (
    <div className={classes.root}>
      <div className={classes.imageContainer}>
        {imageId ? (
          <CloudinaryImage2 publicId={imageId} height={85} width={85} className={classes.image} />
        ) : (
          <img src={siteImageSetting.get()} className={classes.fallbackImage} />
        )}
      </div>
      <div className={classes.tagInfo}>
        <Link to={tagGetUrl(tag)} className={classes.title}>
          {tag.shortName || tag.name}
        </Link>
        <div className={classes.postCount}>{tag.postCount} posts</div>
        <div className={classes.subscribeButton}>
          <SubscribeButton
            subscribeMessage={"Subscribe"}
            unsubscribeMessage={"Subscribed"}
            tag={tag}
            showNotificationBell={false}
          />
        </div>
      </div>
    </div>
  );
}

const CoreTagCardComponent = registerComponent("CoreTagCard", CoreTagCard, {styles});

declare global {
  interface ComponentTypes {
    CoreTagCard: typeof CoreTagCardComponent
  }
}
