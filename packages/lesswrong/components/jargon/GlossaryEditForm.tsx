import React, { useState } from 'react';
import { Components, fragmentTextForQuery, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';
import Button from '@material-ui/core/Button';
import { useUpdate } from '@/lib/crud/withUpdate';
import classNames from 'classnames';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { JargonTocItem } from './JargonTocItem';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
  },
  window: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    maxHeight: '60vh',
    overflow: 'scroll',
    position: 'relative',
  },
  expanded: {
    maxHeight: 'unset',
  },
  generateButton: {
    background: theme.palette.buttons.startReadingButtonBackground,

    // TODO: Pick typography for this button. (This is just the typography that
    // Material UI v0 happened to use.)
    fontWeight: 500,
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
  },
  approveAllButton: {
    cursor: 'pointer',
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: '1.1rem',
    color: theme.palette.primary.main,
    gap: '8px',
    '&:hover': {
      opacity: 0.65  
    }
  },
  button: {
    cursor: 'pointer',
    padding: 10,
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: 0.6,
    '&:hover': {
      opacity: 0.8
    }
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: theme.palette.border.faint,
  },
  icon: {
    color: theme.palette.grey[500],
  },
  termsList: {
    marginRight: 16,
    position: 'sticky',
    top: 0,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  termsListTerm: {
    cursor: 'pointer',
    ...theme.typography.commentStyle,
    fontSize: '1.1rem',
    marginBottom: 10,
    color: theme.palette.grey[500],
    width: 150,
    '&:hover': {
      opacity: 0.8
    }
  },
  approved: {
    color: theme.palette.grey[800],
  }
});

export const GlossaryEditForm = ({ classes, document }: {
  classes: ClassesType<typeof styles>,
  document: PostsPage,
}) => {

  const [expanded, setExpanded] = useState(false);
  const [showDeletedTerms, setShowDeletedTerms] = useState(false);
  const { results: glossary = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "postEditorJargonTerms",
      postId: document._id,
      limit: 100
    },
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  })

  const sortedGlossary = [...glossary].sort((a, b) => {
    const termA = a.term.toLowerCase();
    const termB = b.term.toLowerCase();
    if (termA < termB) return -1;
    if (termA > termB) return 1;
    return 0;
  });

  const deletedTerms = sortedGlossary.filter((item) => item.deleted);
  const nonDeletedTerms = sortedGlossary.filter((item) => !item.deleted);
  const sortedApprovedTerms = nonDeletedTerms.filter((item) => item.approved);
  const sortedUnapprovedTerms = nonDeletedTerms.filter((item) => !item.approved);

  const [getNewJargonTerms, { data, loading: mutationLoading, error }] = useMutation(gql`
    mutation getNewJargonTerms($postId: String!) {
      getNewJargonTerms(postId: $postId) {
        ...JargonTermsFragment
      }
    }
    ${fragmentTextForQuery("JargonTermsFragment")}
  `);

  const addNewJargonTerms = async () => { 
    try {
      const response = await getNewJargonTerms({
        variables: {
          postId: document._id,
        },
      });
      refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const {mutate: updateJargonTerm} = useUpdate({
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  });

  const handleSetApproveAll = (approve: boolean) => {
    const termsToUpdate = approve ? sortedUnapprovedTerms : sortedApprovedTerms;
    for (const jargonTerm of termsToUpdate) {
      void updateJargonTerm({
        selector: { _id: jargonTerm._id },
        data: {
          approved: approve
        },
        optimisticResponse: {
          ...jargonTerm,
          approved: approve,
        }
      });
    }
  }

  const handleDeleteUnused = () => {
    const termsToUpdate = sortedUnapprovedTerms;
    for (const jargonTerm of termsToUpdate) {
      void updateJargonTerm({
        selector: { _id: jargonTerm._id },
        data: {
          approved: false,
          deleted: true,
        },
        optimisticResponse: {
          ...jargonTerm,
          approved: false,
          deleted: true,
        }
      });
    }
  }
  
  const { JargonEditorRow, LoadMore, Loading, JargonTocItem, Row, WrappedSmartForm } = Components;

  return <div className={classes.root}>
    <p>
      Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.
    </p>
    {/** The filter condition previously was checking item.isAltTerm, but that doesn't exist on JargonTermsFragment.  Not sure it was doing anything meaningful, or was just llm-generated. */}
    <Row justifyContent="space-around">
      <div className={classes.approveAllButton} onClick={() => handleSetApproveAll(true)}>Approve All</div>
      <div className={classes.approveAllButton} onClick={() => handleSetApproveAll(false)}>Unapproved All</div>
      {sortedUnapprovedTerms.length > 0 && <div className={classes.approveAllButton} onClick={handleDeleteUnused}>Hide Unapproved</div>}
    </Row>
    <div className={classNames(classes.window, expanded ? classes.expanded : '')}>
      <div className={classes.termsList}>
        {nonDeletedTerms.map((item) => <JargonTocItem key={item._id} jargonTerm={item}/>)}
        {deletedTerms.length > 0 && !showDeletedTerms && <div className={classes.approveAllButton} onClick={() => setShowDeletedTerms(true)}>
          Show hidden ({deletedTerms.length})
        </div>}
        {deletedTerms.length > 0 && showDeletedTerms && <div className={classes.approveAllButton} onClick={() => setShowDeletedTerms(false)}>
          Hide hidden terms
        </div>}
        {showDeletedTerms && deletedTerms.map((item) => <JargonTocItem key={item._id} jargonTerm={item}/>)}
      </div>
      <div>
        {/* <WrappedSmartForm
          collectionName="JargonTerms"
          mutationFragment={getFragment('JargonTermsFragment')}
          queryFragment={getFragment('JargonTermsFragment')}
          formComponents={{ FormSubmit: Components.JargonSubmitButton }}
        /> */}
        <JargonEditorRow key={'newJargonTermForm'} postId={document._id} />
        {nonDeletedTerms.map((item) => <JargonEditorRow key={item._id} postId={document._id} jargonTerm={item}/>)}
      </div>
    </div>
    <LoadMore {...loadMoreProps} />
    <div className={classes.footer}>
      <Button onClick={addNewJargonTerms} className={classes.generateButton}>Generate new terms</Button>
      <div className={classes.button} onClick={() => setExpanded(!expanded)}>{expanded ? <>Collapse<ExpandMoreIcon className={classes.icon}/></> : <>Expand<ExpandLessIcon className={classes.icon}/></>}</div>
    </div>
    {mutationLoading && <Loading/>}
    {mutationLoading && <div>(Loading... warning, this will take 30-60 seconds)</div>}
  </div>;
}

const GlossaryEditFormComponent = registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditForm: typeof GlossaryEditFormComponent
  }
}
