import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React, {useCallback, useState} from 'react';
import { userCanPost } from '../../lib/collections/posts/collection';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import {useMulti} from "../../lib/crud/withMulti";
import { useUpdate } from '../../lib/crud/withUpdate';
import {useLocation} from "../../lib/routeUtil";
import {Link} from "../../lib/reactRouterWrapper";
import DescriptionIcon from "@/lib/vendor/@material-ui/icons/src/Description";
import ListIcon from '@/lib/vendor/@material-ui/icons/src/List';

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

const DraftsList = ({limit, title="My Drafts", userId, showAllDraftsLink=true, hideHeaderRow, classes}: {
  limit: number,
  title?: string,
  userId?: string,
  showAllDraftsLink?: boolean,
  hideHeaderRow?: boolean,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { PostsItem, Loading } = Components
  
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
    includeArchived: !!query.includeArchived ? (query.includeArchived === 'true') : currentUser?.draftsListShowArchived,
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
    {!hideHeaderRow && <Components.SectionTitle title={title}>
      <div className={classes.draftsHeaderRow}>
        <div className={classes.newPostButton}>
          {currentUser && userCanPost(currentUser) && <Link to={"/newPost"}>
            <Components.SectionButton>
              <DescriptionIcon /> New Post
            </Components.SectionButton>
          </Link>}
        </div>
        {showAllDraftsLink && <div className={classes.draftsPageButton}>
          <Link to={"/drafts"}>
            <Components.SectionButton>
              <ListIcon /> All Drafts
            </Components.SectionButton>
          </Link>
        </div>}
        <div onClick={() => setShowSettings(!showSettings)}>
          <Components.SettingsButton label={`Sorted by ${ sortings[currentSorting]}`}/>
        </div>
      </div>
    </Components.SectionTitle>}
    {showSettings && <Components.DraftsListSettings
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
    <Components.LoadMore { ...loadMoreProps }/>
  </>
}

const DraftsListComponent = registerComponent('DraftsList', DraftsList, {
  hocs: [withErrorBoundary], styles
});

declare global {
  interface ComponentTypes {
    DraftsList: typeof DraftsListComponent
  }
}

