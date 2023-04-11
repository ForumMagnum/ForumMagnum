import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import classNames from 'classnames';
import React, { ChangeEventHandler, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  dialogContent: {
    width: 400,
    backgroundColor: theme.palette.panelBackground.default,
    padding: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  rejectionCheckboxes: {
    display: 'flex',
    flexDirection: 'column'
  },
  checkbox: {
    paddingTop: 6,
    paddingBottom: 6
  },
  modalTextField: {
    marginTop: 10,
  },
  hideModalTextField: {
    display: 'none'
  }
});

const ContentRejectionDialog = ({classes, rejectContent}: {
  classes: ClassesType,
  rejectContent: (reason: string) => void,
}) => {
  const { LWTooltip } = Components;

  const [selections, setSelections] = useState<Record<string,boolean>>({});
  const [hideTextField, setHideTextField] = useState(true);
  const [rejectedReason, setRejectedReason] = useState('');

  const rejectionReasons = {
    'Quality': '<li>This is bad!</li>',
    'AI 101': '<li>Go read some more AI stuff!</li>',
    'Too Long': '<li>tl;dr</li>'
  };

  const handleClick = () => {
    rejectContent(rejectedReason);
  };

  const composeRejectedReason = (label: string, checked: boolean) => {
    const newSelections = {...selections, [label]: checked};
    setSelections(newSelections);

    const composedReason = `<ul>${Object.entries(newSelections)
      .filter(([_, reasonSelected]) => reasonSelected)
      .map(([reasonKey]) => rejectionReasons[reasonKey])
      .join('')}</ul>`;

    setRejectedReason(composedReason);
  };

  const dialogContent = <div className={classes.rejectionCheckboxes}>
    {Object.entries(rejectionReasons).map(([label, description]) => {
      return <span>
        <Checkbox
          checked={selections[label]}
          onChange={(_, checked) => composeRejectedReason(label, checked)}
          className={classes.checkbox}
        />
        <LWTooltip title={description}>
          {label}
        </LWTooltip>
      </span>
    })}
    <TextField
      id="comment-moderation-rejection-reason"
      label="Full message"
      className={classNames(classes.modalTextField, { [classes.hideModalTextField]: hideTextField })}
      value={rejectedReason}
      onChange={(event) => setRejectedReason(event.target.value)}
      fullWidth
      multiline
    />
  </div>
  
  return (
    <Paper>
      <div className={classes.dialogContent}>
        {dialogContent}
        <Button onClick={() => setHideTextField(!hideTextField)}>
          Edit Message
        </Button>
        <Button onClick={handleClick}>
          Reject
        </Button>
      </div>
    </Paper>
  )
};

const ContentRejectionDialogComponent = registerComponent('ContentRejectionDialog', ContentRejectionDialog, { styles });

declare global {
  interface ComponentTypes {
    ContentRejectionDialog: typeof ContentRejectionDialogComponent
  }
}
