import React, { useState } from 'react';
import { Components, fragmentTextForQuery, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';
import Button from '@material-ui/core/Button';
import { useUpdate } from '@/lib/crud/withUpdate';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
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
  toggleAll: {
    cursor: 'pointer',
    paddingBottom: 10,
    ...theme.typography.commentStyle,
    fontWeight: 'bold',
    fontSize: '1.1rem',
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
    // setIsActive(value);
    for (const jargonTerm of sortedGlossary) {
      void updateJargonTerm({
        selector: { _id: jargonTerm._id },
        data: {
          approved: approve
        },
      })
    }
  }


  return <div className={classNames(classes.root, expanded ? classes.expanded : '')}>
    <p>
      Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.
    </p>
    {/** The filter condition previously was checking item.isAltTerm, but that doesn't exist on JargonTermsFragment.  Not sure it was doing anything meaningful, or was just llm-generated. */}
    <Row justifyContent="space-between" alignItems="flex-start">
      {sortedUnapprovedTerms.length > 0 && <div>
        <div className={classes.toggleAll} onClick={() => handleSetApproveAll(true)}>Approve all</div>
        {sortedUnapprovedTerms.map((item) => <JargonEditorRow key={item._id} jargonTerm={item}/>)}
      </div>}
      {sortedApprovedTerms.length > 0 && <div>
        <div className={classes.toggleAll} onClick={() => handleSetApproveAll(false)}>Unapprove all</div>
        {sortedApprovedTerms.map((item) => <JargonEditorRow key={item._id} jargonTerm={item} />)}
      </div>}
    </Row>
    <LoadMore {...loadMoreProps} />
    <Button onClick={addNewJargonTerms} className={classes.generateButton}>Generate new terms</Button>
    {mutationLoading && <Loading/>}
    <div className={classes.expand}>{expanded ? 'Collapse' : 'Expand'}</div>
  </div>;
}

const GlossaryEditFormComponent = registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditForm: typeof GlossaryEditFormComponent
  }
}
