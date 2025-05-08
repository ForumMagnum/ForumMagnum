import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import _sortBy from 'lodash/sortBy';
import { userCanCreateTags } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { TagsListItem } from "./TagsListItem";
import { SectionTitle } from "../common/SectionTitle";
import { SectionButton } from "../common/SectionButton";
import { Loading } from "../vulcan-core/Loading";

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

const AllTagsAlphabeticalInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "allTagsHierarchical",
    },
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    limit: 750,
  });
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

export const AllTagsAlphabetical = registerComponent("AllTagsAlphabetical", AllTagsAlphabeticalInner, {styles});

declare global {
  interface ComponentTypes {
    AllTagsAlphabetical: typeof AllTagsAlphabetical
  }
}
