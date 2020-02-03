import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import Typography from '@material-ui/core/Typography';
import AddBoxIcon from '@material-ui/icons/AddBox';

const styles = theme => ({
  tag: {
    display: "fle",
  },
  count: {
    color: theme.palette.grey[600],
    fontSize: "1rem",
    position: "relative",
  }
});

const AllTagsPage = ({classes}) => {
  const currentUser = useCurrentUser();
  const { results, loading } = useMulti({
    terms: {
      view: "allTagsAlphabetical",
    },
    collection: Tags,
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
            {tag.name} {tag.postCount && <span className={classes.count}>({tag.postCount})</span>}
          </Link>
        </Typography>
      })}</ul>}
      {results && !results.length && <div>
        There aren't any tags yet.
      </div>}
    </SingleColumnSection>
  );
}

const AllTagsPageComponent = registerComponent("AllTagsPage", AllTagsPage, {styles});

declare global {
  interface ComponentTypes {
    AllTagsPage: typeof AllTagsPageComponent
  }
}
