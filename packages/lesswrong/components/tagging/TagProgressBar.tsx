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
    marginRight: "auto"
  },
  link: {
    color: theme.palette.primary.main
  },
  text: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
    alignItems: "center"
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

  if (!untaggedTotal || !postsTotal) return null

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
              <Link className={classes.link} to={"/allPosts?filter=untagged&timeframe=allTime&sortBy=top"}>
                Tag Posts
              </Link>
            </PostsItem2MetaInfo>
          </LWTooltip>
          <SeparatorBullet/>
          <LWTooltip title={<div>
            <div>View top posts that have been given generic core-tags, but could use more specific tags</div>
            <div><em>(Click through to read posts, and then search for tags that will help users find specific, relevant content)</em></div>
          </div>}>
            <PostsItem2MetaInfo>
              <Link className={classes.link} to={"/allPosts?filter=unNonCoreTagged&timeframe=allTime&sortBy=top"}>
                Improve Post Tags
              </Link>
            </PostsItem2MetaInfo>
          </LWTooltip>
        </div>
        <LWTooltip 
          className={classes.tooltip}
          title={<div>
            <div>{(postsTotal - untaggedTotal)} out of {postsTotal} posts have been tagged</div>
            <div><em>(Filtered for 25+ karma)</em></div>
          </div>}
        >
          <LinearProgress variant="determinate" value={((postsTotal - untaggedTotal)/postsTotal)*100} />
        </LWTooltip>
        <div className={classes.secondaryInfo}>
          <div className={classes.helpText}>
            {(postsTotal - untaggedTotal)} out of {postsTotal} posts with more than 25 karma have been tagged
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

