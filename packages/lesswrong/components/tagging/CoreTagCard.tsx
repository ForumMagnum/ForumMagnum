import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { siteImageSetting } from '../vulcan-core/App';

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
    height: 100,
  },
  image: {
    borderRadius: 5,
    objectFit: "cover",
    objectPosition: "center",
  },
  fallbackImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    objectFit: "cover",
    objectPosition: "center",
  },
  tagInfo: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    ...theme.typography.headline,
    fontSize: 16,
    lineHeight: "20px",
    fontWeight: 700,
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
  tag: TagFragment
  classes: ClassesType,
}) => {
  const { CloudinaryImage2, SubscribeButton } = Components;

  return (
    <div className={classes.root}>
      <div className={classes.imageContainer}>
        {tag.bannerImageId ? (
          //, TODO: note that 85 -> 100 to allow for text wrapping
          <CloudinaryImage2 publicId={tag.bannerImageId} height={100} width={100} className={classes.image} />
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
          {/* TODO possibly redesign this button */}
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
