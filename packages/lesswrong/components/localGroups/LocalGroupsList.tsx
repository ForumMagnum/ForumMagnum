import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { createStyles } from '@material-ui/core/styles'

const styles = createStyles((theme: ThemeType): JssStyles => ({
  loadMore: {
    flexGrow: 1,
    textAlign: "left",
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  },
  localGroups: {
    boxShadow: theme.boxShadow
  }
}))

const LocalGroupsList = ({terms, children, classes, showNoResults=true, showLoadMore=true, showLoading=true, dimWhenLoading=false}: {
  terms: LocalgroupsViewTerms,
  children?: React.ReactNode,
  classes: ClassesType,
  showNoResults?: boolean,
  showLoadMore?: boolean,
  showLoading?: boolean,
  dimWhenLoading?: boolean,
}) => {
  const { results, count, loadMore, totalCount, loading, loadingMore } = useMulti({
    terms,
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    enableTotal: false,
  });
  const { LocalGroupsItem, Loading, PostsNoResults, SectionFooter, LoadMore } = Components

  if (!results && loading) return <Loading />
  if ((results && !results.length) && showNoResults) return <PostsNoResults />

  return <div>
      <div className={classes.localGroups}>
        {results && results.map((group) => <LocalGroupsItem key={group._id} group={group} />)}
      </div>
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

const LocalGroupsListComponent = registerComponent('LocalGroupsList', LocalGroupsList, {styles})

declare global {
  interface ComponentTypes {
    LocalGroupsList: typeof LocalGroupsListComponent
  }
}

