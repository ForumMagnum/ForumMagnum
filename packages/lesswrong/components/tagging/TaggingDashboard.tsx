import React, { useState } from 'react';
import { TagFlags } from '../../lib';
import { Tags } from '../../lib/collections/tags/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';

const SECTION_WIDTH = 960

const styles = (theme: ThemeType): JssStyles => ({
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
  },
  collapseButton: {
    marginLeft: 8
  },
  loadMore: {
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: -4
  },
})

const TaggingDashboard = ({classes}: {
  classes: ClassesType
}) => {
  const { SectionTitle, TagsDetailsItem, SectionButton, TagFlagItem, TagFlagAllPagesItem, NewTagsList, LoadMore, Loading } = Components
  const { query } = useLocation();
  const currentUser = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false)
  const multiTerms = query.focus === "allPages" ? {view: "allPagesByNewest"} : { view: "tagsByTagFlag", tagFlagId: query.focus}
  const { results: tags, loading, loadMoreProps } = useMulti({
    terms: multiTerms, // { view: "tagsByTagFlag", tagFlagId: query.focus},
    collection: Tags,
    fragmentName: "TagWithFlagsFragment",
    limit: 100,
    itemsPerPage: 100,
  });

  const { results: tagFlags } = useMulti({
    terms: {
      view: "allTagFlags"
    },
    collection: TagFlags,
    fragmentName: "TagFlagFragment",
    limit: 100,
  });

  const { openDialog } = useDialog();

  return <div className={classes.root}>
    <SectionTitle title="Twiki Dashboard"/>
    <NewTagsList />
    <SectionTitle title="Pages in Need of Work">
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
        <a
          className={classes.collapseButton}
          onClick={() => setCollapsed(!collapsed)}
        > {collapsed ? "Uncollapse" : "Collapse"} Tags </a>
      </SectionButton>
    </SectionTitle>
    <div className={classes.flagList}>
      <QueryLink query={query.focus === "allPages" ? {} : {focus: "allPages"}}>
        <TagFlagAllPagesItem style={query.focus === "allPages" ? "black" : "grey"}/>
      </QueryLink>
      {tagFlags?.map(tagFlag => <QueryLink key={tagFlag._id} query={query.focus === tagFlag._id ? {} : {focus: tagFlag._id}}>
        <TagFlagItem documentId={tagFlag._id} style={query.focus === tagFlag._id ? "black" : "grey"} />
      </QueryLink>)}
    </div>
    {!loading && tags?.map(tag => <TagsDetailsItem
      key={tag._id}
      tag={tag}
      showFlags
      flagId={query.focus}
      collapse={collapsed}
    />)}
    {loading ? <Loading /> : <LoadMore className={classes.loadMore} {...loadMoreProps}/>}
  </div>
}


const TaggingDashboardComponent = registerComponent("TaggingDashboard", TaggingDashboard, { styles });

declare global {
  interface ComponentTypes {
    TaggingDashboard: typeof TaggingDashboardComponent
  }
}
