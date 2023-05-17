import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card'
import EditIcon from '@material-ui/icons/Edit'
import { Link } from '../../lib/reactRouterWrapper';

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
  },
  reason: {
    '&:hover $editIcon': {
      opacity: 1
    }
  },
  editIcon: {
    height: 12,
    color: theme.palette.grey[500],
    opacity: .2
  },
  loadMore: {
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 20
  }
});

const ContentRejectionDialog = ({classes, rejectContent}: {
  classes: ClassesType,
  rejectContent: (reason: string) => void,
}) => {
  const { LWTooltip, ContentItemBody, ContentStyles, LoadMore } = Components;

  const [selections, setSelections] = useState<Record<string,boolean>>({});
  const [hideTextField, setHideTextField] = useState(true);
  const [rejectedReason, setRejectedReason] = useState('');

  const { results, loadMoreProps } = useMulti({
    collectionName: 'ModerationTemplates',
    terms: { view: 'moderationTemplatesList', collectionName: "Rejections" },
    fragmentName: 'ModerationTemplateFragment',
    enableTotal: true,
    limit: 6
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
    {results.map((template) => {
      return <div key={`rejection-reason-${template.name}`} className={classes.reason}>
        <LWTooltip placement="right-end" tooltip={false} title={<Card className={classes.card}>
          <ContentStyles contentType='comment'>
            <ContentItemBody dangerouslySetInnerHTML={{__html: template.contents?.html || ""}} />
          </ContentStyles>
        </Card>}>
          <div>
            <Checkbox
              checked={selections[template.name]}
              onChange={(_, checked) => composeRejectedReason(template.name, checked)}
              className={classes.checkbox}
            />
            {template.name} <Link to={`/admin/moderationTemplates#${template._id}`} target="_blank"><EditIcon className={classes.editIcon}/></Link>
          </div>
        </LWTooltip>
      </div>
    })}
    <div className={classes.loadMore}>
      <LoadMore {...loadMoreProps} />
    </div>
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
