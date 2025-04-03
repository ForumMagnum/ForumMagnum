import React, { useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { useMulti } from "@/lib/crud/withMulti";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classNames from "classnames";
import { makeSortableListComponent } from "../form-components/sortableList";
import { gql, useMutation } from "@apollo/client";
import { SortableHandle as sortableHandle } from "react-sortable-hoc";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";

const styles = defineStyles("SummariesEditForm", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  topRow: {
    display: 'flex',
    gap: '28px',
  },
  topRowText: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
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
    '& .form-component-ReorderItem': {
      marginBottom: 0,
      marginTop: 0,
    },
    '& .MuiInputLabel-formControl': {
      marginTop: -16,
    },
    '& label + .MuiInput-formControl': {
      ...theme.typography.body2,
      marginTop: 0,
    },
    '& .MuiInputBase-input': {
      paddingTop: 0,
    }
  },
  summaryEditorRow: {
    flex: 1,
    minWidth: 0,
    // On hover, make the edit icon darker
    '&:hover $editIcon': {
      color: theme.palette.grey[900],
    },
    // When editing, hide the summary title label
    '& .MuiInputLabel-shrink': {
      display: 'none',
    },
  },
  editing: {},
  summaryContentStylesWrapper: {
    maxWidth: '100%',
    marginTop: 4,
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
  deletedSummary: {
    textDecoration: 'line-through',
  },
  summaryTooltipWrapperElement: {
    maxWidth: '100%',
  },
  summaryTitle: {
    ...theme.typography.body2,
    minWidth: 65,
    display: 'flex',
    alignItems: 'center',
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
  deleteButton: {
    color: theme.palette.error.main,
  },
  hide: {
    display: 'none',
  },
  newSummaryButtonTooltip: {
    width: 'min-content',
    height: 'min-content',
  },
  newSummaryButton: {
    cursor: 'pointer',
    background: theme.palette.buttons.startReadingButtonBackground,
    borderRadius: 4,
    fontSize: 25,
    fontWeight: 900,
    marginRight: 10,
    width: 24,
    height: 24,
  },
  sortableListItem: {
    listStyleType: 'none',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  dragIndicatorIcon: {
    width: 16,
    height: 16,
    transform: 'rotate(-90deg)',
  },
  editIcon: {
    width: 14,
    height: 14,
    marginLeft: 6,
    color: theme.palette.grey[500],
  },
  dragHandle: {
    cursor: 'pointer',
    transform: 'rotate(-90deg)',
    flexShrink: 0,
    alignSelf: 'start',
    marginRight: 8,
    '& svg': {
      pointerEvents: 'none',
    },
  },
}));

const NO_SUMMARIES_TEXT = "There are no custom summaries written for this page, so users will see an excerpt from the beginning of the page when hovering over links to this page.  You can create up to 3 custom summaries; by default you should avoid creating more than one summary unless the subject matter benefits substantially from multiple kinds of explanation.";
const SUMMARIES_TEXT = "You can edit summaries by clicking on them, reorder them by dragging, or add a new one (up to 3).  By default you should avoid creating more than one summary unless the subject matter benefits substantially from multiple kinds of explanation.";
const MAX_SUMMARIES_TEXT = "You can edit these summaries by clicking on them and reorder them by dragging.  Pages can have up to 3 summaries.";

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
  const { WrappedSmartForm, LWTooltip, ContentItemBody, ContentStyles, ForumIcon } = Components;
  const classes = useStyles(styles);

  const [edit, setEdit] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  const summaryContent = <ContentItemBody className={classNames(classes.summaryContent, summary.deleted && classes.deletedSummary)} dangerouslySetInnerHTML={{ __html: summary.contents?.html ?? '' }} />;
  const tooltipContent = summary.deleted
    ? <span>This summary is deleted and will not be displayed to users.  You can undelete it by editing it and unchecking the "Deleted" checkbox.</span>
    : <ContentItemBody dangerouslySetInnerHTML={{ __html: summary.contents?.html ?? '' }} />;

  return (<span className={classNames(classes.summaryEditorRow, edit && classes.editing)}>
    <div className={classNames(edit && classes.hide)} onClick={() => setEdit(true)}>
      <LWTooltip title={tooltipContent} placement="right" className={classes.summaryTooltipWrapperElement}>
        <div className={classNames(classes.summaryTitle, summary.deleted && classes.deletedSummary)}>
          {summary.tabTitle}
          <ForumIcon icon="Edit" className={classes.editIcon} />
        </div>
        <ContentStyles contentType='comment' className={classes.summaryContentStylesWrapper}>{summaryContent}</ContentStyles>
      </LWTooltip>
    </div>
    <div className={classNames(classes.summaryRowFormStyles, !edit && classes.hide)}>
      <WrappedSmartForm
        key={mountKey}
        collectionName="MultiDocuments"
        documentId={summary._id}
        mutationFragmentName={'MultiDocumentContentDisplay'}
        queryFragmentName={'MultiDocumentContentDisplay'}
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

const NewSummaryEditor = ({ parentDocument, refetchSummaries, setNewSummaryEditorOpen }: {
  parentDocument: TagPageWithArbitalContentFragment | MultiDocumentContentDisplay,
  refetchSummaries: () => Promise<void>,
  setNewSummaryEditorOpen: (open: boolean) => void,
}) => {
  const { WrappedSmartForm } = Components;
  const classes = useStyles(styles);

  const collectionName: DbMultiDocument['collectionName'] = 'title' in parentDocument ? 'MultiDocuments' : 'Tags';

  const wrappedSuccessCallback = async () => {
    await refetchSummaries();
    setNewSummaryEditorOpen(false);
  };

  const prefilledProps = {
    parentDocumentId: parentDocument._id,
    collectionName,
    fieldName: 'summary',
  };

  return <div className={classes.summaryRowFormStyles}>
    <WrappedSmartForm
      collectionName="MultiDocuments"
      mutationFragmentName={'MultiDocumentContentDisplay'}
      queryFragmentName={'MultiDocumentContentDisplay'}
      successCallback={wrappedSuccessCallback}
      cancelCallback={() => setNewSummaryEditorOpen(false)}
      formComponents={{ FormSubmit: SummarySubmitButtons }}
      formProps={{
        editorHintText: "Write a custom summary to be displayed when users hover over links to this page.",
      }}
      prefilledProps={prefilledProps}
    />
  </div>
}

const SortableRowHandle = sortableHandle(() => {
  const { ForumIcon, LWTooltip } = Components;
  const classes = useStyles(styles);
  return <span className={classes.dragHandle}>
    <LWTooltip title="Drag to reorder" placement='left'>
      <ForumIcon icon="DragIndicator" className={classes.dragIndicatorIcon} />
    </LWTooltip>
  </span>;
});

function getSummariesHelpText(results: MultiDocumentContentDisplay[]) {
  if (results.length === 0) {
    return NO_SUMMARIES_TEXT;
  } else if (results.length === 3) {
    return MAX_SUMMARIES_TEXT;
  } else {
    return SUMMARIES_TEXT;
  }
}

const SummariesEditForm = ({ document }: {
  document: TagPageWithArbitalContentFragment | MultiDocumentContentDisplay,
}) => {
  const { Loading, ForumIcon, LWTooltip } = Components;

  const classes = useStyles(styles);
  const [newSummaryEditorOpen, setNewSummaryEditorOpen] = useState(false);
  const [reorderedSummaries, setReorderedSummaries] = useState<string[]>();

  const { results, loading, refetch } = useMulti({
    collectionName: 'MultiDocuments',
    fragmentName: 'MultiDocumentContentDisplay',
    terms: {
      view: 'summariesByParentId',
      parentDocumentId: document._id,
    },
  });

  const [reorderSummaries] = useMutation(gql`
    mutation reorderSummaries($parentDocumentId: String!, $parentDocumentCollectionName: String!, $summaryIds: [String!]!) {
      reorderSummaries(parentDocumentId: $parentDocumentId, parentDocumentCollectionName: $parentDocumentCollectionName, summaryIds: $summaryIds)
    }
  `);

  if (loading && !results) {
    return <Loading />;
  }

  if (!results) {
    return <span className={classes.root} />;
  }

  const icon = newSummaryEditorOpen ? 'MinusSmall' : 'PlusSmall';

  const showNewSummaryButton = results.length < 3;
  const newSummaryButton = showNewSummaryButton && (
    <LWTooltip title="Add a new summary" placement="right" className={classes.newSummaryButtonTooltip}>
      <a onClick={() => setNewSummaryEditorOpen(!newSummaryEditorOpen)}>
        <ForumIcon icon={icon} className={classes.newSummaryButton} />
      </a>
    </LWTooltip>
  );

  const topRow = <div className={classes.topRow}>
    <span className={classes.topRowText}>
      {getSummariesHelpText(results)}
    </span>
    {newSummaryButton}
  </div>;

  const summariesById = Object.fromEntries(results.map((summary) => [summary._id, summary]));

  // We need to do this inside of the component to get the summary by id, to pass through to SummaryEditorRow
  // Our sortable list wrapper currently only deal with arrays of strings, and it doesn't seem worth refactoring right now.
  const SortableSummaryRowList = makeSortableListComponent({
    renderItem: ({contents, removeItem, classes}) => {
      return <li className={classes.sortableListItem}>
        <SortableRowHandle />
        <SummaryEditorRow summary={summariesById[contents]} refetch={refetch} />
      </li>
    }
  });

  const parentDocumentCollectionName = 'title' in document ? 'MultiDocuments' : 'Tags';

  const displayedSummaries = reorderedSummaries
    ? reorderedSummaries.map((summaryId) => summariesById[summaryId])
    : results;

  return <span className={classes.root}>
    {topRow}
    {newSummaryEditorOpen && <NewSummaryEditor parentDocument={document} refetchSummaries={refetch} setNewSummaryEditorOpen={setNewSummaryEditorOpen} />}
    <SortableSummaryRowList
      value={displayedSummaries.map((summary) => summary._id)}
      setValue={(newValue: string[]) => {
        void reorderSummaries({
          variables: {
            parentDocumentId: document._id,
            parentDocumentCollectionName,
            summaryIds: newValue,
          },
        });
        setReorderedSummaries(newValue);
      }}
      useDragHandle={true}
      classes={classes}
    />
  </span>;
};

const SummariesEditFormComponent = registerComponent("SummariesEditForm", SummariesEditForm);

declare global {
  interface ComponentTypes {
    SummariesEditForm: typeof SummariesEditFormComponent
  }
}

export default SummariesEditFormComponent;
