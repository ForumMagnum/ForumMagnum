import React from 'react';
import { registerComponent, Components, useMulti } from 'meteor/vulcan:core';
import { Tags } from '../../lib/collections/tags/collection.js';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  tag: {},
  createTagButton: {},
});

const AllTagsPage = ({classes}) => {
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
      {results && <ul>{results.map(tag => {
        return <li key={tag._id} className={classes.tag}>
          <Link to={`/tag/${tag.slug}`}>
            {tag.name} ({tag.postCount})
          </Link>
        </li>
      })}</ul>}
      {currentUser?.isAdmin && <Link className={classes.createTagButton} to="/tag/create">Create New Tag</Link>}
    </SingleColumnSection>
  );
}

registerComponent("AllTagsPage", AllTagsPage,
  withStyles(styles, {name: "AllTagsPage"}));
