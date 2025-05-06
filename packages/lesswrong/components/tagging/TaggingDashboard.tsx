import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { taggingNameCapitalSetting, taggingNameIsSet, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { fieldIn } from '../../lib/utils/typeGuardUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useSingle } from '@/lib/crud/withSingle';

const SECTION_WIDTH = 960

const styles = (theme: ThemeType) => ({
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
    lineHeight: "1.5rem",
    flexGrow: 1,
    textAlign: "left",
    fontWeight: 400
  },
  feeds: {
    display: "flex",
    alignItems: "left"
  },
  header: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
  },
  navigationLinks: {
    ...theme.typography.commentStyle,
    display: "block",
    paddingBottom: 3,
    opacity: 1,
    color: theme.palette.icon.maxIntensity,
    lineHeight: "0.9em",
    fontWeight: 300,
    fontSize: "1.5rem"
  },
  navigationLinksDivider: {
    display: "block",
    width: "260px",
    borderBottom: theme.palette.border.faint,
    marginRight: "auto",
    marginBottom: "4px",
    // paddingBottom: "8px"
  },
  sectionPositioning: {
    paddingBottom: "10px"
  }
})

const TaggingDashboard = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const { SectionTitle, TagsDetailsItem, SectionButton, TagFlagItem, NewTagsList, LoadMore, TagActivityFeed, TagVoteActivity, SingleColumnSection } = Components
  const { query } = useLocation();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser()
  const [collapsed, setCollapsed] = useState(currentUser?.taggingDashboardCollapsed || false);
  
  const multiTerms = {
      allPages: {view: "allPagesByNewest"},
      myPages: {view: "userTags", userId: currentUser?._id},
      //tagFlagId handled as default case below
  } as const
    
  const { results: tags, loading, loadMoreProps } = useMulti({
    terms: fieldIn(query.focus, multiTerms) ? multiTerms[query.focus] : {view: "tagsByTagFlag", tagFlagId: query.focus},
    collectionName: "Tags",
    fragmentName: "TagWithFlagsFragment",
    limit: 10,
    itemsPerPage: 50,
  });

  const tagsFiltered = ["allPages", "myPages"].includes(query.focus)  //if not showing all tags, only show those with at least one non-deleted tag flag
    ? tags
    : tags?.filter(tag => (tag as TagWithFlagsFragment)?.tagFlags.some(tagFlag => !tagFlag.deleted))
  
  const { results: tagFlags } = useMulti({
    terms: {
      view: "allTagFlags"
    },
    collectionName: "TagFlags",
    fragmentName: "TagFlagFragment",
    limit: 100,
  });
  
  const focusedTagFlagId = tagFlags?.find(tagFlag => tagFlag._id === query.focus)?._id;

  const { document: focusedTagFlag } = useSingle({
    documentId: focusedTagFlagId,
    collectionName: "TagFlags",
    fragmentName: "TagFlagEditFragment",
    skip: !focusedTagFlagId,
  });

  const { openDialog } = useDialog();
  
  const dashboardTagsNameAlt = taggingNameIsSet.get() ? taggingNamePluralCapitalSetting.get() : 'Wiki-Tags'

  return <div>
    <div className={classes.root}>
      <div className={classes.navigationLinks}>
        <div className={classes.navigationLinksDivider}/>
        <p><a href="#Pages_in_need_of_work">{dashboardTagsNameAlt} in Need of Work</a></p>
        <p><a href="#Newest_tags">Newest {taggingNameCapitalSetting.get()}</a></p>
        <p><a href="#Tag_voting_activity">{taggingNameCapitalSetting.get()} Voting Activity</a></p>
        <p><a href="#Tag_activity_feed">Combined {dashboardTagsNameAlt} Activity Feed</a></p>
        <div className={classes.navigationLinksDivider}/>
      </div>
      <div id="Pages_in_need_of_work">
        <SectionTitle title={`${dashboardTagsNameAlt} in Need of Work`}>
          <SectionButton>
            {query.focus && <QueryLink query={{}}> Reset Filter </QueryLink>}
            {currentUser?.isAdmin &&
              <span className={classes.editButton} onClick={() => openDialog({
                name: "TagFlagEditAndNewForm",
                contents: ({onClose}) => <Components.TagFlagEditAndNewForm
                  onClose={onClose}
                  {...(query.focus && focusedTagFlag) ? { initialData: focusedTagFlag } : {}}
                />
              })}>
                {query.focus
                  ? `Edit ${taggingNameCapitalSetting.get()} Flag`
                  : `New ${taggingNameCapitalSetting.get()} Flag`
                }
              </span>
            }
            <a
              className={classes.collapseButton}
              onClick={async () => {
                 setCollapsed(!collapsed)
                 if (currentUser) {
                   void updateCurrentUser({
                     taggingDashboardCollapsed: !collapsed
                   })
                 }
                 }
              }
            > {collapsed ? "Uncollapse" : "Collapse"} {taggingNamePluralCapitalSetting.get()}</a>
          </SectionButton>
        </SectionTitle>
        <div className={classes.flagList}>
          <QueryLink query={query.focus === "allPages" ? {} : {focus: "allPages"}}>
            <TagFlagItem itemType={"allPages"} style={query.focus === "allPages" ? "black" : "grey"}/>
          </QueryLink>
          {currentUser && <QueryLink query={query.focus === "myPages" ? {} : {focus: "myPages"}}>
            <TagFlagItem itemType={"userPages"} style={query.focus === "myPages" ? "black" : "grey"}/>
          </QueryLink>}
          {tagFlags?.map(tagFlag => <QueryLink key={tagFlag._id} query={query.focus === tagFlag._id ? {} : {focus: tagFlag._id}}>
            <TagFlagItem documentId={tagFlag._id} style={query.focus === tagFlag._id ? "black" : "grey"} />
          </QueryLink>)}
        </div>
        {!loading && tagsFiltered?.map(tag => <TagsDetailsItem
          key={tag._id}
          tag={tag}
          showFlags
          flagId={query.focus}
          collapse={collapsed}
        />)}
        <div className={classes.loadMore}>
          <LoadMore {...loadMoreProps}/>
        </div>
      </div>
    </div>
    <SingleColumnSection>
      <div id="Newest_tags" className={classes.sectionPositioning}>
        <SectionTitle title={`Newest ${taggingNamePluralCapitalSetting.get()}`}/>
        <NewTagsList showHeaders={false}/>
      </div>
      <div id="Tag_voting_activity" className={classes.sectionPositioning}>
        <SectionTitle title={`${taggingNameCapitalSetting.get()} Voting Activity`}/>
        <TagVoteActivity showHeaders={false} showNewTags={false} limit={10} itemsPerPage={100}/>
      </div>
      <div id="Tag_activity_feed" className={classes.sectionPositioning}>
        <TagActivityFeed pageSize={20}/>
      </div>
    </SingleColumnSection>
  </div>
}


const TaggingDashboardComponent = registerComponent("TaggingDashboard", TaggingDashboard, { styles });

declare global {
  interface ComponentTypes {
    TaggingDashboard: typeof TaggingDashboardComponent
  }
}
