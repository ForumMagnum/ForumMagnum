import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';

const styles = theme => ({
  root: {
    margin: "auto",
    maxWidth: 900
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
  const { TagsListItem, SectionTitle, SectionButton, Loading, LoadMore } = Components;
  
  return (
    <div className={classes.root}>
      <SectionTitle title="All Tags">
        {currentUser?.isAdmin && <SectionButton>
          <AddBoxIcon/>
          <Link to="/tag/create">New Tag</Link>
        </SectionButton>}
      </SectionTitle>
      {loading && <Loading/>}
      <Table>
        <TableBody>
          {results && results.map(tag => {
            return <TagsListItem key={tag._id} tag={tag} />
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
