import { registerComponent } from '../../lib/vulcan-lib/components';
import React, {useCallback, useState} from 'react';
import { userCanPost } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import {useMulti} from "../../lib/crud/withMulti";
import { useUpdate } from '../../lib/crud/withUpdate';
import {useLocation} from "../../lib/routeUtil";
import {Link} from "../../lib/reactRouterWrapper";
import DescriptionIcon from "@/lib/vendor/@material-ui/icons/src/Description";
import ListIcon from '@/lib/vendor/@material-ui/icons/src/List';
import { SectionTitle } from "../common/SectionTitle";
import { SectionButton } from "../common/SectionButton";
import { SettingsButton } from "../icons/SettingsButton";
import { DraftsListSettings } from "./DraftsListSettings";
import { LoadMore } from "../common/LoadMore";
import { PostsItem } from "./PostsItem";
import { Loading } from "../vulcan-core/Loading";

const styles = (_theme: ThemeType) => ({
  draftsHeaderRow: {
    display: 'flex'
  },
  newPostButton: {
    marginRight: 20
  },
  draftsPageButton: {
    marginRight: 20
  }
})

export const sortings: Partial<Record<string,string>> = {
  newest: "Most Recently Created",
  lastModified: "Last Modified",
  wordCountAscending: "Shortest First",
  wordCountDescending: "Longest First",
}

const DraftsListInner = ({limit, title="My Drafts", userId, showAllDraftsLink=true, hideHeaderRow, classes}: {
  limit: number,
  title?: string,
  userId?: string,
  showAllDraftsLink?: boolean,
  hideHeaderRow?: boolean,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  const toggleDelete = useCallback((post: PostsList) => {
    void updatePost({
      selector: {_id: post._id},
      data: {deletedDraft:!post.deletedDraft, draft: true} //undeleting goes to draft
    })
  }, [updatePost])

  const currentSorting = query.sortDraftsBy ?? query.view ?? currentUser?.draftsListSorting ?? "lastModified";

  const terms: PostsViewTerms = {
    view: "drafts",
    userId: userId ?? currentUser?._id,
    limit,
    sortDraftsBy: currentSorting,
    includeArchived: !!query.includeArchived ? (query.includeArchived === 'true') : !!currentUser?.draftsListShowArchived,
    includeShared: !!query.includeShared ? (query.includeShared === 'true') : (currentUser?.draftsListShowShared !== false),
  }
  
  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
  });
  
  if (!currentUser) return null
  
  return <>
    {!hideHeaderRow && <SectionTitle title={title}>
      <div className={classes.draftsHeaderRow}>
        <div className={classes.newPostButton}>
          {currentUser && userCanPost(currentUser) && <Link to={"/newPost"}>
            <SectionButton>
              <DescriptionIcon /> New Post
            </SectionButton>
          </Link>}
        </div>
        {showAllDraftsLink && <div className={classes.draftsPageButton}>
          <Link to={"/drafts"}>
            <SectionButton>
              <ListIcon /> All Drafts
            </SectionButton>
          </Link>
        </div>}
        <div onClick={() => setShowSettings(!showSettings)}>
          <SettingsButton label={`Sorted by ${ sortings[currentSorting]}`}/>
        </div>
      </div>
    </SectionTitle>}
    {showSettings && <DraftsListSettings
      hidden={false}
      persistentSettings={true}
      currentSorting={currentSorting}
      currentIncludeArchived={!!terms.includeArchived}
      currentIncludeShared={!!terms.includeShared}
      sortings={sortings}
    />}
    {(!results && loading) ? <Loading /> : <>
      {results && results.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id}
          post={post}
          toggleDeleteDraft={toggleDelete}
          hideAuthor
          showDraftTag={false}
          showPersonalIcon={false}
          showBottomBorder={i < results.length-1}
          strikethroughTitle={post.deletedDraft}
        />
      )}
    </>}
    <LoadMore { ...loadMoreProps }/>
  </>
}

export const DraftsList = registerComponent('DraftsList', DraftsListInner, {
  hocs: [withErrorBoundary], styles
});

declare global {
  interface ComponentTypes {
    DraftsList: typeof DraftsList
  }
}

