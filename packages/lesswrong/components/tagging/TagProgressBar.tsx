import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Link } from '../../lib/reactRouterWrapper';

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

  const { totalCount: taggedTotal } = useMulti({
    terms: {
      view: "tagProgressTagged",
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

  if (!taggedTotal || !postsTotal) return null

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
            <div>{taggedTotal} out of {postsTotal} posts have been tagged</div>
            <div><em>(Filtered for 25+ karma)</em></div>
          </div>}
        >
          <LinearProgress variant="buffer" value={(taggedTotal/postsTotal)*100} />
      </LWTooltip>
      </div>
  </div>
}

const TagProgressBarComponent = registerComponent("TagProgressBar", TagProgressBar, {styles, hocs:[withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagProgressBar: typeof TagProgressBarComponent
  }
}

