import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import ClearIcon from '@material-ui/icons/Clear';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

const APPROVED_PADDING = 10;

const styles = (theme: ThemeType) => ({
  root: {
    width: '100%',
    display: 'flex',
    ...commentBodyStyles(theme),
    marginBottom: 0,
    marginTop: 0,
    alignItems: 'flex-start',
    '&:last-child $approved': {
      borderBottom: 'none',
    },
    '&:first-child $approved': {
      paddingTop: 0,
    },
    '&:hover $arrowRightButton, &:hover $hideIcon, &:hover $leftButton': {
      opacity: .5
    }
  },
  flex: {
    display: 'flex',
    flexGrow: 1
  },
  toggleAndEdit: {
    marginRight: 8,
  },
  unapproved: {
    opacity: .5,
    cursor: 'pointer',
    whiteSpace: 'pre',
    paddingTop: 4,
    paddingBottom: 4,
    '&:hover': {
      opacity: 1,
    }
  },
  approved: {
    display: 'flex',
    flexGrow: 1,
    border: '1px solid transparent',
    padding: APPROVED_PADDING,
    flexDirection: 'row',
    ...commentBodyStyles(theme),
    fontSize: '1.1rem',
    marginBottom: 0,
    marginTop: 6,
    borderBottom: theme.palette.border.commentBorder,
  },
  input: {
    flexGrow: 1,
    marginRight: 8,
  },
  toggleSwitch: {
  },
  editButton: {
    cursor: 'pointer',
    fontSize: '1rem',
  },
  leftButtons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: APPROVED_PADDING + 6,
    marginLeft: 6
  },
  leftButton: {
    opacity: 0,
    transition: 'opacity 0.1s',
    '&:hover': {
      opacity: .7
    },
    minHeight: "auto !important",
    minWidth: "auto !important",
    cursor: 'pointer',
    height: 26,
    padding: 4,
    paddingLeft: 4,
    width: 26,
  },
  hideIcon: {
    cursor: 'pointer',
    color: theme.palette.grey[500],
    height: 16,
    width: 16,
    marginRight: 8,
    opacity: 0,
    '&:hover': {
      opacity: 1
    }
  },
  arrowRightButton: {
    marginLeft: 8,
    cursor: 'pointer',
    color: theme.palette.grey[500],
    height: 18,
    width: 18,
    opacity: 0,
    '&:hover': {
      opacity: 1
    }
  }
});

const submitStyles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: 20,
    justifyContent: 'end',
    height: 36,
  },
  submitButton: {
    color: theme.palette.secondary.main
  },
  cancelButton: {},
});

const JargonSubmitButton = ({ submitForm, cancelCallback, classes }: FormButtonProps & { classes: ClassesType<typeof submitStyles> }) => {
  const { Loading } = Components;

  const [loading, setLoading] = useState(false);

  const wrappedSubmitForm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    await submitForm(e);
    setLoading(false);
  }

  return <div className={classes.root}>
    {!loading && <Button onClick={cancelCallback} className={classes.cancelButton}>Cancel</Button>}
    {!loading && <Button onClick={wrappedSubmitForm} className={classes.submitButton}>Submit</Button>}
    {loading && <Loading />}
  </div>
};

export const JargonEditorRow = ({classes, jargonTerm}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: JargonTermsFragment,
}) => {
  const { LWTooltip, WrappedSmartForm, ContentItemBody, ForumIcon, Row } = Components;

  const [edit, setEdit] = useState(false);

  const {mutate: updateJargonTerm} = useUpdate({
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  });

  const handleActiveChange = () => {
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        approved: !jargonTerm.approved
      },
      optimisticResponse: {
        ...jargonTerm,
        approved: !jargonTerm.approved,
      }
    })
  }

  const handleDelete = () => {
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        deleted: true
      },
    })
  }

  const termContentElement = <ContentItemBody dangerouslySetInnerHTML={{__html: jargonTerm?.contents?.originalContents?.data ?? ''}}/>;

  if (jargonTerm.approved) {
    return <div className={classes.root}>
      <div className={classes.leftButtons}>
        <LWTooltip title={<div><div>Hide term</div><div>You can get it back later</div></div>} placement="left">
          <span onClick={() => handleActiveChange()}>
            <ForumIcon className={classes.leftButton} icon="ArrowLeft"/>
          </span>
        </LWTooltip>
        <LWTooltip title="Edit term/definition" placement="left">
          <span onClick={() => setEdit(true)}>
            <ForumIcon className={classes.leftButton} icon="Edit"/>
          </span>
        </LWTooltip>
      </div>
      <div className={classNames(classes.flex, classes.approved)}>
        {edit ? <WrappedSmartForm
            collectionName="JargonTerms"
            documentId={jargonTerm._id}
            mutationFragment={getFragment('JargonTermsFragment')}
            queryFragment={getFragment('JargonTermsFragment')}
            successCallback={() => setEdit(false)}
            cancelCallback={() => setEdit(false)}
            formComponents={{ FormSubmit: Components.JargonSubmitButton }}
            prefetchedDocument={jargonTerm}
          />
        : termContentElement}
      </div>
    </div>
  } else {
    return <div className={classes.root}>
      <div className={classes.flex}>
        <LWTooltip title={<div><p><em>Click to enable jargon hoverover</em></p>{termContentElement}</div>} placement='left'>
          <Row>
            <ForumIcon className={classes.hideIcon} icon="Clear" onClick={() => handleDelete()}/>
            <div className={classes.unapproved} dangerouslySetInnerHTML={{__html: jargonTerm.term}} onClick={() => handleActiveChange()}  />
            <ForumIcon className={classes.arrowRightButton} icon="ArrowRight" onClick={() => handleActiveChange()}/>
          </Row>
        </LWTooltip>
      </div>
    </div>
  }
}

const JargonSubmitButtonComponent = registerComponent('JargonSubmitButton', JargonSubmitButton, {styles: submitStyles});
const JargonEditorRowComponent = registerComponent('JargonEditorRow', JargonEditorRow, {styles});

declare global {
  interface ComponentTypes {
    JargonSubmitButton: typeof JargonSubmitButtonComponent,
    JargonEditorRow: typeof JargonEditorRowComponent
  }
}
