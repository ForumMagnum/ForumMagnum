import React from 'react';
import { registerComponent, Components, useMulti } from 'meteor/vulcan:core';
import { Tags } from '../../lib/collections/tags/collection.js';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper.js';

const AllTagsPage = () => {
  const currentUser = useCurrentUser();
  const { results, loading } = useMulti({
    terms: {
      view: "allTagsAlphabetical",
    },
    collection: Tags,
    queryName: "allTagsPageQuery",
    fragmentName: "TagFragment",
    limit: 100,
    ssr: true,
  });
  const { SingleColumnSection, SectionTitle, Loading } = Components;
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Tags"/>
      {loading && <Loading/>}
      {results && results.map(tag => {
        return <div key={tag._id}>
          <Link to={`/tag/${tag.slug}`}>
            {tag.name}
          </Link>
        </div>
      })}
      {currentUser?.isAdmin && <Link to="/tag/create">Create New Tag</Link>}
    </SingleColumnSection>
  );
}

registerComponent("AllTagsPage", AllTagsPage);
