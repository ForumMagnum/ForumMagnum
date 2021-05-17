import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontSize: "1.16rem",
    fontFamily: theme.typography.fontFamily,
  },
  contributorsHeading: {
    paddingBottom: 12,
  },
  contributorRow: {
    paddingLeft: 8,
    fontSize: "1.1rem",
    paddingTop: 6,
    paddingBottom: 6,
    color: theme.palette.grey[600],
    
    "&:hover, &:hover a": {
      color: "black",
    },
  },
  contributorScore: {
    display: "inline-block",
    width: 24,
    textAlign: "center",
  },
  contributorName: {
  },
  loadMore: {
    paddingTop: 6,
    color: theme.palette.grey[600],
  },
});

const TagContributorsList = ({tag, onHoverUser, classes}: {
  tag: TagPageFragment|TagPageWithRevisionFragment,
  onHoverUser: (userId: string|null)=>void,
  classes: ClassesType,
}) => {
  const { UsersNameDisplay, TableOfContentsRow, Loading } = Components;
  const [expandLoadMore,setExpandLoadMore] = useState(false);
  
  const {document: tagWithExpandedList, loading: loadingMore} = useSingle({
    documentId: tag._id,
    collectionName: "Tags",
    fragmentName: "TagFullContributorsList",
    skip: !expandLoadMore,
  });
  const expandedList = tagWithExpandedList?.contributors?.contributors;
  const loadMore = () => setExpandLoadMore(true);
  
  const contributorsList = expandedList || tag.contributors.contributors;
  const hasLoadMore = !expandLoadMore && tag.contributors.totalCount > tag.contributors.contributors.length;
  
  return <div className={classes.root}>
    <div className={classes.contributorsHeading}>
      Contributors
    </div>
    
    {tag.contributors && contributorsList.map(contributor => <div key={contributor.user._id} className={classes.contributorRow} >
      <span className={classes.contributorScore}>
        {contributor.contributionScore}
      </span>
      <span className={classes.contributorName}
        onMouseEnter={ev => {
          onHoverUser(contributor.user._id);
        }}
        onMouseLeave={ev => {
          onHoverUser(null);
        }}
      >
        <UsersNameDisplay user={contributor.user}/>
      </span>
    </div>)}
    {expandLoadMore && loadingMore && <Loading/>}
    {hasLoadMore && <div className={classes.loadMore}><a onClick={loadMore}>
      Load More
    </a></div>}
  </div>
}

const TagContributorsListComponent = registerComponent("TagContributorsList", TagContributorsList, {styles});

declare global {
  interface ComponentTypes {
    TagContributorsList: typeof TagContributorsListComponent
  }
}


