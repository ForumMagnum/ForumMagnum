import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { useCreate } from '@/lib/crud/withCreate';
import { CreateClaimDialogProps } from './claimsConfigType';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Input from '@/lib/vendor/@material-ui/core/src/Input';

const styles = defineStyles("CreateClaimDialog", (theme: ThemeType) => ({
  root: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 16,
  },
  titleInput: {
    marginTop: 16,
    "& input": {
      width: 250,
    },
  },
  buttons: {
    marginTop: 8,
  },
  button: {
    padding: 8,
    margin: 4,
  },
}))

const CreateClaimDialog = ({initialTitle, onSubmit, onCancel, onClose}: CreateClaimDialogProps & {
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  const [title,setTitle] = useState(initialTitle);
  const {create} = useCreate({
    collectionName: "ElicitQuestions",
    fragmentName: "ElicitQuestionFragment",
  });
  const { LWDialog, Button, Typography } = Components;

  function submit() {
    void (async () => {
      const {data} = await create({
        data: {
          title,
          notes: "",
        },
      });
      if (data) {
        const result = data.createElicitQuestion.data as ElicitQuestionFragment;
        onSubmit(result);
      }
      onClose();
    })();
  }
  
  function onCloseAndCancel() {
    onClose();
    onCancel();
  }

  return <LWDialog open={true}>
    <div className={classes.root}>
      <Typography variant="display1">Create Claim</Typography>
      
      <div className={classes.titleInput}>
        <Input placeholder="Prediction or claim" value={title} onChange={ev => setTitle(ev.currentTarget.value)}/>
      </div>
      
      <div className={classes.buttons}>
        <Button
          disabled={!title.length}
          className={classes.button}
          onClick={submit}
        >
          Submit
        </Button>
        <Button className={classes.button} onClick={onCloseAndCancel}>Cancel</Button>
      </div>
    </div>
  </LWDialog>
}

const CreateClaimDialogComponent = registerComponent('CreateClaimDialog', CreateClaimDialog);
export default CreateClaimDialogComponent;

declare global {
  interface ComponentTypes {
    CreateClaimDialog: typeof CreateClaimDialogComponent
  }
}

