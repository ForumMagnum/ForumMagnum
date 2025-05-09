import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";
import { CommentsNode } from "../comments/CommentsNode";
import { LoadMore } from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
  root: {
  }
});

export const AllReactedCommentsPageInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const defaultLimit = 50;
  const pageSize = 50
  
  const { results, loadMoreProps } = usePaginatedResolver({
    fragmentName: "CommentsListWithParentMetadata",
    resolverName: "CommentsWithReacts",
    limit: defaultLimit, itemsPerPage: pageSize,
    ssr: true,
  })
  
  return (
    <SingleColumnSection>
      <SectionTitle title="All Reacted Comments"/>
      <div className={classes.root}>
        {results && results.map((comment: CommentsListWithParentMetadata) =>
          <div key={comment._id}>
            <CommentsNode
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true
              }}
              comment={comment}
            />
          </div>
        )}
        <LoadMore {...loadMoreProps}/>
      </div>
    </SingleColumnSection>
  )
}

export const AllReactedCommentsPage = registerComponent('AllReactedCommentsPage', AllReactedCommentsPageInner, {styles});


