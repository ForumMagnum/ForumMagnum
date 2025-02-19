import React, { useCallback, useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from './withUser';
import AddBoxIcon from '@material-ui/icons/AddBox'
import { isEAForum } from '../../lib/instanceSettings';

const styles = (_: ThemeType) => ({
  subheader: {
    fontSize: 14,
  },
  shortformSubmitForm: {
    marginTop: 6,
    marginBottom: 12,
  }
});

const CommentsListCondensed = ({label, terms, initialLimit, itemsPerPage, showTotal=false, hideTag, shortformButton=false, classes}: {
  label: string,
  terms: CommentsViewTerms
  initialLimit?: number,
  itemsPerPage?: number,
  showTotal?: boolean,
  hideTag?: boolean,
  shortformButton?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [showShortformFeed, setShowShortformFeed] = useState(false);

  const toggleShortformFeed = useCallback(() => {
    setShowShortformFeed(!showShortformFeed);
  }, [setShowShortformFeed, showShortformFeed]);

  const { Loading, SectionTitle, ShortformListItem, LoadMore, SectionButton, ShortformSubmitForm } = Components;
  const { results, loading, count, totalCount, loadMoreProps, refetch } = useMulti({
    terms: terms,
    limit: initialLimit,
    itemsPerPage,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
  });

  if (loading && !results?.length) {
    return <Loading/>;
  }
  if (!results?.length) {
    return null;
  }

  const showLoadMore = !loading && (count === undefined || totalCount === undefined || count < totalCount)
  return <>
    <SectionTitle title={label} titleClassName={classes.subheader} >
      {currentUser?.isReviewed && shortformButton && !currentUser.allCommentingDisabled && <div onClick={toggleShortformFeed}>
        <SectionButton>
          <AddBoxIcon />
          {"New quick take"}
        </SectionButton>
      </div>}
    </SectionTitle>
    {showShortformFeed && <ShortformSubmitForm successCallback={refetch} className={classes.shortformSubmitForm} />}
    {results.map((comment) => {
      return <ShortformListItem
        comment={comment}
        key={comment._id}
        hideTag={hideTag}
      />
    })}
    {loading && <Loading/>}
    {showLoadMore && <LoadMore {...{
      ...loadMoreProps,
      totalCount: showTotal ? totalCount : undefined,
    }} />}
  </>;
}

const CommentsListCondensedComponent = registerComponent(
  'CommentsListCondensed',
  CommentsListCondensed,
  {styles, stylePriority: 1},
);

declare global {
  interface ComponentTypes {
    CommentsListCondensed: typeof CommentsListCondensedComponent
  }
}
