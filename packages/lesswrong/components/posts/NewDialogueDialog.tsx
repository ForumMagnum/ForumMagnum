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
    padding: 24,
    paddingBottom: 12,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.normal,
  },
  inputRow: {
    marginBottom: 12,
  },
  label: {
    ...theme.typography.body2,
    display: "inline-block",
  },
  titleInput: {
    ...theme.typography.body1,
    ...theme.typography.headerStyle,
    marginTop: 12,
    width: 400,
  },
  usersListEditor: {
    marginTop: 12,
    display: "inline-block",
  },
  header: {
    ...theme.typography.headerStyle,
    marginTop: 0
  },
  info: {
    ...theme.typography.body2,
    marginRight: 12
  }
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
    if (loading) return;
    if (!title.length) {
      flash("You must choose a title");
      return;
    }
    const createResult = await createPost({
      data: {
        title,
        draft: true,
        collabEditorDialogue: true,
        coauthorStatuses: participants.map(userId => ({userId, confirmed: false, requested: false})),
        shareWithUsers: participants,
        sharingSettings: {
          anyoneWithLinkCan: "none",
          explicitlySharedUsersCan: "edit",
        },
      },
    });
    if (createResult?.data?.createPost?.data) {
      const post = createResult?.data?.createPost?.data;
      if (post) {
        const postId = post._id;
        const postEditUrl = `/editPost?postId=${postId}`;
        history.push(postEditUrl);
        onClose();
      }
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
      <h2 className={classes.header}>Start Dialogue</h2>
      <p className={classes.info}>
        Invite users to a conversation where you can explore ideas, interview each other, or debate a topic. You can edit the transcript, and when you're ready, publish it as a post.
      </p>
      <p className={classes.info}>
        You'll be able to see each other's comments as you're writing.
      </p>
      <Input
        type="text"
        placeholder="Dialogue Title"
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
        <Button onClick={createDialogue} disabled={!!loading}>
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

