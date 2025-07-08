import React from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import UltraFeedPostDialog from "./UltraFeedPostDialog";
import { FeedPostMetaInfo } from "./ultraFeedTypes";
import Loading from "../vulcan-core/Loading";
import LWDialog from "../common/LWDialog";
import { DialogContent } from "../widgets/DialogContent";
import { defineStyles, useStyles } from "../hooks/useStyles";

const PostsListWithVotesQuery = gql(`
  query UltraFeedPostDialogWrapper($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsListWithVotes
      }
    }
  }
`);

const styles = defineStyles("UltraFeedPostDialogWrapper", (theme: ThemeType) => ({
  loadingDialog: {
    minHeight: 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogPaper: {
    width: 'calc(100vw - 24px)',
    maxWidth: 'calc(100vw - 24px)',
    height: 'calc(100dvh - 24px)',
    maxHeight: 'calc(100dvh - 24px)',
    margin: 12,
    borderRadius: 12,
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
      maxWidth: '100vw',
      height: '100dvh',
      maxHeight: '100dvh',
      margin: 0,
      borderRadius: 0,
    },
  },
}));

interface UltraFeedPostDialogWrapperProps {
  postId: string;
  onClose: () => void;
  postMetaInfo?: FeedPostMetaInfo;
}

const UltraFeedPostDialogWrapper = ({ 
  postId, 
  onClose,
  postMetaInfo,
}: UltraFeedPostDialogWrapperProps) => {
  const classes = useStyles(styles);
  
  const { loading, data, error } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: postId },
    fetchPolicy: 'cache-first',
  });

  const post = data?.post?.result as PostsListWithVotes | undefined;

  if (error || (!loading && !post)) {
    onClose();
    return null;
  }

  if (loading && !post) {
    return (
      <LWDialog
        open={true}
        onClose={onClose}
        fullWidth
        paperClassName={classes.dialogPaper}
      >
        <DialogContent className={classes.loadingDialog}>
          <Loading />
        </DialogContent>
      </LWDialog>
    );
  }

  if (!post) {
    return null;
  }

  const defaultPostMetaInfo: FeedPostMetaInfo = {
    sources: [],
    displayStatus: "expanded",
  };

  return (
    <UltraFeedPostDialog
      partialPost={post}
      postMetaInfo={postMetaInfo || defaultPostMetaInfo}
      onClose={onClose}
    />
  );
};

export default UltraFeedPostDialogWrapper;
