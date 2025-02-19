import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import classnames from 'classnames';
import { legacyBreakpoints } from '../../lib/utils/theme';
import { postGetCommentCount, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useUpdateContinueReading } from './useUpdateContinueReading';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: 28,
    
    [legacyBreakpoints.maxSmall]: {
      width: "100%",
    },
    
    "&:hover, &:visited, &:focus": {
      color: theme.palette.link.dim,
    },
    fontFamily: theme.typography.uiSecondary.fontFamily,
  },
  
  direction: {
    fontSize: "1.2rem",
    marginBottom: ".5em",
    fontWeight: 600,
  },
  
  postTitle: {
    fontSize: "1.4rem",
    marginBottom: ".5em",
    marginTop: 0,
    fontWeight: 500,
    
    // text-overflow: ellipsis;
    // overflow: hidden;
    // white-space: pre;
  },
  
  previous: {
    textAlign: "right",

    [legacyBreakpoints.maxSmall]: {
      textAlign: "left",
    }
  },
  
  meta: {
    color: theme.palette.text.dim,
    fontSize: 12,
  },
  
  metaEntry: {
    paddingRight: 10,
  },

  login: {
    position: "relative", // TODO: figure out more elegant way of doing this without weird CSS rituals
    top: theme.spacing.unit
  }
});

const BottomNavigationItem = ({direction, post, sequence, classes}: {
  direction: "Previous"|"Next",
  post: PostSequenceNavigation_nextPost|PostSequenceNavigation_prevPost,
  sequence: HasIdType|null,
  classes: ClassesType<typeof styles>,
}) => {
  const updateContinueReading = useUpdateContinueReading(post._id, sequence?._id);
  const { LoginToTrack } = Components
  const commentCount = postGetCommentCount(post) || "No"
  const url = postGetPageUrl(post, false, sequence?._id);
  
  return (
    <span>
      <Link onClick={() => updateContinueReading()} to={url}>
        <div className={classnames(
          classes.root,
          { [classes.previous]: direction==="Previous" }
        )}>
          <div className={classes.direction}>{direction}:</div>
          <div className={classes.postTitle}>{post.title}</div>
          <div className={classes.meta}>
            <span className={classes.metaEntry}>{commentCount} comments</span>
            <span className={classes.metaEntry}>{post.baseScore} karma</span>
          </div>
        </div>
      </Link>
      {direction==="Next" && <span className={classes.login}>
        <LoginToTrack />
      </span>}
    </span>
  )
};

const BottomNavigationItemComponent = registerComponent('BottomNavigationItem', BottomNavigationItem, {styles})

declare global {
  interface ComponentTypes {
    BottomNavigationItem: typeof BottomNavigationItemComponent
  }
}

