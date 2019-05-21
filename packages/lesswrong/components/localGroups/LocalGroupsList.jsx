
import React from 'react';
import { registerComponent, Components, withList } from 'meteor/vulcan:core';
import Localgroups from '../../lib/collections/localgroups/collection.js';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  loadMore: {
    flexGrow: 1,
    textAlign: "left",
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  }
})

const LocalGroupsList = ({children, classes, results, count, loadMore, totalCount, loading, networkStatus, showNoResults=true, showLoadMore=true, showLoading=true, dimWhenLoading=false}) => {
  
  const { LocalGroupsItem, Loading, PostsNoResults, SectionFooter, LoadMore } = Components

  if (!results && loading) return <Loading />
  if ((results && !results.length) && showNoResults) return <PostsNoResults />

  const loadingMore = networkStatus === 2 || networkStatus === 1;

  return <div>
      {results && results.map((group) => <LocalGroupsItem key={group._id} group={group} />)}
      <SectionFooter>
        {(showLoadMore) &&
          <div className={classes.loadMore}>
            <LoadMore
              loadMore={loadMore}
              count={count}
              totalCount={totalCount}
            />
            { !dimWhenLoading && showLoading && loadingMore && <Loading />}
          </div>
        }
        { children }
      </SectionFooter>
    </div>
}

const options = {
  collection: Localgroups,
  queryName: 'localGroupsListQuery',
  fragmentName: 'localGroupsHomeFragment',
  enableTotal: false,
  enableCache: true,
  ssr: true
}

registerComponent('LocalGroupsList', LocalGroupsList, [withList, options], withStyles(styles, {name:"LocalGroupsList"}))
