import React, { useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { CreateClaimDialogProps } from './claimsConfigType';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import LWDialog from "../../common/LWDialog";
import { Typography } from "../../common/Typography";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const ElicitQuestionFragmentMutation = gql(`
  mutation createElicitQuestionCreateClaimDialog($data: CreateElicitQuestionDataInput!) {
    createElicitQuestion(data: $data) {
      data {
        ...ElicitQuestionFragment
      }
    }
  }
`);

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
  const [create] = useMutation(ElicitQuestionFragmentMutation);

  function submit() {
    void (async () => {
      const {data} = await create({
        variables: {
          data: {
            title,
            notes: "",
          }
        },
      });
      if (data) {
        const result = data.createElicitQuestion?.data;
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
        <button
          disabled={!title.length}
          className={classes.button}
          onClick={submit}
        >
          Submit
        </button>
        <button className={classes.button} onClick={onCloseAndCancel}>Cancel</button>
      </div>
    </div>
  </LWDialog>
}

export default registerComponent('CreateClaimDialog', CreateClaimDialog);




