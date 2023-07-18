import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useMulti } from '../../lib/crud/withMulti';
import { useTimezone } from '../common/withTimezone';
import moment from 'moment';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    minHeight: 250,
    paddingLeft: 40,
    borderLeft: theme.palette.border.normal,
    marginTop: 30,
    marginLeft: 50
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '10px',
    fontSize: 13,
    lineHeight: '18px',
    fontFamily: theme.typography.fontFamily,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12
  },
  resourceLink: {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  postTitle: {
    fontWeight: 600,
    marginBottom: 4
  },
  postMetadata: {
    color: theme.palette.grey[700]
  }
});

export const EAHomeSidebar = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking()
  const { timezone } = useTimezone()

  const now = moment().tz(timezone)
  const dateCutoff = now.subtract(7, 'days').format("YYYY-MM-DD")
  const { results: opportunityPosts } = useMulti({
    collectionName: "Posts",
    terms: {
      view: "magic",
      filterSettings: {tags: [{
        tagId: 'uRdzfbywnyQ6JkJqK', // TODO replace
        filterMode: 'Required'
      }]},
      after: dateCutoff,
      limit: 3
    },
    fragmentName: "PostsBase",
    fetchPolicy: "cache-and-network",
  })
  
  const { SectionTitle, PostsItemDate } = Components

  return <div className={classes.root}>
    <div className={classes.section}>
      <SectionTitle title="Resources" className={classes.sectionTitle} noTopMargin noBottomPadding />
      <Link to="/handbook" className={classes.resourceLink}>
        The EA Handbook
      </Link>
      <Link to="https://www.effectivealtruism.org/virtual-programs/introductory-program" className={classes.resourceLink}>
        The Introductory EA Program
      </Link>
      <Link to="/groups" className={classes.resourceLink}>
        Discover EA groups
      </Link>
    </div>
    
    <div className={classes.section}>
      <SectionTitle title="Opportunities" className={classes.sectionTitle} noTopMargin noBottomPadding />
      {opportunityPosts?.map(post => <div key={post._id} className={classes.post}>
        <div className={classes.postTitle}>
          <Link to={postGetPageUrl(post)}>
            {post.title}
          </Link>
        </div>
        <div className={classes.postMetadata}>
          Posted <PostsItemDate post={post} includeAgo />
        </div>
      </div>)}
    </div>
  </div>
}

const EAHomeSidebarComponent = registerComponent('EAHomeSidebar', EAHomeSidebar, {styles});

declare global {
  interface ComponentTypes {
    EAHomeSidebar: typeof EAHomeSidebarComponent
  }
}
