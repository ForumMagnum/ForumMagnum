import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useHover } from '../common/withHover';
import { useCurrentUser } from '../common/withUser';
import { shouldHideTagForVoting } from '../../lib/collections/tags/permissions';
import { usePostsPageContext } from '../posts/PostsPage/PostsPageContext';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const TagPreviewFragmentQuery = gql(`
  query TagSearchHit($documentId: String) {
    tag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagPreviewFragment
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    display: "block",
    padding: 8,
    cursor: "pointer",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[900],
    '&:hover': {
      color: theme.palette.lwTertiary.main
    }
  },
  card: {
    // No hover-preview on small phone screens
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  tagDescription: {
    marginBottom: 12
  },
  postCount: {
    fontSize: ".85em",
    color: theme.palette.grey[500]
  }
});

const TagSearchHit = ({hit, onClick, hidePostCount=false, isVotingContext, classes}: {
  hit: any,
  onClick?: (ev: any) => void,
  hidePostCount?: boolean,
  isVotingContext?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { PopperCard, TagPreview, Loading } = Components;
  const { data } = useQuery(TagPreviewFragmentQuery, {
    variables: { documentId: hit._id },
    fetchPolicy: 'cache-then-network' as any,
  });
  const tag = data?.tag?.result;
  const {eventHandlers, hover, anchorEl} = useHover();
  const currentUser = useCurrentUser();
  const post = usePostsPageContext()?.fullPost ?? null;

  // Some tags are only allowed to be voted on by certain users, ex. mods & admins
  // - in these cases, other users should not be able to find them via search.
  // However, users should still be able to find them in standard search, ex. frontpage filters.
  if (isVotingContext && shouldHideTagForVoting(currentUser, tag ?? hit, post)) {
    return null;
  }

  return (
    <span {...eventHandlers}>
      <PopperCard open={hover} anchorEl={anchorEl} placement="right-start">
        <div className={classes.card}>
          {!tag && <Loading/>}
          {tag && <TagPreview tag={tag} postCount={3}/>}
        </div>
      </PopperCard>
      <span className={classes.root} onClick={(e) => onClick?.(e)} >
        {hit.name} {!hidePostCount && <span className={classes.postCount}>({hit.postCount || 0})</span>}
      </span>
    </span>
  );
}

const TagSearchHitComponent = registerComponent("TagSearchHit", TagSearchHit, {styles});

declare global {
  interface ComponentTypes {
    TagSearchHit: typeof TagSearchHitComponent
  }
}

