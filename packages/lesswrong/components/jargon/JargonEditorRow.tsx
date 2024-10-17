import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import CloseIcon from '@material-ui/icons/Close';

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
    paddingBottom: 6,
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
    paddingTop: APPROVED_PADDING,
    marginLeft: 6
  },
  leftButton: {
    opacity: 0,
    transition: 'opacity 0.1s',
    '$root:hover &': {
      opacity: .3
    },
    '&:hover': {
      opacity: .7
    },
    minHeight: "auto !important",
    minWidth: "auto !important",
    cursor: 'pointer',
    height: 24,
    padding: 4,
    paddingLeft: 4,
    width: 24,
  },
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
  const { LWTooltip, WrappedSmartForm, ContentItemBody } = Components;

  // const [isActive, setIsActive] = useState(jargonTerm.approved);
  const [edit, setEdit] = useState(false);
  // TODO: make the hidden state conditional on whether any terms are approved at all, and then hide the unapproved terms.  (But maybe put them in a collapsed section instead?)
  const [hidden, setHidden] = useState(false);

  const {mutate: updateJargonTerm} = useUpdate({
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  });

  const handleActiveChange = (value: boolean) => {
    // setIsActive(value);
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        approved: value
      },
    })
  }

  // TODO: remove this functionality
  const handleDelete = () => {
    setHidden(true);
    // void updateJargonTerm({
    //   selector: { _id: jargonTerm._id },
    //   data: {
    //     deleted: true
    //   },
    // })
  }

  if (hidden) return null;

  const termContentElement = <ContentItemBody dangerouslySetInnerHTML={{__html: jargonTerm?.contents?.originalContents?.data ?? ''}}/>;

  return <div className={classes.root}>
    {jargonTerm.approved &&<div className={classes.leftButtons}>
      <LWTooltip title={<div><div>Hide term</div><div>You can get it back later</div></div>} placement="left">
        <span onClick={() => handleDelete()}>
          <CloseIcon className={classes.leftButton} />
        </span>
      </LWTooltip>
      <LWTooltip title="Edit term/definition" placement="left">
        <span onClick={() => setEdit(true)}>
          <EditIcon className={classes.leftButton} />
        </span>
      </LWTooltip>
    </div>}
    <div className={classNames(classes.flex, jargonTerm.approved && classes.approved)}>
      {!jargonTerm.approved && <LWTooltip title={<div><p><em>Click to enable jargon hoverover</em></p>{termContentElement}</div>}>
        <div dangerouslySetInnerHTML={{__html: jargonTerm.term}} onClick={() => handleActiveChange(!jargonTerm.approved)} className={classes.unapproved} />
      </LWTooltip>}
      {jargonTerm.approved && (edit
        ? <WrappedSmartForm
            collectionName="JargonTerms"
            documentId={jargonTerm._id}
            mutationFragment={getFragment('JargonTermsFragment')}
            queryFragment={getFragment('JargonTermsFragment')}
            successCallback={() => setEdit(false)}
            cancelCallback={() => setEdit(false)}
            formComponents={{ FormSubmit: Components.JargonSubmitButton }}
            prefetchedDocument={jargonTerm}
          />
        : termContentElement
      )}
    </div>
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
