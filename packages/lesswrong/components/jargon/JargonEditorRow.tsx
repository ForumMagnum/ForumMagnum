import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Button from '@material-ui/core/Button';

const APPROVED_PADDING = 10;

const styles = (theme: ThemeType) => ({
  root: {
    width: '100%',
    ...commentBodyStyles(theme),
    pointerEvents: 'undefined',
    marginTop: 0,
    alignItems: 'flex-start',
    padding: 10,
    borderBottom: theme.palette.border.commentBorder,
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover $bottomButton': {
      opacity: .5
    }
  },
  toggleAndEdit: {
    marginRight: 8,
  },
  unapproved: {
    opacity: .5,
  },
  explanation: {
    fontSize: '1.1rem',
    marginBottom: 0,
    marginTop: 0,
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
  },
  deleted: {
    opacity: .4,
  },
  bottomButtons: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomButton: {
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 4,
    fontSize: '1rem',
    opacity: .1,
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
      opacity: 1
    }
  },
  formStyles: {
    '& .form-section-default > div': {
      display: "flex",
      flexWrap: "wrap",
    },
    '& .form-component-EditorFormComponent': {
      marginBottom: 0,
    },
    '& .form-component-default, & .MuiTextField-textField': {
      marginBottom: 0,
      marginTop: 0,
      width: 150,
      marginRight: 20
    },
  },
  explanationContainer: {
    cursor: 'pointer',
  }
});

const submitStyles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: -6,
    justifyContent: 'end',
    height: 36,
  },
  submitButton: {
    color: theme.palette.secondary.main
  },
  cancelButton: {},
});

// Jargon submit button

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


// Jargon editor row

export const JargonEditorRow = ({classes, jargonTerm, deleted}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: JargonTermsFragment,
  deleted?: boolean,
}) => {
  const { LWTooltip, WrappedSmartForm, ContentItemBody, ForumIcon, Row, ContentItemTruncated } = Components;

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
      optimisticResponse: {
        ...jargonTerm,
        deleted: true,
      }
    })
  }

  const jargonDefinition = jargonTerm?.contents?.originalContents?.data ?? '';

  return <div className={classes.root}>
      {edit ? <div className={classes.formStyles}>
          <WrappedSmartForm
            collectionName="JargonTerms"
            documentId={jargonTerm._id}
            mutationFragment={getFragment('JargonTermsFragment')}
            queryFragment={getFragment('JargonTermsFragment')}
            successCallback={() => setEdit(false)}
            cancelCallback={() => setEdit(false)}
            formComponents={{ FormSubmit: Components.JargonSubmitButton }}
            prefetchedDocument={jargonTerm}
          />
        </div>
      : <div className={classes.explanationContainer} onClick={() => handleActiveChange()}>
         <ContentItemBody dangerouslySetInnerHTML={{__html: jargonDefinition}} className={classNames(classes.explanation, !jargonTerm.approved && classes.unapproved)}/>
        </div>}
      {/* <div className={classes.altTerms}>
        {jargonTerm.altTerms?.map((altTerm) => <div key={altTerm}>{altTerm}</div>)}
      </div> */}
    {!edit && <div className={classes.bottomButtons}>
      <LWTooltip title={<div>Remove from list</div>} placement="bottom">
        <span onClick={() => handleDelete()} className={classes.bottomButton}>
          HIDE
        </span>
      </LWTooltip>
      {jargonTerm.approved && <LWTooltip title={"Don't show this tooltip on your post"} placement="bottom">
        <span onClick={() => handleActiveChange()} className={classes.bottomButton}>
          UNAPPROVE
        </span>
      </LWTooltip>}
      {!jargonTerm.approved && <LWTooltip title="Show this tooltip on your post" placement="bottom">
        <span onClick={() => setEdit(true)} className={classes.bottomButton}>
          APPROVE
        </span>
      </LWTooltip>}
      <LWTooltip title="Edit term/definition" placement="bottom">
        <span onClick={() => setEdit(true)} className={classes.bottomButton}>
          EDIT
        </span>
      </LWTooltip>
    </div>}
  </div>
}

const JargonSubmitButtonComponent = registerComponent('JargonSubmitButton', JargonSubmitButton, {styles: submitStyles});
const JargonEditorRowComponent = registerComponent('JargonEditorRow', JargonEditorRow, {styles});

declare global {
  interface ComponentTypes {
    JargonSubmitButton: typeof JargonSubmitButtonComponent,
    JargonEditorRow: typeof JargonEditorRowComponent
  }
}
