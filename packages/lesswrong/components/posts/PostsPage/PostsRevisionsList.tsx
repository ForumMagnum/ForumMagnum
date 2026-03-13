import React from 'react'
import { QueryLink } from "../../../lib/reactRouterWrapper";
import { useNavigate } from "../../../lib/routeUtil";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import FormatDate from "../../common/FormatDate";
import { MenuItem } from "../../common/Menus";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const PostsRevisionsListQuery = gql(`
  query PostsRevisionsList($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsRevisionsList
      }
    }
  }
`);

const styles = defineStyles('PostsRevisionsList', (theme: ThemeType) => ({
  version: {
    marginRight: 5
  }
}))

const PostsRevisionsList = ({post}: {
  post: PostsBase,
}) => {
  const classes = useStyles(styles);
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

export default PostsRevisionsList;


