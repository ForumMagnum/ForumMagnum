import React, { useState } from 'react';
import { Components, fragmentTextForQuery, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';
import Button from '@material-ui/core/Button';
import { useUpdate } from '@/lib/crud/withUpdate';
import classNames from 'classnames';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

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
  button: {
    cursor: 'pointer',
    paddingBottom: 10,
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
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
  }
});

export const GlossaryEditForm = ({ classes, document }: {
  classes: ClassesType<typeof styles>,
  document: PostsPage,
}) => {
  const { JargonEditorRow, LoadMore, Loading, Row } = Components;

  const [expanded, setExpanded] = useState(false);

  const { results: glossary = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "postJargonTerms",
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

  const sortedApprovedTerms = sortedGlossary.filter((item) => item.approved)
  const sortedUnapprovedTerms = sortedGlossary.filter((item) => !item.approved)

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
    for (const jargonTerm of sortedGlossary) {
      void updateJargonTerm({
        selector: { _id: jargonTerm._id },
        data: {
          approved: approve
        },
        optimisticResponse: {
          ...jargonTerm,
          approved: !jargonTerm.approved,
        }
      });
    }
  }


  return <div className={classes.root}>
    <p>
      Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.
    </p>
    {/** The filter condition previously was checking item.isAltTerm, but that doesn't exist on JargonTermsFragment.  Not sure it was doing anything meaningful, or was just llm-generated. */}
    <div className={classNames(classes.window, expanded ? classes.expanded : '')}>
      {sortedUnapprovedTerms.length > 0 && <div>
        <div className={classes.button} onClick={() => handleSetApproveAll(true)}>Approve all</div>
        {sortedUnapprovedTerms.map((item) => <JargonEditorRow key={item._id} jargonTerm={item}/>)}
      </div>}
      {sortedApprovedTerms.length > 0 && <div>
        <div className={classes.button} onClick={() => handleSetApproveAll(false)}>Unapprove all</div>
        {sortedApprovedTerms.map((item) => <JargonEditorRow key={item._id} jargonTerm={item} />)}
      </div>}
    </div>
    <LoadMore {...loadMoreProps} />
    <div className={classes.footer}>
      <Button onClick={addNewJargonTerms} className={classes.generateButton}>Generate new terms</Button>
      <div className={classes.button} onClick={() => setExpanded(!expanded)}>{expanded ? <div>Collapse<ExpandMoreIcon/></div> : <div>Expand<ExpandLessIcon/></div>}</div>
    </div>
    {mutationLoading && <Loading/>}
  </div>;
}

const GlossaryEditFormComponent = registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditForm: typeof GlossaryEditFormComponent
  }
}
