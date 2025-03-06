import React, { useState } from 'react';
import { gql, useApolloClient, useQuery } from '@apollo/client';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { useDialog } from '../../common/withDialog';
import { useCurrentUser } from '../../common/withUser';
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import RssFeed from "@material-ui/icons/RssFeed";
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { useUpdate } from '../../../lib/crud/withUpdate';
import DropdownItem from "@/components/dropdowns/DropdownItem";
import Button from "@/components/vulcan-ui-bootstrap/ui/Button";
import { ContentStyles } from "@/components/common/ContentStyles";
import ContentItemBody from "@/components/common/ContentItemBody";
import LWDialog from "@/components/common/LWDialog";
import { Loading } from "@/components/vulcan-core/Loading";

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

const ResyncRssDropdownItem = ({post, closeMenu, classes}: {
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
      componentName: "ResyncRssDialog",
      componentProps: { post },
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
  const { data, loading, error } = useQuery(gql`
    query getRssPostChanges($postId: String!) {
      RssPostChanges(postId: $postId) {
        isChanged
        newHtml
        htmlDiff
      }
    }
  `, {
    variables: {
      postId: post._id,
    },
  });

  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: "PostsEdit",
    skipCacheUpdate: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  
  function cancel() {
    onClose();
  }
  
  function apply() {
    void (async () => {
      setIsSaving(true);
      await updatePost({
        selector: {
          _id: post._id,
        },
        data: {
          // Contents is a resolver only field, but there is handling for it
          // in `createMutator`/`updateMutator`
          contents: {
            originalContents: {
              type: "html",
              data: data.RssPostChanges.newHtml,
            }
          },
        } as AnyBecauseHard,
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
        <Button className={classes.button} onClick={cancel}>Cancel</Button>
        <Button
          className={classes.button}
          onClick={apply}
          disabled={loading || !!error}
        >Apply</Button>
      </div>
    </DialogActions>
  </LWDialog>
}

const ResyncRssDropdownItemComponent = registerComponent('ResyncRssDropdownItem', ResyncRssDropdownItem, {styles});
const ResyncRssDialogComponent = registerComponent('ResyncRssDialog', ResyncRssDialog, {styles});

declare global {
  interface ComponentTypes {
    ResyncRssDropdownItem: typeof ResyncRssDropdownItemComponent
    ResyncRssDialog: typeof ResyncRssDialogComponent
  }
}

export {
  ResyncRssDropdownItemComponent as ResyncRssDropdownItem,
  ResyncRssDialogComponent as ResyncRssDialog
}

