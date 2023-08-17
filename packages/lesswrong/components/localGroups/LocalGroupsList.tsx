import React, { ReactNode } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { createStyles } from '@material-ui/core/styles'

const styles = createStyles((theme: ThemeType): JssStyles => ({
  localGroups: {
    boxShadow: theme.palette.boxShadow.default,
  }
}))

const LocalGroupsList = ({terms, children, classes, showNoResults=true, heading}: {
  terms: LocalgroupsViewTerms,
  children?: React.ReactNode,
  classes: ClassesType,
  showNoResults?: boolean,
  heading?: string,
}) => {
  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    enableTotal: false,
  });
  const { LocalGroupsItem, Loading, PostsNoResults, SectionFooter, LoadMore, SingleColumnSection, SectionTitle } = Components

  const MaybeTitleWrapper = ({children}: { children: ReactNode }) => heading ?
    <SingleColumnSection>
      <SectionTitle title={heading} />
      {children}
    </SingleColumnSection> :
    <>{children}</>;

  if (!results && loading) return <Loading />

  // if we are given a section title/heading,
  // then we can make sure to hide it when showNoResults is false and there are no results to show
  if (!results || !results.length) {
    return showNoResults ? 
      <MaybeTitleWrapper><PostsNoResults /></MaybeTitleWrapper> :
      null
  }

  return <MaybeTitleWrapper>
    <div>
      <div className={classes.localGroups}>
        {results.map((group) => <LocalGroupsItem key={group._id} group={group} />)}
      </div>
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles/>
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
