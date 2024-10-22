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
import TextField from '@material-ui/core/TextField';

export const initialPrompt = `You're a Glossary AI. Your goal is to make good explanations for technical jargon terms. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a smart, widely read layman. 

We're about to provide you with the text of an essay, followed by a list of jargon terms for that essay. 

For each term, provide:
  
The term itself (wrapped in a strong tag), followed by a concise one-line definition. Then, on a separate paragraph, explain how the term is used in this context. Include where the term is originally from (whether it's established from an academic field, new to LessWrong or this particular post, or something else. Note what year it was first used in this context if possible).

Ensure that your explanations are clear and accessible to someone who may not be familiar with the subject matter. Follow Strunk and White guidelines. 

Use your general knowledge as well as the post's specific explanations or definitions of the terms to find a good definition of each term. 

Include a set of altTerms that are slight variations of the term, such as plurals, abbreviations or acryonyms, or alternate spellings that appear in the text. Make sure to include all variations that appear in the text.

Do NOT emphasize that the term is important, but DO explain how it's used in this context. Make sure to put the "contextual explanation" in a separate paragraph from the opening term definition. Make sure to make the term definition a short sentence.
`

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
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
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
  },
  disabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  promptTextField: {
    marginTop: 16,
    marginBottom: 16,
  }
});

export const GlossaryEditForm = ({ classes, document, showTitle = true }: {
  classes: ClassesType<typeof styles>,
  document: PostsPage,
  showTitle?: boolean,
}) => {

  const [expanded, setExpanded] = useState(false);
  const [showDeletedTerms, setShowDeletedTerms] = useState(false);
  const [examplePost, setExamplePost] = useState<PostsPage | undefined>(undefined);
  const [prompt, setPrompt] = useState<string | undefined>(initialPrompt);
  const [showNewJargonTermForm, setShowNewJargonTermForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  
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
    mutation getNewJargonTerms($postId: String!, $prompt: String!) {
      getNewJargonTerms(postId: $postId, prompt: $prompt) {
        ...JargonTerms
      }
    }
    ${fragmentTextForQuery("JargonTerms")}
  `);

  const addNewJargonTerms = async ({prompt}: {examplePost?: PostsPage, prompt?: string}) => { 
    if (!prompt) return;
    try {
      const response = await getNewJargonTerms({
        variables: {
          postId: document._id,
          prompt,
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

  const handleUnhideAll = () => {
    for (const jargonTerm of deletedTerms) {
      void updateJargonTerm({
        selector: { _id: jargonTerm._id }, 
        data: { deleted: false },
        optimisticResponse: {
          ...jargonTerm,
          deleted: false,
        }
      });
    }
  }
  
  const { JargonEditorRow, LoadMore, Loading, LWTooltip, JargonTocItem, Row, WrappedSmartForm } = Components;

  return <div className={classes.root}>
    {showTitle && <h2>Glossary [Beta]<LWTooltip title="Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.">  </LWTooltip></h2>}
    {/* {!showTitle && <br/>} */}

    <LoadMore {...loadMoreProps} />
    <div className={classes.buttonRow}>
      <Button onClick={() => addNewJargonTerms({examplePost, prompt})} className={classes.generateButton}>Generate new terms</Button>
      <div className={classes.approveAllButton}>
        <LWTooltip title={<div><p>Current Prompt:</p><p>{prompt}</p></div>}>
          <div className={classes.approveAllButton} onClick={() => setEditingPrompt(!editingPrompt)}>{editingPrompt ? "SAVE PROMPT" : "EDIT PROMPT"}</div>
        </LWTooltip>
      </div>
      {mutationLoading && <Loading/>}
      {mutationLoading && <div>(Loading... warning, this will take 30-60 seconds)</div>}
    </div>
    {editingPrompt && <div>
      <TextField
        label="Prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        multiline
        fullWidth
        variant="outlined"
        className={classes.promptTextField}
        InputProps={{
          style: { minHeight: '120px', resize: 'vertical' }
        }}
      />
    </div>}


    <div className={classNames(classes.termsList, expanded && classes.expandedTermsList)}>
      {nonDeletedTerms.map((item) => {
        let sizeClass = classes.smallTerm;
        if (item.term.length > 20) sizeClass = classes.mediumTerm;
        return <div key={item._id} className={sizeClass}><JargonTocItem jargonTerm={item}/></div>
      })}
    </div>

    {expanded && <div>
      {showNewJargonTermForm && <JargonEditorRow key={'newJargonTermForm'} postId={document._id} />}
      {nonDeletedTerms.map((item) => <JargonEditorRow key={item._id} postId={document._id} jargonTerm={item}/>)}
    </div>}

    <div className={classes.buttonRow}>
      <LWTooltip title="Enable all glossary hoverovers for readers of this post">
        <div className={classes.approveAllButton} onClick={() => handleSetApproveAll(true)}>ENABLE ALL</div>
      </LWTooltip>
      <LWTooltip title="Disable all glossary hoverovers for readers of this post">
        <div className={classes.approveAllButton} onClick={() => handleSetApproveAll(false)}>DISABLE ALL</div>
      </LWTooltip>
      <LWTooltip title={<div><p>Hide all terms that aren't currently enabled (you can unhide them later)</p><p>{sortedUnapprovedTerms.map((item) => item.term).join(", ")}</p></div>}>
        <div className={classNames(classes.approveAllButton, sortedUnapprovedTerms.length === 0 && classes.disabled)} onClick={handleDeleteUnused}>HIDE DISABLED TERMS</div>
      </LWTooltip>
      {deletedTerms.length > 0 && <LWTooltip title="Unhide all deleted terms">
        <div className={classes.approveAllButton} onClick={handleUnhideAll}>
          UNHIDE ALL ({deletedTerms.length})
        </div>
      </LWTooltip>}
      <LWTooltip title={expanded ? "Cancel editing the glossary" : "Edit the glossary definitions"}>
        <div className={classes.button} onClick={() => setExpanded(!expanded)}>
          {expanded 
          ? "CANCEL"
          : "EDIT GLOSSARY"
        }
        </div>
      </LWTooltip>
    </div>
  </div>;
}

const GlossaryEditFormComponent = registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditForm: typeof GlossaryEditFormComponent
  }
}
