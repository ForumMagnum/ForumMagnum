import React, {useState, useMemo} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import withErrorBoundary from '../common/withErrorBoundary'
import Revisions from '../../lib/collections/revisions/collection';
import type { VoteWidgetOptions } from '../../lib/voting/votingSystems';

const styles = (theme: ThemeType): JssStyles => ({
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
  onHoverUser: (userId: string|null)=>void,
  classes: ClassesType,
}) => {
  const { Loading } = Components;
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
  const nonMissingContributors = contributorsList.filter(c => !!c.user);
  
  const hasLoadMore = !expandLoadMore && tag.contributors.totalCount > tag.contributors.contributors.length;
  
  return <div className={classes.root}>
    <div className={classes.contributorsHeading}>
      Contributors
    </div>
    
    {tag.contributors && nonMissingContributors.map(contributor =>
      <TagContributorRow
        key={contributor.user._id}
        contributor={contributor}
        tag={tag}
        onHover={onHoverUser}
        classes={classes}
      />
    )}
    {expandLoadMore && loadingMore && <Loading/>}
    {hasLoadMore && <div className={classes.loadMore}><a onClick={loadMore}>
      Load More
    </a></div>}
  </div>
}

const TagContributorRow = ({contributor, tag, onHover, classes}: {
  contributor: any, //FIXME typechecking hole
  tag: TagPageFragment|TagPageWithRevisionFragment,
  onHover: (userId: string|null)=>void,
  classes: ClassesType
}) => {
  const { UsersNameDisplay, LWTooltip, SmallSideVote } = Components;
  const displayKarmaOffset = contributor.contributionScore - contributor.mostRecentContribution?.baseScore;
  const voteWidgetOptions = useMemo(() => ({
    hideKarma: false,
    displayKarmaOffset,
  }), []);
  
  return <div
    className={classes.contributorRow}
    onMouseEnter={ev => {
      onHover(contributor.user._id);
    }}
    onMouseLeave={ev => {
      onHover(null);
    }}
  >
    {contributor.mostRecentContribution
      ? <SmallSideVote
          document={contributor.mostRecentContribution}
          collection={Revisions}
          options={voteWidgetOptions}
        />
      : <LWTooltip
          className={classes.contributorScore}
          placement="left"
          title={<span>
            {contributor.contributionScore} total points from {contributor.voteCount} votes on {contributor.numCommits} edits
          </span>}
        >
          {contributor.contributionScore}
        </LWTooltip>
    }
    <span className={classes.contributorName}>
      <UsersNameDisplay user={contributor.user} link={`/tag/${tag.slug}/history?user=${contributor.user.slug}`} />
    </span>
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


