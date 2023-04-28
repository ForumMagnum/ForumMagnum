import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card'

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
  },
  card: {
    padding: 12,
    width: 500,
  }
});

const ContentRejectionDialog = ({classes, rejectContent}: {
  classes: ClassesType,
  rejectContent: (reason: string) => void,
}) => {
  const { LWTooltip, ContentItemBody, ContentStyles } = Components;

  const [selections, setSelections] = useState<Record<string,boolean>>({});
  const [hideTextField, setHideTextField] = useState(true);
  const [rejectedReason, setRejectedReason] = useState('');

  const { results } = useMulti({
    collectionName: 'ModerationTemplates',
    terms: { view: 'rejectionModerationTemplates' },
    fragmentName: 'ModerationTemplateFragment'
  });

  if (!results) return null;
  
  const rejectionReasons = Object.fromEntries(results.map(({name, contents}) => [name, contents?.html]))

  const handleClick = () => {
    rejectContent(rejectedReason);
  };

  const composeRejectedReason = (label: string, checked: boolean) => {
    const newSelections = {...selections, [label]: checked};
    setSelections(newSelections);

    const composedReason = `<ul>${
      Object.entries(newSelections)
        .filter(([_, reasonSelected]) => reasonSelected)
        .map(([reasonKey]) => `<li>${rejectionReasons[reasonKey]}</li>`)
        .join('')
    }</ul>`;

    setRejectedReason(composedReason);
  };

  const dialogContent = <div className={classes.rejectionCheckboxes}>
    {Object.entries(rejectionReasons).map(([label, description]) => {
      return <span key={`rejection-reason-${label}`}>
        <LWTooltip placement="right-end" tooltip={false} title={<Card className={classes.card}>
          <ContentStyles contentType='comment'>
            <ContentItemBody dangerouslySetInnerHTML={{__html: description || ""}} />
          </ContentStyles>
        </Card>}>
          <div>
            <Checkbox
              checked={selections[label]}
              onChange={(_, checked) => composeRejectedReason(label, checked)}
              className={classes.checkbox}
            />
            {label}
          </div>
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
        <Button onClick={handleClick}>
          Reject
        </Button>
        <Button onClick={() => setHideTextField(!hideTextField)}>
          Edit Message
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
