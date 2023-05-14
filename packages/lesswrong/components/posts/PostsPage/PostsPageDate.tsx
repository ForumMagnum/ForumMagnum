import React from 'react';
import { isEAForum } from '../../../lib/instanceSettings';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { ExpandedDate } from '../../common/FormatDate';

const styles = (theme: ThemeType): JssStyles => ({
  date: {
    color: theme.palette.text.dim3,
    fontSize: isEAForum ? undefined : theme.typography.body2.fontSize,
    cursor: 'default'
  },
  mobileDate: {
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
  }
});

const PostsPageDate = ({ post, hasMajorRevision, classes }: {
  post: PostsBase,
  hasMajorRevision: boolean,
  classes: ClassesType,
}) => {
  const { FormatDate, PostsRevisionSelector, LWTooltip } = Components;
  
  const tooltip = (<div>
    <div>Posted on <ExpandedDate date={post.postedAt}/></div>
    
    {post.curatedDate && <div>
      Curated on <ExpandedDate date={post.curatedDate}/>
    </div>}
  </div>);

  if (hasMajorRevision) {
    return (
      <span className={classes.date}>
        <PostsRevisionSelector format="Do MMM YYYY" post={post}/>
      </span>
    )
  }
  
  return (<React.Fragment>
    <LWTooltip title={tooltip} placement="bottom">
        <span className={classes.date}>
          <FormatDate date={post.postedAt} format={isEAForum ? "D MMM YYYY" : "Do MMM YYYY"} tooltip={false} />
        </span>
    </LWTooltip>
  </React.Fragment>);
}

const PostsPageDateComponent = registerComponent("PostsPageDate", PostsPageDate, {styles});

declare global {
  interface ComponentTypes {
    PostsPageDate: typeof PostsPageDateComponent
  }
}
