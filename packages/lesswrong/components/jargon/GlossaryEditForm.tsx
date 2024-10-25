import React, { useState } from 'react';
import { Components, fragmentTextForQuery, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';
import Button from '@material-ui/core/Button';
import { useUpdate } from '@/lib/crud/withUpdate';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import { formStyles } from './JargonEditorRow';
import { gracefulify } from 'graceful-fs';

export const defaultGlossaryPrompt = `You're a Glossary AI. Your goal is to make good explanations for technical jargon terms. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a smart, widely read layman. 

We're about to provide you with the text of an essay, followed by a list of jargon terms for that essay. 

For each term, provide:
  
The term itself (wrapped in a strong tag), followed by a concise one-line definition. Then, on a separate paragraph, explain how the term is used in this context. Include where the term is originally from (whether it's established from an academic field, new to LessWrong or this particular post, or something else. Note what year it was first used in this context if possible).

Ensure that your explanations are clear and accessible to someone who may not be familiar with the subject matter. Follow Strunk and White guidelines. 

Use your general knowledge as well as the post's specific explanations or definitions of the terms to find a good definition of each term. 

Include a set of altTerms that are slight variations of the term, such as plurals, abbreviations or acryonyms, or alternate spellings that appear in the text. Make sure to include all variations that appear in the text.

Do NOT emphasize that the term is important, but DO explain how it's used in this context. Make sure to put the "contextual explanation" in a separate paragraph from the opening term definition. Make sure to make the term definition a short sentence.
`

export const defaultExamplePost = `Suppose two Bayesian agents are presented with the same spreadsheet - IID samples of data in each row, a feature in each column. Each agent develops a generative model of the data distribution. We'll assume the two converge to the same predictive distribution, but may have different generative models containing different latent variables. We'll also assume that the two agents develop their models independently, i.e. their models and latents don't have anything to do with each other informationally except via the data. Under what conditions can a latent variable in one agent's model be faithfully expressed in terms of the other agent's latents?`

export const defaultExampleLateX = `Now for the question: under what conditions on agent 1's latent(s) (Lambda^1) can we *guarantee* that (Lambda^1) is expressible in terms of (Lambda^2), no matter what generative model agent 2 uses (so long as the agents agree on the predictive distribution (P[X]))? In particular, let's require that (Lambda^1) be a function of (Lambda^2). (Note that we'll weaken this later.) So, when is (Lambda^1) *guaranteed* to be a function of (Lambda^2), for *any* generative model (M_2) which agrees on the predictive distribution (P[X])? Or, worded in terms of latents: when is (Lambda^1) *guaranteed* to be a function of (Lambda^2), for *any* latent(s) (Lambda^2) which account for all interactions between features in the predictive distribution (P[X])?
`

export interface ExampleJargonGlossaryEntry {
  term: string;
  altTerms: string[];
  text: string;
}

export const defaultExampleTerm = 'latent variables'
export const defaultExampleAltTerm = 'latents'
export const defaultExampleDefinition = `<div>
  <p><b>Latent variables:</b> Variables which an agent's world model includes but which are not directly observed.</p>
  <p>These variables are not part of the data distribution, but can help explain the data distribution.</p>
</div>`

export const defaultExampleGlossary: { glossaryItems: ExampleJargonGlossaryEntry[] } = {
  glossaryItems: [
    {
      "term": defaultExampleTerm,
      "altTerms": [defaultExampleAltTerm],
      "text": defaultExampleDefinition
    },
  ]
};


const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    marginTop: -8,
    marginBottom: -16,
  },
  window: {
    maxHeight: 300,
    overflowY: 'scroll',
    display: 'flex',
    justifyContent: 'space-between',
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
  term: {
    padding: 4,
    fontSize: '1rem',
  },
  headerButton: {
    cursor: 'pointer',
    padding: 10,
    paddingLeft: 16,
    paddingRight: 16,
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottom: theme.palette.border.faint,
    marginBottom: 4,
  },
  headerButtons: {
    display: 'flex',
    gap: 12,
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
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: '4px'
  },
  termsListColumn: {
    display: 'flex',
    flexDirection: 'column',
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
    color: theme.palette.grey[500],
    cursor: 'not-allowed',
  },
  promptTextField: {
    marginTop: 12,
    marginBottom: 12,
  },
  formStyles: {
    ...formStyles,
    borderBottom: theme.palette.border.faint,
    paddingBottom: 10,
    paddingTop: 16,
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 16,

  },
  newTermButton: {
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontSize: 25,
    fontWeight: 900,
    paddingLeft: 7,
    paddingRight: 7
  },
  newTermButtonCancel: {
    color: theme.palette.grey[500],
    transform: 'rotate(45deg)',
    fontWeight: 600
  }
});

export const GlossaryEditForm = ({ classes, document, showTitle = true }: {
  classes: ClassesType<typeof styles>,
  document: PostsPage,
  showTitle?: boolean,
}) => {

  const [expanded, setExpanded] = useState(false);
  const [showDeletedTerms, setShowDeletedTerms] = useState(false);

  const [glossaryPrompt, setGlossaryPrompt] = useState<string | undefined>(defaultGlossaryPrompt);
  const [examplePost, setExamplePost] = useState<string | undefined>(defaultExamplePost);
  const [exampleTerm, setExampleTerm] = useState<string | undefined>(defaultExampleTerm);
  const [exampleAltTerm, setExampleAltTerm] = useState<string | undefined>(defaultExampleAltTerm);
  const [exampleDefinition, setExampleDefinition] = useState<string | undefined>(defaultExampleDefinition);

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

  const glossaryWithInstanceCounts = glossary.map((item) => {
    const jargonVariants = [item.term, ...(item.altTerms ?? []).map(altTerm => altTerm)];

    // Create a regex to match any of the jargon variants, case-insensitive, while matching whole words
    const regex = new RegExp(`\\b(${jargonVariants.join('|')})\\b`, 'gi');

    const instancesOfJargonCount = document.contents?.html?.toLowerCase().match(regex)?.length ?? 0;
    return { ...item, instancesOfJargonCount };
  }).sort((a, b) => {
    return b.instancesOfJargonCount - a.instancesOfJargonCount;
  });


  const deletedTerms = glossaryWithInstanceCounts.filter((item) => item.deleted);
  const nonDeletedTerms = glossaryWithInstanceCounts.filter((item) => !item.deleted);
  const sortedApprovedTerms = nonDeletedTerms.filter((item) => item.approved);
  const sortedUnapprovedTerms = nonDeletedTerms.filter((item) => !item.approved);

  const [getNewJargonTerms, { data, loading: mutationLoading, error }] = useMutation(gql`
    mutation getNewJargonTerms($postId: String!, $glossaryPrompt: String, $examplePost: String, $exampleTerm: String, $exampleAltTerm: String, $exampleDefinition: String) {
      getNewJargonTerms(postId: $postId, glossaryPrompt: $glossaryPrompt, examplePost: $examplePost, exampleTerm: $exampleTerm, exampleAltTerm: $exampleAltTerm, exampleDefinition: $exampleDefinition) {
        ...JargonTerms
      }
    }
    ${fragmentTextForQuery("JargonTerms")}
  `);

  const addNewJargonTerms = async ({glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition}: {
    glossaryPrompt?: string, 
    examplePost?: string, 
    exampleTerm?: string, 
    exampleAltTerm?: string, 
    exampleDefinition?: string
  }) => { 
    if (!glossaryPrompt) return;
    try {
      const response = await getNewJargonTerms({
        variables: {
          postId: document._id,
          glossaryPrompt,
          examplePost,
          exampleTerm,
          exampleAltTerm,
          exampleDefinition,
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
  
  const { JargonEditorRow, LoadMore, Loading, LWTooltip, WrappedSmartForm, IconRight, IconDown, ForumIcon } = Components;

  const promptEditor = <div>
    <TextField
      label="Prompt"
      value={glossaryPrompt}
      onChange={(e) => setGlossaryPrompt(e.target.value)}
      multiline
      fullWidth
      variant="outlined"
      className={classes.promptTextField}
      InputProps={{
        style: { minHeight: '120px', resize: 'vertical' }
      }}
    />
    <TextField
      label="Example Post"
      value={examplePost}
      onChange={(e) => setExamplePost(e.target.value)}
      multiline
      fullWidth
      variant="outlined"
      className={classes.promptTextField}
      InputProps={{
        style: { minHeight: '100px', resize: 'vertical' }
      }}
    />
    <TextField
      label="Example Term"
      value={exampleTerm}
      onChange={(e) => setExampleTerm(e.target.value)}
      fullWidth
      className={classes.promptTextField}
      variant="outlined"
    />
    <TextField
      label="Example Alt Term"
      value={exampleAltTerm}
      onChange={(e) => setExampleAltTerm(e.target.value)}
      fullWidth
      className={classes.promptTextField}
      variant="outlined"
    />
    <TextField
      label="Example Definition"
      value={exampleDefinition}
      className={classes.promptTextField}
      onChange={(e) => setExampleDefinition(e.target.value)}
      multiline
      fullWidth
      variant="outlined"
    />
  </div>

  const expandCollapseButton = <div className={classes.button} onClick={() => setExpanded(!expanded)}>
    {expanded 
      ? <>COLLAPSE <IconDown height={16} width={16} /></>
      : <>EXPAND <IconRight height={16} width={16} /></>
    }
  </div>

  const header = <div className={classes.header}>
    <LWTooltip title={showNewJargonTermForm ? "Cancel adding a new term" : "Add a new term to the glossary"}>
      <div className={classNames(classes.newTermButton, showNewJargonTermForm && classes.newTermButtonCancel)} onClick={() => setShowNewJargonTermForm(!showNewJargonTermForm)}>
        +
      </div>
    </LWTooltip>
    <div className={classes.headerButtons}>
      <LWTooltip title="Enable all glossary hoverovers for readers of this post">
        <div className={classNames(classes.headerButton, sortedApprovedTerms.length !== 0 && classes.disabled)} 
          onClick={() => handleSetApproveAll(true)}>
          ENABLE ALL
        </div>
      </LWTooltip>
      <LWTooltip title="Disable all glossary hoverovers for readers of this post">
        <div className={classNames(classes.headerButton, sortedUnapprovedTerms.length !== 0 && classes.disabled)} 
          onClick={() => handleSetApproveAll(false)}>
          DISABLE ALL
        </div>
      </LWTooltip>
      <LWTooltip title={<div><p>Hide all terms that aren't currently enabled</p><p>(you can unhide them later)</p></div>}>
        <div className={classNames(classes.headerButton, sortedUnapprovedTerms.length === 0 && classes.disabled)} onClick={handleDeleteUnused}>HIDE DISABLED TERMS</div>
      </LWTooltip>
      {deletedTerms.length > 0 && <LWTooltip title="Unhide all deleted terms">
        <div className={classes.headerButton} onClick={handleUnhideAll}>
          UNHIDE ALL ({deletedTerms.length})
        </div>
      </LWTooltip>}
    </div>
    {expanded && expandCollapseButton}
  </div>

  const footer = <div className={classes.buttonRow}>
    <Button onClick={() => addNewJargonTerms({glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition})} className={classes.generateButton}>Generate new terms</Button>
    <div className={classes.headerButtons}>
      <LWTooltip title="Make changes to the jargon generator LLM prompt">
        <div className={classes.headerButton} onClick={() => setEditingPrompt(!editingPrompt)}>{editingPrompt ? "SAVE PROMPT" : "EDIT PROMPT"}</div>
      </LWTooltip>
    </div>
    {expandCollapseButton}
    {mutationLoading && <Loading/>}
    {mutationLoading && <div>(Loading... warning, this will take 30-60 seconds)</div>}
  </div>

  return <div className={classes.root}>
    {showTitle && <h2>Glossary [Beta]<LWTooltip title="Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.">  </LWTooltip></h2>}
    {header}
    <div className={classNames(classes.window, expanded && classes.expanded)}>
      <div>
        {showNewJargonTermForm && <div className={classes.root}>
          <div className={classes.formStyles}>
            <WrappedSmartForm
              collectionName="JargonTerms"
              mutationFragment={getFragment('JargonTerms')}
              queryFragment={getFragment('JargonTerms')}
              formComponents={{ FormSubmit: Components.JargonSubmitButton }}
              prefilledProps={{ postId: document._id }}
              cancelCallback={() => setShowNewJargonTermForm(false)}
              successCallback={() => setShowNewJargonTermForm(false)}
            />
          </div>
        </div>}
        {nonDeletedTerms.map((item) => {
          return <JargonEditorRow key={item._id} postId={document._id} jargonTerm={item} instancesOfJargonCount={item.instancesOfJargonCount}/>
        })}
        {deletedTerms.length > 0 && <div className={classes.button} onClick={() => setShowDeletedTerms(!showDeletedTerms)}>
          {showDeletedTerms ? "Hide deleted terms" : `Show deleted terms (${deletedTerms.length})`}
        </div>}
        {deletedTerms.length > 0 && showDeletedTerms && deletedTerms.map((item) => {
          return <JargonEditorRow key={item._id} postId={document._id} jargonTerm={item} instancesOfJargonCount={item.instancesOfJargonCount}/>
        })}

      </div>
      <LoadMore {...loadMoreProps} />
    </div>
    {footer}
    {editingPrompt && promptEditor}

  </div>;
}

const GlossaryEditFormComponent = registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditForm: typeof GlossaryEditFormComponent
  }
}

