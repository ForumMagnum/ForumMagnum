import React, { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useDialog } from '../../common/withDialog';
import { useCurrentUser } from '../../common/withUser';
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import RssFeed from "@/lib/vendor/@material-ui/icons/src/RssFeed";
import { DialogActions } from '@/components/widgets/DialogActions';
import { DialogContent } from '../../widgets/DialogContent';
import DropdownItem from "../DropdownItem";
import ContentStyles from "../../common/ContentStyles";
import { ContentItemBody } from "../../contents/ContentItemBody";
import LWDialog from "../../common/LWDialog";
import Loading from "../../vulcan-core/Loading";

const PostsEditUpdateMutation = gql(`
  mutation updatePostResyncRssDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsEdit
      }
    }
  }
`);


const styles = (theme: ThemeType) => ({
  diffExplanation: {
    fontStyle: "italic",
    marginBottom: 24,
  },
  changesPreview: {
    minWidth: 500,
    minHeight: 500,
    "& ins": {
      background: theme.palette.background.diffInserted,
      textDecoration: "none",
    },
    "& del": {
      background: theme.palette.background.diffDeleted,
      textDecoration: "none",
    },
  },
  buttons: {
    margin: 12,
  },
  button: {
    marginRight: 8,
    padding: "8px 14px 8px 14px",
  },
})

const ResyncRssDropdownItemInner = ({post, closeMenu, classes}: {
  post: PostsList|SunshinePostsList,
  closeMenu: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  
  if (!post.feedId) {
    return null;
  }
  if (!canUserEditPostMetadata(currentUser, post)) {
    return null;
  }
  
  function onClick() {
    closeMenu();
    openDialog({
      name: "ResyncRssDialog",
      contents: ({onClose}) => <ResyncRssDialog onClose={onClose} post={post} classes={classes} />
    });
  }

  return <DropdownItem
    title="Resync RSS"
    onClick={onClick}
    icon={() => <RssFeed/>}
  />
}

const ResyncRssDialog = ({onClose, post, classes}: {
  onClose: () => void,
  post: PostsList|SunshinePostsList,
  classes: ClassesType<typeof styles>,
}) => {
  const client = useApolloClient();
  
  // Query to get a diff between the post HTML and the HTML seen in the RSS feed
  // (see server/rss-integration/cron). HTML returned from this is already
  // sanitized.
  const { data, loading, error } = useQuery(gql(`
    query getRssPostChanges($postId: String!) {
      RssPostChanges(postId: $postId) {
        isChanged
        newHtml
        htmlDiff
      }
    }
  `), {
    variables: {
      postId: post._id,
    },
  });

  const [updatePost] = useMutation(PostsEditUpdateMutation);
  const [isSaving, setIsSaving] = useState(false);
  
  function cancel() {
    onClose();
  }
  
  function apply() {
    void (async () => {
      setIsSaving(true);
      await updatePost({
        variables: {
          selector: {
            _id: post._id,
          },
          data: {
            // Contents is a resolver only field, but there is handling for it
            // in `createMutator`/`updateMutator`
            contents: {
              originalContents: {
                type: "html",
                data: data?.RssPostChanges.newHtml,
              }
            },
          } as AnyBecauseHard
        }
      });

      onClose();
      setIsSaving(false);
      
      // Client-side updating doesn't work for this because, among other things,
      // there are server-side transforms done.
      await client.resetStore();
    })();
  }

  return <LWDialog
    title="RSS Resync"
    open={true} onClose={onClose}
  >
    <DialogContent>
      <h1>Resync Crosspost</h1>
      <div className={classes.changesPreview}>
        {loading && <Loading/>}
        {data?.RssPostChanges && !data.RssPostChanges?.isChanged && <div>
          No changes were detected
        </div>}
        {data?.RssPostChanges && data.RssPostChanges?.isChanged && <div>
          <div className={classes.diffExplanation}>The version this was auto-crossposted from has changed. Check the <ins>insertions</ins> and <del>deletions</del> below and click Apply to copy the changes.</div>
          <ContentStyles contentType="post">
            <ContentItemBody dangerouslySetInnerHTML={{__html: data.RssPostChanges.htmlDiff}}/>
          </ContentStyles>
        </div>}
        {error && <div>{error.message}</div>}
      </div>
    </DialogContent>
    
    {isSaving && <Loading/>}
    <DialogActions>
      <div className={classes.buttons}>
        <button className={classes.button} onClick={cancel}>Cancel</button>
        <button
          className={classes.button}
          onClick={apply}
          disabled={loading || !!error}
        >Apply</button>
      </div>
    </DialogActions>
  </LWDialog>
}

export const ResyncRssDropdownItem = registerComponent('ResyncRssDropdownItem', ResyncRssDropdownItemInner, {styles});


