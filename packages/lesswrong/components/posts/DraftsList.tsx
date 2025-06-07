import { registerComponent } from '../../lib/vulcan-lib/components';
import React, {useCallback, useMemo, useState} from 'react';
import { userCanPost } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import {useLocation} from "../../lib/routeUtil";
import {Link} from "../../lib/reactRouterWrapper";
import DescriptionIcon from "@/lib/vendor/@material-ui/icons/src/Description";
import ListIcon from '@/lib/vendor/@material-ui/icons/src/List';
import SectionTitle from "../common/SectionTitle";
import SectionButton from "../common/SectionButton";
import SettingsButton from "../icons/SettingsButton";
import DraftsListSettings from "./DraftsListSettings";
import LoadMore from "../common/LoadMore";
import PostsItem from "./PostsItem";
import Loading from "../vulcan-core/Loading";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

const PostsListWithVotesMultiQuery = gql(`
  query multiPostDraftsListQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const PostsListUpdateMutation = gql(`
  mutation updatePostDraftsList($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

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
  const { query } = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  
  const [updatePost] = useMutation(PostsListUpdateMutation);
  
  const toggleDelete = useCallback((post: PostsList) => {
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: { deletedDraft: !post.deletedDraft, draft: true }
      }
    })
  }, [updatePost])

  const currentSorting = query.sortDraftsBy ?? query.view ?? currentUser?.draftsListSorting ?? "lastModified";

  const terms = useMemo(() => ({
    userId: userId ?? currentUser?._id,
    sortDraftsBy: currentSorting,
    includeArchived: !!query.includeArchived ? (query.includeArchived === 'true') : !!currentUser?.draftsListShowArchived,
    includeShared: !!query.includeShared ? (query.includeShared === 'true') : (currentUser?.draftsListShowShared !== false),
  }), [userId, currentSorting, query.includeArchived, query.includeShared, currentUser]);
  
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(PostsListWithVotesMultiQuery, {
    variables: {
      selector: { drafts: terms },
      limit,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
  });

  const results = data?.posts?.results;
  
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

export default registerComponent('DraftsList', DraftsList, {
  hocs: [withErrorBoundary], styles
});



