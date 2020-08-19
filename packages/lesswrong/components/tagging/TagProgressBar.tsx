import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Link } from '../../lib/reactRouterWrapper';
import Users from '../../lib/collections/users/collection';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useMessages } from '../common/withMessages';

const styles = theme => ({
  root: {
    background: "white",
    padding: 10,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: "1.3rem",
    boxShadow: theme.boxShadow,
    ...theme.typography.postStyle
  },
  secondaryInfo: {
    display: 'flex',
    ...theme.typography.commentStyle,
    justifyContent: 'space-between',
    fontSize: '1rem',
    color: 'rgba(0,0,0,0.55)',
    marginTop: 8
  },
  helpText: {
  },
  hideButton: {
  },
  inner: {
    width: "100%",
  },
  tooltip: {
    display: "block"
  },
  title: {
    flexGrow: 1,
    flexBasis: 1,
    marginRight: "auto"
  },
  allTagsBarColor: {
    color: theme.palette.primary.main
  },
  personalLink: {
    color: theme.palette.grey[600]
  },
  text: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
    alignItems: "center"
  },
  barRoot: {
    marginBottom: 5,
  },
  bar2: {
    backgroundColor: theme.palette.grey[600]
  },
  bar2Background: {
    backgroundColor: "rgba(0,0,0,.1)"
  }

});

const TagProgressBar = ({classes}: {
  classes: ClassesType,
}) => {

  const { LWTooltip, PostsItem2MetaInfo, SeparatorBullet } = Components;
  const currentUser = useCurrentUser();
  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });
  const { openDialog } = useDialog();
  const { flash } = useMessages();

  const { totalCount: untaggedTotal } = useMulti({
    terms: {
      view: "tagProgressUntagged",
      limit: 0
    },
    collection: Posts,
    fragmentName: 'PostTagRelevance',
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const { totalCount: postsTotal } = useMulti({
    terms: {
      view: "tagProgressPosts",
      limit: 0
    },
    collection: Posts,
    fragmentName: 'PostTagRelevance',
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const { totalCount: untaggedPersonalTotal } = useMulti({
    terms: {
      view: "personalTagProgressUntagged",
      userId: currentUser?._id,
      limit: 0
    },
    collection: Posts,
    fragmentName: 'PostTagRelevance',
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const { totalCount: personalPostsTotal } = useMulti({
    terms: {
      view: "personalTagProgressPosts",
      userId: currentUser?._id,
      limit: 0
    },
    collection: Posts,
    fragmentName: 'PostTagRelevance',
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const hideClickHandler = async () => {
    if (currentUser) {
      await updateUser({
        selector: { _id: currentUser._id},
        data: {
          hideTaggingProgressBar: true
        },
      })
      flash({
        messageString: "Hid tagging progress bar from the frontpage",
        type: "success",
        action: () => void updateUser({
          selector: { _id: currentUser._id},
          data: {
            hideTaggingProgressBar: false
          },
        })
      })
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    }
  }

  if (untaggedTotal == undefined || postsTotal == undefined) return null

  const showPersonalBar = !!(currentUser && personalPostsTotal && untaggedPersonalTotal)
  const userHasPosts = !!(currentUser && personalPostsTotal)

  const personalBarTooltip = untaggedPersonalTotal ? `Tagging Progress (your posts) (${untaggedPersonalTotal} remaining out of ${personalPostsTotal})` : "All your posts have been tagged."
  const allPostsTooltip = untaggedTotal ? `Tagging Progress (all posts) (${untaggedTotal} remaining out of ${postsTotal})` : "All posts with 25+ karma have been tagged!"

  return <div className={classes.root}>
      <div className={classes.inner}>
        <div className={classes.text}>
          <Link className={classes.title} to={"/posts/uqXQAWxLFW8WgShtk/open-call-for-taggers"}>
            Tagging Progress
          </Link>
          <LWTooltip title={<div>
            <div>View all completely untagged posts, sorted by karma</div>
            <div><em>(Click through to read posts, and then tag them)</em></div>
          </div>}>
            <PostsItem2MetaInfo>
              <Link className={classes.allTagsBarColor} to={"/allPosts?filter=untagged&timeframe=allTime&sortedBy=top&karmaThreshold=25"}>
                Tag Untagged Posts
              </Link>
            </PostsItem2MetaInfo>
          </LWTooltip>
          {userHasPosts && <SeparatorBullet/>}
          {userHasPosts && <LWTooltip title={<div>
            <div>View your own untagged posts.</div>
            <div><em>(Click through to your user profile to review posts, and then tag them)</em></div>
          </div>}>
            <PostsItem2MetaInfo>
              <Link className={classes.personalLink} to={`/users/${currentUser.slug}?filter=untagged&karmaThreshold=25`}>
                Tag My Posts
              </Link>
            </PostsItem2MetaInfo>
          </LWTooltip>}
        </div>
        <LWTooltip className={classes.tooltip} title={allPostsTooltip}>
          <LinearProgress 
            classes={{root: classes.barRoot}} 
            variant="determinate" 
            value={((postsTotal - untaggedTotal)/postsTotal)*100} 
          />
        </LWTooltip>

        {showPersonalBar && 
          <LWTooltip className={classes.tooltip} title={personalBarTooltip}>
            <LinearProgress 
              classes={{bar: classes.bar2, colorSecondary: classes.bar2Background}}     
              variant="determinate" 
              color="secondary" 
              value={((personalPostsTotal - untaggedPersonalTotal)/personalPostsTotal)*100} 
            />
          </LWTooltip>
        }
        <div className={classes.secondaryInfo}>
          <div className={classes.helpText}>
            <span className={classes.allTagsBarColor}>{untaggedTotal} posts with 25+ karma still need a tag.{" "} </span>
            {userHasPosts && <span>({untaggedPersonalTotal} of your own posts)</span>}
          </div>
          <LWTooltip title={"Hide this progress bar from the frontpage"}>
            <a 
              className={classes.hideButton}
              onClick={hideClickHandler}
            > 
              Hide 
            </a>
          </LWTooltip>
        </div>
      </div>
  </div>
}

const TagProgressBarComponent = registerComponent("TagProgressBar", TagProgressBar, {styles, hocs:[withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagProgressBar: typeof TagProgressBarComponent
  }
}

