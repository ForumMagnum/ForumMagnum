import React, { ReactNode } from 'react';
import LocalGroupsItem from "./LocalGroupsItem";
import Loading from "../vulcan-core/Loading";
import PostsNoResults from "../posts/PostsNoResults";
import SectionFooter from "../common/SectionFooter";
import LoadMore from "../common/LoadMore";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { localGroupMatchesSearch } from './localGroupSearch';

const localGroupsHomeFragmentMultiQuery = gql(`
  query multiLocalgroupLocalGroupsListQuery($selector: LocalgroupSelector, $limit: Int, $enableTotal: Boolean) {
    localgroups(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...localGroupsHomeFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('LocalGroupsList', (theme: ThemeType) => ({
  localGroups: {
    boxShadow: theme.palette.boxShadow.default,
  },
  noSearchResults: {
    color: theme.palette.text.dim4,
    ...theme.typography.italic,
  }
}));

const LocalGroupsList = <View extends keyof LocalgroupSelector>({view, terms, limit, children, showNoResults=true, heading, searchQuery}: {
  view: View,
  terms: { [k in keyof LocalgroupSelector]: LocalgroupSelector[k] }[View],
  limit?: number,
  children?: React.ReactNode,
  showNoResults?: boolean,
  heading?: string,
  searchQuery?: string,
}) => {
  const classes = useStyles(styles);
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(localGroupsHomeFragmentMultiQuery, {
    variables: {
      selector: { [view]: terms },
      limit: limit ?? 10,
      enableTotal: false,
    },
  });

  const results = data?.localgroups?.results;
  const filteredResults = searchQuery
    ? results?.filter(group => localGroupMatchesSearch(group, searchQuery))
    : results;

  if (!results && loading) return <Loading />

  if (results?.length && !filteredResults?.length) {
    return <div className={classes.noSearchResults}>No groups match your search.</div>
  }

  // if we are given a section title/heading,
  // then we can make sure to hide it when showNoResults is false and there are no results to show
  if (!filteredResults || !filteredResults.length) {
    return showNoResults ? 
      <MaybeTitleWrapper heading={heading}><PostsNoResults /></MaybeTitleWrapper> :
      null
  }

  return <MaybeTitleWrapper heading={heading}>
    <div>
      <div className={classes.localGroups}>
        {filteredResults.map((group) => <LocalGroupsItem key={group._id} group={group} />)}
      </div>
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles/>
        { children }
      </SectionFooter>
    </div>
  </MaybeTitleWrapper>;
}

const MaybeTitleWrapper = ({heading, children}: { heading?: string, children: ReactNode }) => {
  if (heading) {
    return <SingleColumnSection>
      <SectionTitle title={heading} />
      {children}
    </SingleColumnSection>
  } else {
    return <>{children}</>;
  }
}

export default LocalGroupsList;
