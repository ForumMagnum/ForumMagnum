import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import withErrorBoundary from '../common/withErrorBoundary'
import { preferredHeadingCase } from '../../themes/forumTheme';
import { filterWhereFieldsNotNull } from '@/lib/utils/typeGuardUtils';


const styles = (theme: ThemeType) => ({
  root: {
    fontSize: "1.16rem",
    fontFamily: theme.typography.fontFamily,
  },
  contributorsHeading: {
    paddingBottom: 12,
    paddingTop: 4,
  },
  contributorRow: {
    paddingLeft: 8,
    fontSize: "1.1rem",
    paddingTop: 6,
    paddingBottom: 6,
    color: theme.palette.grey[600],
    
    "&:hover, &:hover a": {
      color: theme.palette.text.maxIntensity,
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
    paddingTop: 8,
    color: theme.palette.grey[600],
  },
});

const TagContributorsList = ({tag, onHoverUser, classes}: {
  tag: TagPageFragment|TagPageWithRevisionFragment,
  onHoverUser?: (userId: string|null) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersNameDisplay, Loading, LWTooltip } = Components;
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
  
  // Filter out tag-contributor entries where the user is null (which happens
  // if the contribution is by a deleted account)
  const nonMissingContributors = filterWhereFieldsNotNull(contributorsList, 'user');
  
  const hasLoadMore = !expandLoadMore && tag.contributors.totalCount > tag.contributors.contributors.length;
  
  return <div className={classes.root}>
    <div className={classes.contributorsHeading}>
      Contributors
    </div>
    
    {tag.contributors && nonMissingContributors.map((contributor: {
      user: UsersMinimumInfo;
      contributionScore: number;
      numCommits: number;
      voteCount: number;
    }) => <div key={contributor.user._id} className={classes.contributorRow} >
      <LWTooltip
        className={classes.contributorScore}
        placement="left"
        title={<span>
          {contributor.contributionScore} total points from {contributor.voteCount} votes on {contributor.numCommits} edits
        </span>}
      >
        {contributor.contributionScore}
      </LWTooltip>
      <span className={classes.contributorName}
        onMouseEnter={ev => {
          onHoverUser?.(contributor.user._id);
        }}
        onMouseLeave={ev => {
          onHoverUser?.(null);
        }}
      >
        <UsersNameDisplay user={contributor.user}/>
      </span>
    </div>)}
    {expandLoadMore && loadingMore && <Loading/>}
    {hasLoadMore && <div className={classes.loadMore}><a onClick={loadMore}>
      {preferredHeadingCase("Load More")}
    </a></div>}
  </div>
}

const TagContributorsListComponent = registerComponent("TagContributorsList", TagContributorsList, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    TagContributorsList: typeof TagContributorsListComponent
  }
}
