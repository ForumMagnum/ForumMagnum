
import React, { useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { Components, getFragment, registerComponent } from "@/lib/vulcan-lib";
import { useMulti } from "@/lib/crud/withMulti";
import Button from '@material-ui/core/Button';
import classNames from "classnames";

const styles = defineStyles("SummariesEditForm", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  summaryRowFormStyles: {
    '& .form-section-default > div': {
      display: "flex",
      flexWrap: "wrap",
    },
    '& .ContentStyles-commentBody': {
      fontSize: 14.3,
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
    '& .MuiInputLabel-formControl': {
      display: 'none',
    },
    '& label + .MuiInput-formControl': {
      ...theme.typography.body2,
      marginTop: 0,
    },
    '& .MuiInputBase-input': {
      paddingTop: 0,
    }
  },
  summaryEditorRow: {},
  summaryContentStylesWrapper: {
    maxWidth: '100%',
    marginTop: 2,
    marginBottom: 0,
  },
  summaryContent: {
    height: 32,
    fontSize: 14.3,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    paddingLeft: 1,
    paddingRight: 8,
    minWidth: 100,
    maxWidth: '100%',
    color: theme.palette.grey[500],
    marginTop: 0,
    marginBottom: 0,
    '& strong, & b': {
      color: theme.palette.grey[900],
      marginRight: 8,
    },
    '& p': {
      display: 'inline',
    },
  },
  summaryTooltipWrapperElement: {
    maxWidth: '100%',
  },
  summaryTitle: {
    ...theme.typography.body2,
    minWidth: 65,
  },
  submitButtons: {
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
  hide: {
    display: 'none',
  }
}));

const SummarySubmitButtons = ({ submitForm, cancelCallback }: FormButtonProps) => {
  const { Loading } = Components;
  const classes = useStyles(styles);

  const [loading, setLoading] = useState(false);

  const wrappedSubmitForm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    await submitForm(e);
    setLoading(false);
  }

  return <div className={classes.submitButtons}>
    {!loading && <Button onClick={cancelCallback} className={classes.cancelButton}>Cancel</Button>}
    {!loading && <Button onClick={wrappedSubmitForm} className={classes.submitButton}>Submit</Button>}
    {loading && <Loading />}
  </div>
};

const SummaryEditorRow = ({ summary, refetch }: {
  summary: MultiDocumentContentDisplay,
  refetch: () => Promise<void>,
}) => {
  const { WrappedSmartForm, LWTooltip, ContentItemBody, ContentStyles } = Components;
  const classes = useStyles(styles);

  const [edit, setEdit] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  const summaryContent = <ContentItemBody className={classes.summaryContent} dangerouslySetInnerHTML={{ __html: summary.contents?.html ?? '' }} />;
  const tooltipContent = <ContentItemBody dangerouslySetInnerHTML={{ __html: summary.contents?.html ?? '' }} />;

  return (<span className={classes.summaryEditorRow}>
    <div className={classNames(edit && classes.hide)} onClick={() => setEdit(true)}>
      <LWTooltip title={tooltipContent} placement="right" className={classes.summaryTooltipWrapperElement}>
        <div className={classes.summaryTitle}>{`${summary.title}`}</div>
        <ContentStyles contentType='comment' className={classes.summaryContentStylesWrapper}>{summaryContent}</ContentStyles>
      </LWTooltip>
    </div>
    <div className={classNames(classes.summaryRowFormStyles, !edit && classes.hide)}>
      <WrappedSmartForm
        key={mountKey}
        collectionName="MultiDocuments"
        documentId={summary._id}
        mutationFragment={getFragment('MultiDocumentContentDisplay')}
        queryFragment={getFragment('MultiDocumentContentDisplay')}
        prefetchedDocument={summary}
        successCallback={() => {
          setEdit(false);
          // This is a horrible hack to get around the problem where, because we initialize the page with the form mounted for snappy click-through,
          // clicking into the form a second time after editing a summary leaves us with an empty form.  (I still haven't figured out exactly why.)
          void refetch().then(() => setMountKey(mountKey + 1));
        }}
        cancelCallback={() => setEdit(false)}
        formComponents={{ FormSubmit: SummarySubmitButtons }}
        removeFields={['title', 'tabSubtitle']}
      />
    </div>
  </span>);
}

const SummariesEditForm = ({ document }: {
  // TODO: make this accept either a tag or a lens
  document: TagPageWithArbitalContentFragment | MultiDocumentContentDisplay,
}) => {
  const classes = useStyles(styles);
  const { results, refetch } = useMulti({
    collectionName: 'MultiDocuments',
    fragmentName: 'MultiDocumentContentDisplay',
    terms: {
      view: 'summariesByParentId',
      parentDocumentId: document._id,
    },
  })
  return <span className={classes.root}>{results?.map((summary) => <SummaryEditorRow key={summary._id} summary={summary} refetch={refetch} />)}</span>;
};

const SummariesEditFormComponent = registerComponent("SummariesEditForm", SummariesEditForm);

declare global {
  interface ComponentTypes {
    SummariesEditForm: typeof SummariesEditFormComponent
  }
}

export default SummariesEditFormComponent;
