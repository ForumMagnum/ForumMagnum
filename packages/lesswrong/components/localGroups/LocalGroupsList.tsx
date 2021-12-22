import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { createStyles } from '@material-ui/core/styles'

const styles = createStyles((theme: ThemeType): JssStyles => ({
  loadMore: {
    flexGrow: 1,
    textAlign: "left",
    '&:after': {
      content: "'' !important",
      marginLeft: "0 !important",
      marginRight: "0 !important",
    }
  },
  localGroups: {
    boxShadow: theme.boxShadow
  }
}))

const LocalGroupsList = ({terms, children, classes, showNoResults=true, heading}: {
  terms: LocalgroupsViewTerms,
  children?: React.ReactNode,
  classes: ClassesType,
  showNoResults?: boolean,
  heading?: string,
}) => {
  const { results, count, loadMore, totalCount, loading, loadingMore, loadMoreProps } = useMulti({
    terms,
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    enableTotal: false,
  });
  const { LocalGroupsItem, Loading, PostsNoResults, SectionFooter, LoadMore, SingleColumnSection, SectionTitle } = Components

  const MaybeTitleWrapper = ({children}) => heading ?
    <SingleColumnSection>
      <SectionTitle title={heading} />
      {children}
    </SingleColumnSection> :
    children;

  if (!results && loading) return <Loading />
  if (results && !results.length) {
    return showNoResults ? 
      <MaybeTitleWrapper><PostsNoResults /></MaybeTitleWrapper> :
      null
  }

  return <MaybeTitleWrapper>
    <div>
      <div className={classes.localGroups}>
        {results && results.map((group) => <LocalGroupsItem key={group._id} group={group} />)}
      </div>
      <SectionFooter>
        <div className={classes.loadMore}>
          <LoadMore {...loadMoreProps} />
        </div>
        { children }
      </SectionFooter>
    </div>
  </MaybeTitleWrapper>;
}

const LocalGroupsListComponent = registerComponent('LocalGroupsList', LocalGroupsList, {styles})

declare global {
  interface ComponentTypes {
    LocalGroupsList: typeof LocalGroupsListComponent
  }
}

