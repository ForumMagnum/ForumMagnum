import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { Paper, Card }from '@/components/widgets/Paper';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import EditIcon from '@/lib/vendor/@material-ui/icons/src/Edit'
import { Link } from '../../lib/reactRouterWrapper';
import LWTooltip from "../common/LWTooltip";
import { ContentItemBody } from "../contents/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import LoadMore from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
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
    paddingBottom: 6
  },
  topReason: {
    fontWeight: 600
  },
  nonTopReason: {
    opacity: .6
  }
});

const RejectContentDialog = ({classes, rejectContent}: {
  classes: ClassesType<typeof styles>,
  rejectContent: (reason: string) => void,
}) => {
  const [selections, setSelections] = useState<Record<string,boolean>>({});
  const [hideTextField, setHideTextField] = useState(true);
  const [rejectedReason, setRejectedReason] = useState('');
  const [showMore, setShowMore] = useState(false)

  const { results: rejectionTemplates, loadMoreProps } = useMulti({
    collectionName: 'ModerationTemplates',
    terms: { view: 'moderationTemplatesList', collectionName: "Rejections" },
    fragmentName: 'ModerationTemplateFragment',
    enableTotal: true,
    limit: 25
  });

  if (!rejectionTemplates) return null;
  
  const rejectionReasons = Object.fromEntries(rejectionTemplates.map(({name, contents}) => [name, contents?.html]))

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
    {rejectionTemplates.map((template, i) => {
      const top6 = i < 6;
      return <div key={`rejection-reason-${template.name}`} className={classes.reason}>
        <LWTooltip placement="right-end" tooltip={false} title={<Card className={classes.card}>
          <ContentStyles contentType='comment'>
            <ContentItemBody dangerouslySetInnerHTML={{__html: template.contents?.html || ""}} />
          </ContentStyles>
        </Card>}>
          <div className={top6 ? classes.topReason : classes.nonTopReason}>
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

export default registerComponent('RejectContentDialog', RejectContentDialog, { styles });


