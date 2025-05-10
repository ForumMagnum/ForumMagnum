import React, { useCallback, useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from './withUser';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox'
import { isEAForum } from '../../lib/instanceSettings';
import { Loading } from "../vulcan-core/Loading";
import { SectionTitle } from "./SectionTitle";
import { ShortformListItem } from "../shortform/ShortformListItem";
import { LoadMore } from "./LoadMore";
import { SectionButton } from "./SectionButton";
import { ShortformSubmitForm } from "../shortform/ShortformSubmitForm";

const styles = (_: ThemeType) => ({
  subheader: {
    fontSize: 14,
  },
  shortformSubmitForm: {
    marginTop: 6,
    marginBottom: 12,
  }
});

const CommentsListCondensedInner = ({label, terms, initialLimit, itemsPerPage, showTotal=false, hideTag, shortformButton=false, classes}: {
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

export const CommentsListCondensed = registerComponent(
  'CommentsListCondensed',
  CommentsListCondensedInner,
  {styles, stylePriority: 1},
);


