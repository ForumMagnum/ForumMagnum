import React, { useState } from 'react';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

export const formStyles = {
  '& .form-section-default > div': {
    display: "flex",
    flexWrap: "wrap",
  },
  '& .ContentStyles-commentBody': {
    fontSize: '1.1rem',
  },
  '& .form-component-EditorFormComponent': {
    marginBottom: 0,
    marginTop: 0,
    width: '100%',
  },
  '& .form-component-default, & .MuiTextField-textField': {
    marginBottom: 0,
    marginTop: 0,
    width: 150,
    marginRight: 20
  },
}

const styles = (theme: ThemeType) => ({
  root: {
    width: '100%',
    ...commentBodyStyles(theme, true),
    marginTop: 0,
    padding: '0 6px',
    display: 'flex',
    alignItems: 'center',
    '&:hover $bottomButton': {
      opacity: .5
    }
  },
  unapproved: {
    opacity: .5,
    '&:hover': {
      opacity: 1
    }
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
    ...formStyles,
    marginBottom: 12,
    marginTop: 12,
    width: '100%',
  },
  explanationContainer: {
    cursor: 'text',
    paddingBottom: 2
  },
  checkbox: {
    width: 24,
    height: 24,
    paddingRight: 24,
    paddingLeft: 14,
    '& svg': {
      width: 16,
      height: 16,
    }
  },
  instancesOfJargonCount: {
    width: 30,
    textAlign: 'center', 
    whiteSpace: 'nowrap',
    color: theme.palette.grey[600],
  },
  definition: {
    lineHeight: 1.6,
    height: '1.8rem',
    overflow: 'hidden',
    minWidth: 100,
    paddingRight: 8,
    color: theme.palette.grey[500],
    '& strong, & b': {
      color: theme.palette.grey[900],
      marginRight: 8
    }
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

const JargonEditorRow = ({classes, jargonTerm, instancesOfJargonCount, setShowMoreTerms}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: JargonTerms,
  instancesOfJargonCount?: number,
  setShowMoreTerms: (expanded: boolean) => void,
}) => {

  const [edit, setEdit] = useState(false);

  const {mutate: updateJargonTerm} = useUpdate({
    collectionName: "JargonTerms",
    fragmentName: 'JargonTerms',
  });

  const handleActiveChange = () => {
    const newDeleteStatus = !jargonTerm.approved ? false : jargonTerm.deleted;

    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        approved: !jargonTerm.approved,
        deleted: newDeleteStatus,
      },
      optimisticResponse: {
        ...jargonTerm,
        approved: !jargonTerm.approved,
        deleted: newDeleteStatus,
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
  const { JargonTooltip, WrappedSmartForm, ContentItemBody, LWTooltip } = Components;

  const jargonDefinition = jargonTerm?.contents?.html ?? '';

  return <div className={classes.root}>
      <div onClick={handleActiveChange}>
        <Checkbox checked={jargonTerm.approved} className={classes.checkbox} />
      </div>
      {edit ? <div className={classes.formStyles}>
          <WrappedSmartForm
            collectionName="JargonTerms"
            documentId={jargonTerm._id}
            mutationFragmentName={'JargonTerms'}
            queryFragmentName={'JargonTerms'}
            successCallback={() => setEdit(false)}
            cancelCallback={() => setEdit(false)}
            formComponents={{ FormSubmit: Components.JargonSubmitButton }}
            prefetchedDocument={jargonTerm}
          />
        </div>
      :  <JargonTooltip
          term={jargonTerm.term}
          definitionHTML={jargonDefinition}
          altTerms={jargonTerm.altTerms ?? []}
          humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited}
          placement="bottom-end"
          approved={jargonTerm.approved}
          deleted={jargonTerm.deleted}
          forceTooltip={true}
        >
          <div className={classNames(classes.explanationContainer, !jargonTerm.approved && classes.unapproved)} onClick={() => {
            setShowMoreTerms(true);
            setEdit(true);
          }}>
            <ContentItemBody className={classes.definition} dangerouslySetInnerHTML={{ __html: jargonDefinition }} />
          </div>
        </JargonTooltip>}
      <LWTooltip title={<div>{jargonTerm.term} is used {instancesOfJargonCount} times in this post</div>} placement="right">
        <div className={classNames(classes.instancesOfJargonCount, !jargonTerm.approved && classes.unapproved)}>
          {instancesOfJargonCount}
        </div>
      </LWTooltip>
      <LWTooltip title={<div><div>Remove from list</div><div><em>(You can unhide it later)</em></div></div>} placement="right">
        <span onClick={() => handleDelete()} className={classes.bottomButton}>
          x
        </span>
      </LWTooltip>  
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
