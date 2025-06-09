import React, { useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from './withUser';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox'
import { isEAForum } from '../../lib/instanceSettings';
import Loading from "../vulcan-core/Loading";
import SectionTitle from "./SectionTitle";
import ShortformListItem from "../shortform/ShortformListItem";
import LoadMore from "./LoadMore";
import SectionButton from "./SectionButton";
import ShortformSubmitForm from "../shortform/ShortformSubmitForm";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const ShortformCommentsMultiQuery = gql(`
  query multiCommentCommentsListCondensedQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ShortformComments
      }
      totalCount
    }
  }
`);

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
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, refetch, loadMoreProps } = useQueryWithLoadMore(ShortformCommentsMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: initialLimit,
      enableTotal: true,
    },
  });

  const results = data?.comments?.results;
  const totalCount = data?.comments?.totalCount ?? undefined;
  const count = results?.length ?? 0;

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

export default registerComponent(
  'CommentsListCondensed',
  CommentsListCondensed,
  {styles, stylePriority: 1},
);


