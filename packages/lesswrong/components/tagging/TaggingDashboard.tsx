import React from 'react';
import { TagFlags } from '../../lib';
import { Tags } from '../../lib/collections/tags/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';

const SECTION_WIDTH = 960

const styles = theme => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    maxWidth: SECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    [theme.breakpoints.up('md')]: {
      width: SECTION_WIDTH // TODO: replace this hacky solution with a more comprehensive refactoring of SingleColumnSection. 
      // (SingleColumnLayout should probably be replaced by grid-css in Layout.tsx)
    }
  },
  flagList: {
    marginBottom: 8
  },
  editButton: {
    marginLeft: 8
  }
})

const TaggingDashboard = ({classes}) => {
  const { SectionTitle, TagsDetailsItem, SectionButton, TagFlagItem, NewTagsList } = Components
  const { query } = useLocation();
  const currentUser = useCurrentUser();
  const { results: tags, loading} = useMulti({
    terms: {
      view: "tagsByTagFlag",
      tagFlagId: query.focus
    },
    collection: Tags,
    fragmentName: "TagWithFlagsFragment",
    limit: 100,
    itemsPerPage: 100,
    ssr: true
  });

  const { results: tagFlags } = useMulti({
    terms: {
      view: "allTagFlags"
    },
    collection: TagFlags,
    fragmentName: "TagFlagFragment",
    limit: 100,
    ssr: true
  });
  
  const { openDialog } = useDialog();

  return <div className={classes.root}>
    <SectionTitle title="Twiki Dashboard"/>
    <NewTagsList />
    <SectionTitle title="Tags in Need of Work">
      <SectionButton>
        {query.focus && <QueryLink query={{}}> Reset Filter </QueryLink>}
        {currentUser?.isAdmin && 
            <span className={classes.editButton} onClick={() => openDialog({
              componentName: "TagFlagEditAndNewForm", 
              componentProps: query.focus ? {tagFlagId: query.focus} : {}
            })}>
              {query.focus ? "Edit Tag Flag" : "New Tag Flag"}
            </span>
        }
      </SectionButton>
    </SectionTitle>
    <div className={classes.flagList}>
      {tagFlags?.map(tagFlag => <QueryLink key={tagFlag._id} query={query.focus === tagFlag._id ? {} : {focus: tagFlag._id}}>
        <TagFlagItem documentId={tagFlag._id} style={query.focus === tagFlag._id ? "black" : "grey"} />
      </QueryLink>)}
    </div>    
    {!loading && tags?.map(tag => <TagsDetailsItem 
      key={tag._id} 
      tag={tag} 
      showFlags
      flagId={query.focus}
    />)}
  </div>
}


const TaggingDashboardComponent = registerComponent("TaggingDashboard", TaggingDashboard, { styles });

declare global {
  interface ComponentTypes {
    TaggingDashboard: typeof TaggingDashboardComponent
  }
}
