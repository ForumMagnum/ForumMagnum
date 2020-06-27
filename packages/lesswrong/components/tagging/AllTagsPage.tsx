import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';

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
  const { SingleColumnSection, TagsListItem, SectionTitle, SectionButton, Loading, LoadMore } = Components;
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Tags">
        {currentUser?.isAdmin && <SectionButton>
          <AddBoxIcon/>
          <Link to="/tag/create">New Tag</Link>
        </SectionButton>}
      </SectionTitle>
      {loading && <Loading/>}
      <div>
        {results && results.map(tag => {
          return <div key={tag._id}>
              <TagsListItem tag={tag} />
            </div>
        })}
        {results && !results.length && <div>
          There aren't any tags yet.
        </div>}
      </div>
      <LoadMore {...loadMoreProps}/>
    </SingleColumnSection>
  );
}

const AllTagsPageComponent = registerComponent("AllTagsPage", AllTagsPage);

declare global {
  interface ComponentTypes {
    AllTagsPage: typeof AllTagsPageComponent
  }
}
