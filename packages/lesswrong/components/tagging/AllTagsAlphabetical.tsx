import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import _sortBy from 'lodash/sortBy';
import { userCanCreateTags } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';

const styles = theme => ({
  root: {
    margin: "auto",
    maxWidth: 1000
  },
  alphabetical: {
    columns: 5,
    columnWidth: 225,
    columnGap: 0,
    background: "white",
    padding: 20,
    marginBottom: 24  
  }
})

const AllTagsAlphabetical = ({classes}: {
  classes: ClassesType,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "allTagsHierarchical",
    },
    collection: Tags,
    fragmentName: "TagPreviewFragment",
    limit: 500,
    ssr: true,
  });
  const { TagsListItem, SectionTitle, SectionButton, Loading } = Components;
  const currentUser = useCurrentUser()
  
  const alphabetical = _sortBy(results, tag=>tag.name)

  return (
    <div className={classes.root}>
      <SectionTitle title={`All Tags (${results?.length || "loading"})`}>
        {userCanCreateTags(currentUser) && <SectionButton>
          <AddBoxIcon/>
          <Link to="/tag/create">New Tag</Link>
        </SectionButton>}
      </SectionTitle>
      {loading && <Loading/>}
      <div className={classes.alphabetical}>
        {alphabetical.map(tag => <TagsListItem key={tag._id} tag={tag}/>)}
      </div>
    </div>
  );
}

const AllTagsAlphabeticalComponent = registerComponent("AllTagsAlphabetical", AllTagsAlphabetical, {styles});

declare global {
  interface ComponentTypes {
    AllTagsAlphabetical: typeof AllTagsAlphabeticalComponent
  }
}
