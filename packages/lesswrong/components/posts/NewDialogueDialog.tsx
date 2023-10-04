import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import { useCreate } from '../../lib/crud/withCreate';
import { useMessages } from '../common/withMessages';
import { useNavigation } from '../../lib/routeUtil';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
  dialog: {
    padding: 16,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.normal,
  },
  inputRow: {
    marginBottom: 12,
  },
  label: {
    ...theme.typography.body2,
    display: "inline-block",
    marginRight: 10,
  },
  titleInput: {
    ...theme.typography.display2,
    ...theme.typography.headerStyle,
    marginTop: 12,
    width: 400,
  },
  usersListEditor: {
    display: "inline-block",
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
      const postEditUrl = `/editPost?postId=${postId}`;
      history.push(postEditUrl);
      onClose();
    }
  }

  return <LWDialog
    open={true}
    onClose={onClose}
    fullWidth
    maxWidth={"sm"}
    dialogClasses={{paper: classes.dialogPaper}}
  >
    <div className={classes.dialog}>  
      <Input
        type="text"
        placeholder="New Dialogue Title"
        value={title}
        className={classes.titleInput}
        onChange={ev => setTitle(ev.currentTarget.value)}
      />
      <div className={classes.usersListEditor}>
        <UsersListEditor
          value={participants}
          setValue={setParticipants}
          label="Add Participants"
        />
      </div>
      
      <DialogActions>
        {loading && <Loading/>}
        <Button onClick={createDialogue}>
          Create Dialogue
        </Button>
      </DialogActions>
    </div>
  </LWDialog>
}

const NewDialogueDialogComponent = registerComponent('NewDialogueDialog', NewDialogueDialog, {styles});

declare global {
  interface ComponentTypes {
    NewDialogueDialog: typeof NewDialogueDialogComponent
  }
}

