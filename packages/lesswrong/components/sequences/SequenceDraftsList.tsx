import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { sortings } from '../posts/DraftsList';

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

const SequenceDraftsList = ({limit, title="My Drafts", userId, classes, addDraft, dialogPostIds}: {
  classes: ClassesType<typeof styles>,
  limit: number,
  title?: string,
  userId?: string,
  addDraft: Function,
  dialogPostIds: string[],
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const currentUser = useCurrentUser();
  const { Loading } = Components
  
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
      <Components.SectionTitle title={title} noTopMargin={true}>
        <div onClick={() => setShowSettings(!showSettings)}>
          <Components.SettingsButton label={`Sorted by ${ sortings[currentSorting]}`}/>
        </div>
      </Components.SectionTitle>
      {showSettings && <Components.DraftsListSettings
        hidden={false}
        persistentSettings={true}
        currentSorting={currentSorting}
        currentIncludeArchived={!!terms.includeArchived}
        currentIncludeShared={!!terms.includeShared}
        sortings={sortings}
      />}
      {results && results.map((post: PostsList) =>
        <li key={post._id} className={classes.item} onClick={() => addDraft(post._id)} >
          <Components.PostsItemWrapper documentId={post._id} addItem={addDraft} disabled={dialogPostIds.includes(post._id)} simpleAuthor={true} draggable={false} />
        </li>
      )}
    </>}
    <Components.LoadMore { ...loadMoreProps } />
  </>
}

const SequenceDraftsListComponent = registerComponent(
  'SequenceDraftsList', SequenceDraftsList, {styles}
);

declare global {
  interface ComponentTypes {
    SequenceDraftsList: typeof SequenceDraftsListComponent
  }
}
