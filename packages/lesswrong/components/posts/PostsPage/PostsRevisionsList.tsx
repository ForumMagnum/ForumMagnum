import React from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { QueryLink } from "../../../lib/reactRouterWrapper";
import { useNavigate } from "../../../lib/routeUtil";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import FormatDate from "../../common/FormatDate";
import { MenuItem } from "../../common/Menus";
import type { PostsBase } from '@/lib/generated/gql-codegen/graphql';

const PostsRevisionsListQuery = gql(`
  query PostsRevisionsList($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsRevisionsList
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  version: {
    marginRight: 5
  }
})

const PostsRevisionsList = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const { loading, data } = useQuery(PostsRevisionsListQuery, {
    variables: { documentId: post._id },
    fetchPolicy: 'network-only',
  });
  const document = data?.post?.result;
  if (loading || !document) {return <MenuItem disabled> Loading... </MenuItem>} 
  const { revisions } = document
  
  return <React.Fragment>
    {revisions?.map(({editedAt, version}) =>
      <QueryLink key={version} query={{revision: version}} merge>
        <MenuItem>
          <span className={classes.version}>View v{version}</span> (<FormatDate date={editedAt}/>)
        </MenuItem>
      </QueryLink>)}
    
    <MenuItem onClick={ev => navigate(`/revisions/post/${post._id}/${post.slug}`)}>
      Compare Revisions
    </MenuItem>
  </React.Fragment>
}

export default registerComponent(
  'PostsRevisionsList', PostsRevisionsList, {styles}
);


