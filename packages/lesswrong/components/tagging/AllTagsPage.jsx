import React from 'react';
import { registerComponent, Components, useMulti } from 'meteor/vulcan:core';
import { Tags } from '../../lib/collections/tags/collection.js';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AddBoxIcon from '@material-ui/icons/AddBox';

const styles = theme => ({
  tag: {
    display: "list-item",
  },
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
  const { SingleColumnSection, SectionTitle, SectionButton, Loading } = Components;
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Tags">
        {currentUser?.isAdmin && <SectionButton>
          <AddBoxIcon/>
          <Link to="/tag/create">New Tag</Link>
        </SectionButton>}
      </SectionTitle>
      {loading && <Loading/>}
      {results && <ul>{results.map(tag => {
        return <Typography key={tag._id} variant="body2" component="li" className={classes.tag}>
          <Link to={`/tag/${tag.slug}`}>
            {tag.name} ({tag.postCount})
          </Link>
        </Typography>
      })}</ul>}
      {results && !results.length && <div>
        There aren't any tags yet.
      </div>}
    </SingleColumnSection>
  );
}

registerComponent("AllTagsPage", AllTagsPage,
  withStyles(styles, {name: "AllTagsPage"}));
