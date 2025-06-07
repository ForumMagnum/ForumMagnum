import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";
import Loading from "../vulcan-core/Loading";
import LWDialog from "../common/LWDialog";
import { DialogTitle } from '../widgets/DialogTitle';
import { DialogContent } from '../widgets/DialogContent';


const PostWithGeneratedSummaryQuery = gql(`
  query PostSummaryDialog($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostWithGeneratedSummary
      }
    }
  }
`);

const PostSummaryDialog = ({post, onClose}: {
  post: PostsList|SunshinePostsList,
  onClose?: () => void,
}) => {
  const { loading, data } = useQuery(PostWithGeneratedSummaryQuery, {
    variables: { documentId: post._id },
  });
  const postWithSummary = data?.post?.result;

  return <LWDialog open={true} onClose={onClose}>
    <DialogTitle>{post.title}</DialogTitle>
    <DialogContent>
      {loading && <Loading/>}
      {postWithSummary && postWithSummary.languageModelSummary}
    </DialogContent>
  </LWDialog>
}

export default registerComponent(
  'PostSummaryDialog',
  PostSummaryDialog,
);


