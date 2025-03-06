import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import LoadMore from "@/components/common/LoadMore";
import CommentsNode from "@/components/comments/CommentsNode";
import { SectionTitle } from "@/components/common/SectionTitle";

const styles = (theme: ThemeType) => ({
  root: {
  }
});

export const AllReactedCommentsPage = ({classes}: {
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

const AllReactedCommentsPageComponent = registerComponent('AllReactedCommentsPage', AllReactedCommentsPage, {styles});

declare global {
  interface ComponentTypes {
    AllReactedCommentsPage: typeof AllReactedCommentsPageComponent
  }
}

export default AllReactedCommentsPageComponent;
