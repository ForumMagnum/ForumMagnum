import React, { ReactNode } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  localGroups: {
    boxShadow: theme.palette.boxShadow.default,
  }
});

const LocalGroupsListInner = ({terms, children, classes, showNoResults=true, heading}: {
  terms: LocalgroupsViewTerms,
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
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

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
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

export const LocalGroupsList = registerComponent('LocalGroupsList', LocalGroupsListInner, {styles})

declare global {
  interface ComponentTypes {
    LocalGroupsList: typeof LocalGroupsList
  }
}
