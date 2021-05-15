import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagContributorsList = ({tag, classes}: {
  tag: TagPageFragment|TagPageWithRevisionFragment,
  classes: ClassesType,
}) => {
  const { UsersNameDisplay, Loading } = Components;
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
  
  return <div>
    <div>Contributors</div>
    <ul>
      {tag.contributors && contributorsList.map(contributor => <li key={contributor.user._id}>
        <UsersNameDisplay user={contributor.user}/>
        {" ("}{contributor.contributionScore})
      </li>)}
      {expandLoadMore && loadingMore && <Loading/>}
      {hasLoadMore && <li><a onClick={loadMore}>Load More</a></li>}
    </ul>
  </div>
}

const TagContributorsListComponent = registerComponent("TagContributorsList", TagContributorsList, {styles});

declare global {
  interface ComponentTypes {
    TagContributorsList: typeof TagContributorsListComponent
  }
}


