import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import _sortBy from 'lodash/sortBy';
import { userCanCreateTags } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import TagsListItem from "./TagsListItem";
import SectionTitle from "../common/SectionTitle";
import SectionButton from "../common/SectionButton";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

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

const styles = (theme: ThemeType) => ({
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
})

const AllTagsAlphabetical = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
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
        title={`All ${taggingNamePluralCapitalSetting.get()} (${loading ? "loading" : results?.length})`}
        anchor={`all-${taggingNamePluralSetting.get()}`}
      >
        {userCanCreateTags(currentUser) && tagUserHasSufficientKarma(currentUser, "new") &&
          <SectionButton>
            <AddBoxIcon/>
            <Link to={tagCreateUrl}>
              New {taggingNameCapitalSetting.get()}
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

export default registerComponent("AllTagsAlphabetical", AllTagsAlphabetical, {styles});


