import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import _sortBy from 'lodash/sortBy';

const styles = theme => ({
  root: {
    margin: "auto",
    maxWidth: 900
  },
  alphabetical: {
    display: "flex",
    flexWrap: "wrap",
    background: "white",
    padding: 20,
    marginBottom: 24  
  }
})

const AllTagsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { results, loading, loadMoreProps } = useMulti({
    terms: {
      view: "allTagsHierarchical",
    },
    collection: Tags,
    fragmentName: "TagPreviewFragment",
    limit: 200,
    ssr: true,
  });
  const { TagsListItem, TagsDetailsItem, SectionTitle, SectionButton, Loading, LoadMore } = Components;
  
  const alphabetical = _sortBy(results, tag=>tag.name)

  return (
    <div className={classes.root}>
      <SectionTitle title={`All Tags (${results?.length})`}>
        {currentUser?.isAdmin && <SectionButton>
          <AddBoxIcon/>
          <Link to="/tag/create">New Tag</Link>
        </SectionButton>}
      </SectionTitle>
      {loading && <Loading/>}
      <div className={classes.alphabetical}>
        {alphabetical.map(tag => <TagsListItem key={tag._id} tag={tag}/>)}
      </div>
      <SectionTitle title="Tag Details"/>
      <Table>
        <TableBody>
          {results && results.map(tag => {
            return <TagsDetailsItem key={tag._id} tag={tag} />
          })}
          {results && !results.length && <div>
            There aren't any tags yet.
          </div>}
        </TableBody>
      </Table>
      <LoadMore {...loadMoreProps}/>
    </div>
  );
}

const AllTagsPageComponent = registerComponent("AllTagsPage", AllTagsPage, {styles});

declare global {
  interface ComponentTypes {
    AllTagsPage: typeof AllTagsPageComponent
  }
}
