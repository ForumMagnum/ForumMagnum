import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import _sortBy from 'lodash/sortBy';
import { useCurrentUser } from '../common/withUser';
import { getTagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import TagsListItem from "./TagsListItem";
import SectionTitle from "../common/SectionTitle";
import SectionButton from "../common/SectionButton";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const TagPreviewFragmentMultiQuery = gql(`
  query multiTagAllTagsAlphabeticalQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagPreviewFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles("AllTagsAlphabetical", (theme: ThemeType) => ({
  root: {
    margin: "auto",
    maxWidth: 1000
  },
  alphabetical: {
    columns: 5,
    columnWidth: 225,
    columnGap: 0,
    background: theme.palette.panelBackground.default,
    padding: 20,
    marginBottom: 24,
    borderRadius: theme.borderRadius.default,
  }
}))

const AllTagsAlphabetical = () => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(TagPreviewFragmentMultiQuery, {
    variables: {
      selector: { allTagsHierarchical: {} },
      limit: 750,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.tags?.results;
  const currentUser = useCurrentUser()

  const alphabetical = _sortBy(results, tag=>tag.name)

  return (
    <div className={classes.root}>
      <SectionTitle
        title={`All Wikitags (${loading ? "loading" : results?.length})`}
        anchor={`all-wikitags`}
      >
        {tagUserHasSufficientKarma(currentUser, "new") &&
          <SectionButton>
            <AddBoxIcon/>
            <Link to={getTagCreateUrl()}>
              New Wikitag
            </Link>
          </SectionButton>
        }
      </SectionTitle>
      {loading && <Loading/>}
      <div className={classes.alphabetical}>
        {alphabetical.map(tag => <TagsListItem key={tag._id} tag={tag} postCount={6}/>)}
      </div>
    </div>
  );
}

export default AllTagsAlphabetical


