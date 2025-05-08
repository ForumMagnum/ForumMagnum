import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { sortings } from '../posts/DraftsList';
import { SectionTitle } from "../common/SectionTitle";
import { SettingsButton } from "../icons/SettingsButton";
import { DraftsListSettings } from "../posts/DraftsListSettings";
import { PostsItemWrapper } from "../posts/PostsItemWrapper";
import { LoadMore } from "../common/LoadMore";
import { Loading } from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  item: {
    listStyle: "none",
    position: "relative",
    padding: 5,
    cursor: "pointer",
    minWidth: 400,
  },
  [theme.breakpoints.down('xs')]: {
    item: {
      minWidth: 230,
    },
  }
})

const SequenceDraftsListInner = ({limit, title="My Drafts", userId, classes, addDraft, dialogPostIds}: {
  classes: ClassesType<typeof styles>,
  limit: number,
  title?: string,
  userId?: string,
  addDraft: Function,
  dialogPostIds: string[],
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const currentUser = useCurrentUser();
  const { query } = useLocation();

  const currentSorting = query.sortDraftsBy ?? query.view ?? currentUser?.draftsListSorting ?? "lastModified";

  const terms: PostsViewTerms = {
    view: "drafts",
    userId: userId ?? currentUser?._id,
    limit,
    sortDraftsBy: currentSorting,
    includeArchived: !!query.includeArchived ? (query.includeArchived === 'true') : (currentUser?.draftsListShowArchived ?? undefined),
    includeShared: !!query.includeShared ? (query.includeShared === 'true') : (currentUser?.draftsListShowShared !== false),
  }
  
  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
  });

  if (!currentUser) return null

  return <>
    {(!results && loading) ? <Loading /> : <>
      <SectionTitle title={title} noTopMargin={true}>
        <div onClick={() => setShowSettings(!showSettings)}>
          <SettingsButton label={`Sorted by ${ sortings[currentSorting]}`}/>
        </div>
      </SectionTitle>
      {showSettings && <DraftsListSettings
        hidden={false}
        persistentSettings={true}
        currentSorting={currentSorting}
        currentIncludeArchived={!!terms.includeArchived}
        currentIncludeShared={!!terms.includeShared}
        sortings={sortings}
      />}
      {results && results.map((post: PostsList) =>
        <li key={post._id} className={classes.item} onClick={() => addDraft(post._id)} >
          <PostsItemWrapper documentId={post._id} addItem={addDraft} disabled={dialogPostIds.includes(post._id)} simpleAuthor={true} draggable={false} />
        </li>
      )}
    </>}
    <LoadMore { ...loadMoreProps } />
  </>
}

export const SequenceDraftsList = registerComponent(
  'SequenceDraftsList', SequenceDraftsListInner, {styles}
);

declare global {
  interface ComponentTypes {
    SequenceDraftsList: typeof SequenceDraftsList
  }
}
