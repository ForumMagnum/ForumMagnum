import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { useCreate } from '../../lib/crud/withCreate';
import { useMessages } from '../common/withMessages';
import { useNavigation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  dialog: {
  },
})

const NewDialogueDialog = ({onClose, classes}: {
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const { UsersListEditor, LWDialog, Loading } = Components;
  const [title, setTitle] = useState("");
  const {flash} = useMessages();
  const [participants, setParticipants] = useState<string[]>([]);
  const {create: createPost, loading, error} = useCreate({ collectionName: "Posts", fragmentName: "PostsEdit" });
  const { history } = useNavigation();
  
  async function createDialogue() {
    if (!title.length) {
      flash("You must choose a title");
      return;
    }
    const createResult = await createPost({
      data: {
        title,
        draft: true,
        collabEditorDialogue: true,
        coauthorStatuses: participants.map(userId => ({userId, confirmed: true, requested: false})),
        shareWithUsers: participants,
        sharingSettings: {
          anyoneWithLinkCan: "none",
          explicitlySharedUsersCan: "edit",
        },
      },
    });
    if (createResult?.data?.createPost?.data) {
      const post = createResult?.data?.createPost?.data;
      const postId = post._id;
      const postEditUrl = `/posts/edit?postId=${postId}`;
      history.push(postEditUrl);
    }
  }

  return <LWDialog
    open={true}
    onClose={onClose}
    fullWidth
    maxWidth={"sm"}
    dialogClasses={{paper: classes.dialogPaper}}
    className={classes.dialog}
  >
    <DialogTitle>Start a Dialogue</DialogTitle>
    
    <DialogContent>
      <div>Title</div>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={ev => setTitle(ev.currentTarget.value)}
      />
  
      <div>Invited Participants</div>
      <UsersListEditor
        value={participants}
        setValue={setParticipants}
        label="Participants"
      />
    </DialogContent>
    
    <DialogActions>
      {loading && <Loading/>}
      <Button onClick={createDialogue}>
        Create
      </Button>
    </DialogActions>
  </LWDialog>
}

const NewDialogueDialogComponent = registerComponent('NewDialogueDialog', NewDialogueDialog, {styles});

declare global {
  interface ComponentTypes {
    NewDialogueDialog: typeof NewDialogueDialogComponent
  }
}

