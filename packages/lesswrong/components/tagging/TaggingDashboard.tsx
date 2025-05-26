import React, { useState } from 'react';
import { taggingNameCapitalSetting, taggingNameIsSet, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { fieldIn } from '../../lib/utils/typeGuardUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import TagFlagEditAndNewForm from "./TagFlagEditAndNewForm";
import SectionTitle from "../common/SectionTitle";
import TagsDetailsItem from "./TagsDetailsItem";
import SectionButton from "../common/SectionButton";
import TagFlagItem from "./TagFlagItem";
import NewTagsList from "./NewTagsList";
import LoadMore from "../common/LoadMore";
import TagActivityFeed from "./TagActivityFeed";
import TagVoteActivity from "./TagVoteActivity";
import SingleColumnSection from "../common/SingleColumnSection";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { useLoadMore } from "@/components/hooks/useLoadMore";

const TagFlagFragmentMultiQuery = gql(`
  query multiTagFlagTaggingDashboardQuery($selector: TagFlagSelector, $limit: Int, $enableTotal: Boolean) {
    tagFlags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagFlagFragment
      }
      totalCount
    }
  }
`);

const TagWithFlagsFragmentMultiQuery = gql(`
  query multiTagTaggingDashboardQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagWithFlagsFragment
      }
      totalCount
    }
  }
`);

const TagFlagEditFragmentQuery = gql(`
  query TaggingDashboard($documentId: String) {
    tagFlag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagFlagEditFragment
      }
    }
  }
`);

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
  const { query } = useLocation();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser()
  const [collapsed, setCollapsed] = useState(currentUser?.taggingDashboardCollapsed || false);
  
  const multiTerms = {
    allPages: {view: "allPagesByNewest"},
    myPages: {view: "userTags", userId: currentUser?._id},
    //tagFlagId handled as default case below
  } as const
    
  const terms = fieldIn(query.focus, multiTerms) ? multiTerms[query.focus] : { view: "tagsByTagFlag", tagFlagId: query.focus };
  const { view, ...selectorTerms } = terms;
  const { data: dataTagsWithFlags, loading, fetchMore } = useQuery(TagWithFlagsFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const tags = dataTagsWithFlags?.tags?.results;

  const loadMoreProps = useLoadMore({
    data: dataTagsWithFlags?.tags,
    loading,
    fetchMore,
    initialLimit: 10,
    itemsPerPage: 50,
    resetTrigger: terms,
  });

  const tagsFiltered = ["allPages", "myPages"].includes(query.focus)  //if not showing all tags, only show those with at least one non-deleted tag flag
    ? tags
    : tags?.filter(tag => (tag as TagWithFlagsFragment)?.tagFlags.some(tagFlag => !tagFlag.deleted))
  
  const { data: dataTagFlagFragment } = useQuery(TagFlagFragmentMultiQuery, {
    variables: {
      selector: { allTagFlags: {} },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const tagFlags = dataTagFlagFragment?.tagFlags?.results;
  
  const focusedTagFlagId = tagFlags?.find(tagFlag => tagFlag._id === query.focus)?._id;

  const { data } = useQuery(TagFlagEditFragmentQuery, {
    variables: { documentId: focusedTagFlagId },
    skip: !focusedTagFlagId,
  });
  const focusedTagFlag = data?.tagFlag?.result;

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
                contents: ({onClose}) => <TagFlagEditAndNewForm
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


export default registerComponent("TaggingDashboard", TaggingDashboard, { styles });


