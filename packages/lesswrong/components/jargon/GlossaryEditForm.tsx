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
    marginTop: -16,
    marginBottom: -16,
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
    paddingTop: 16
  },
  icon: {
    color: theme.palette.grey[500],
  },
  expandedTermsList: {
    position: 'sticky',
    top: 0,
    background: theme.palette.background.pageActiveAreaBackground,
    marginLeft: -16,
    marginRight: -16,
    padding: 16,
    zIndex: 1,
  },
  termsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },
  smallTerm: {
    width: "calc(25% - 4px)",
  },
  mediumTerm: {
    width: "calc(50% - 4px)",
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
    fragmentName: 'JargonTerms',
  })

  const sortedGlossary = [...glossary].sort((a, b) => {
    return a.term.length - b.term.length;
    // const termA = a.term.toLowerCase();
    // const termB = b.term.toLowerCase();
    // if (termA < termB) return -1;
    // if (termA > termB) return 1;
    // return 0;
  });

  const deletedTerms = sortedGlossary.filter((item) => item.deleted);
  const nonDeletedTerms = sortedGlossary.filter((item) => !item.deleted);
  const sortedApprovedTerms = nonDeletedTerms.filter((item) => item.approved);
  const sortedUnapprovedTerms = nonDeletedTerms.filter((item) => !item.approved);

  const [getNewJargonTerms, { data, loading: mutationLoading, error }] = useMutation(gql`
    mutation getNewJargonTerms($postId: String!) {
      getNewJargonTerms(postId: $postId) {
        ...JargonTerms
      }
    }
    ${fragmentTextForQuery("JargonTerms")}
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
    fragmentName: 'JargonTerms',
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
  
  const { JargonEditorRow, LoadMore, Loading, LWTooltip, JargonTocItem, Row, WrappedSmartForm } = Components;

  return <div className={classes.root}>
    <h2>Glossary [Beta]<LWTooltip title="Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.">  </LWTooltip></h2>

    <div className={classNames(classes.termsList, expanded && classes.expandedTermsList)}>
      {nonDeletedTerms.map((item) => {
        let sizeClass = classes.smallTerm;
        if (item.term.length > 20) sizeClass = classes.mediumTerm;
        return <div key={item._id} className={sizeClass}><JargonTocItem jargonTerm={item}/></div>
      })}
    </div>

    {expanded && <div>
      <Row justifyContent="space-around">
        <div className={classes.approveAllButton} onClick={() => handleSetApproveAll(true)}>Enable All</div>
        <div className={classes.approveAllButton} onClick={() => handleSetApproveAll(false)}>Disable All</div>
        {sortedUnapprovedTerms.length > 0 && <div className={classes.approveAllButton} onClick={handleDeleteUnused}>Hide Disabled Terms</div>}
      </Row>
      <JargonEditorRow key={'newJargonTermForm'} postId={document._id} />
      {nonDeletedTerms.map((item) => <JargonEditorRow key={item._id} postId={document._id} jargonTerm={item}/>)}
    </div>}

    <LoadMore {...loadMoreProps} />
    <div className={classes.footer}>
      <Button onClick={addNewJargonTerms} className={classes.generateButton}>Generate new terms</Button>
      <div className={classes.button} onClick={() => setExpanded(!expanded)}>
        {expanded 
          ? "CANCEL"
          : "EDIT GLOSSARY"
        }
      </div>
      {mutationLoading && <Loading/>}
      {mutationLoading && <div>(Loading... warning, this will take 30-60 seconds)</div>}
    </div>
  </div>;
}

const GlossaryEditFormComponent = registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditForm: typeof GlossaryEditFormComponent
  }
}
