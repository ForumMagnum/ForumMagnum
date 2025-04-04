import React, { useState } from 'react';
import { gql, useApolloClient, useQuery } from '@apollo/client';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { useDialog } from '../../common/withDialog';
import { useCurrentUser } from '../../common/withUser';
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import RssFeed from "@/lib/vendor/@material-ui/icons/src/RssFeed";
import DialogActions from '@/lib/vendor/@material-ui/core/src/DialogActions';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import { useUpdate } from '../../../lib/crud/withUpdate';

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
  const { DropdownItem } = Components;
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
      contents: ({onClose}) => <Components.ResyncRssDialog onClose={onClose} post={post} />
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
  const { Button, ContentStyles, ContentItemBody, LWDialog, Loading } = Components;
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

