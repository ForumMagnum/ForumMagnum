import React, { useState } from 'react';
import { Components, fragmentTextForQuery, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';
import Button from '@material-ui/core/Button';
import { useUpdate } from '@/lib/crud/withUpdate';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import { formStyles } from './JargonEditorRow';
import { isFriendlyUI } from '@/themes/forumTheme';
import { useJargonCounts } from '@/components/hooks/useJargonCounts';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import Checkbox from '@material-ui/core/Checkbox';

// Integrity Alert! This is currently designed so if the model changes, users are informed
// about what model is being used in the jargon generation process.
// If you change this architecture, make sure to update GlossaryEditForm.tsx and the Users' schema
export const JARGON_LLM_MODEL = 'claude-3-5-sonnet-20241022';

export const defaultGlossaryPrompt = `You're a LessWrong Glossary AI. Your goal is to make good explanations for technical jargon terms. You are trying to produce a useful hoverover tooltip in an essay on LessWrong.com, accessible to a smart, widely read layman. 

We're about to provide you with the text of an essay, followed by a list of jargon terms present in that essay. 

For each term, provide:
  
The term itself (wrapped in a <strong> tag), followed by a concise one-line definition. Then, on a separate paragraph, explain how the term is used in this context (although it's important not to use the phrase "in this context" or "in this post" - just explain how this concept fits into the other concepts in the post).

Ensure that your explanations are clear and accessible to someone who may not be familiar with the subject matter. Follow Strunk and White guidelines.

Use your general knowledge, as well as the post's specific explanations or definitions of the term, to decide on an appropriate definition.

Include a set of altTerms that are slight variations of the term, such as plurals, abbreviations or acryonyms, or alternate spellings that appear in the text. Make sure to include all variations that appear in the text, and only those that are present in the text.

To reiterate: do not emphasize that the term is important, but do explain how it's used here. Make sure to put that explanation in a separate paragraph from the opening term definition. Make sure to make the term definition a short sentence.`;

export const defaultExamplePost = `Suppose two Bayesian agents are presented with the same spreadsheet - IID samples of data in each row, a feature in each column. Each agent develops a generative model of the data distribution. We'll assume the two converge to the same predictive distribution, but may have different generative models containing different latent variables. We'll also assume that the two agents develop their models independently, i.e. their models and latents don't have anything to do with each other informationally except via the data. Under what conditions can a latent variable in one agent's model be faithfully expressed in terms of the other agent's latents?`;

export const defaultExampleLateX = `Now for the question: under what conditions on agent 1's latent(s) (Lambda^1) can we *guarantee* that (Lambda^1) is expressible in terms of (Lambda^2), no matter what generative model agent 2 uses (so long as the agents agree on the predictive distribution (P[X]))? In particular, let's require that (Lambda^1) be a function of (Lambda^2). (Note that we'll weaken this later.) So, when is (Lambda^1) *guaranteed* to be a function of (Lambda^2), for *any* generative model (M_2) which agrees on the predictive distribution (P[X])? Or, worded in terms of latents: when is (Lambda^1) *guaranteed* to be a function of (Lambda^2), for *any* latent(s) (Lambda^2) which account for all interactions between features in the predictive distribution (P[X])?`;

export interface ExampleJargonGlossaryEntry {
  term: string;
  altTerms: string[];
  htmlContent: string;
}

export const defaultExampleTerm = 'latent variables'
export const defaultExampleAltTerm = 'latents'
export const defaultExampleDefinition = `<div>
  <p><b>Latent variables:</b> Variables which an agent's world model includes, but which are not directly observed.</p>
  <p>These variables are not part of the data distribution, but can help explain the data distribution.</p>
</div>`

export const defaultExampleGlossary: { glossaryItems: ExampleJargonGlossaryEntry[] } = {
  glossaryItems: [
    {
      "term": defaultExampleTerm,
      "altTerms": [defaultExampleAltTerm],
      "htmlContent": defaultExampleDefinition
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
    maxHeight: 160,
    overflowY: 'scroll',
    display: 'flex',
    justifyContent: 'space-between',
  },
  expanded: {
    maxHeight: 'unset',
  },
  generateButton: {
    background: theme.palette.buttons.startReadingButtonBackground,
    fontWeight: 500,
    fontSize: 14,
    fontFamily: theme.typography.commentStyle.fontFamily,
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
    paddingLeft: 1,
    paddingRight: 7
  },
  newTermButtonCancel: {
    color: theme.palette.grey[500],
    transform: 'rotate(45deg)',
    fontWeight: 600
  },
  expandCollapseIcon: {
    cursor: 'pointer',
  },
  formSectionHeadingTitle: {
    marginBottom: 5,
    fontSize: "1.25rem",
    fontWeight: isFriendlyUI ? 600 : undefined,
  },
  formCollapsed: {
    display: 'none',
  },
  checkboxTopRow: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'start',
    paddingTop: 4,
  },
  checkboxTopContainer: {
    marginRight: theme.spacing.unit * 3,
    marginTop: 5,
    display: "flex",
    alignItems: "center"
  },
  checkboxRow: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'end',
    paddingTop: 4,
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 8,
  },
  generationFlagCheckbox: {
    padding: 2,
  },
  inline: {
    display: 'inline',
    cursor: 'pointer',
  },
});

export const GlossaryEditForm = ({ classes, document, showTitle = true }: {
  classes: ClassesType<typeof styles>,
  document: PostsPage,
  showTitle?: boolean,
}) => {
  const { JargonEditorRow, LoadMore, Loading, LWTooltip, WrappedSmartForm, IconRight, IconDown, Row, MetaInfo, Typography } = Components;

  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const [formCollapsed, setFormCollapsed] = useState(false);
  const [showMoreTerms, setShowMoreTerms] = useState(false);
  const [showDeletedTerms, setShowDeletedTerms] = useState(false);

  const [glossaryPrompt, setGlossaryPrompt] = useState<string | undefined>(defaultGlossaryPrompt);
  const [examplePost, setExamplePost] = useState<string | undefined>(defaultExamplePost);
  const [exampleTerm, setExampleTerm] = useState<string | undefined>(defaultExampleTerm);
  const [exampleAltTerm, setExampleAltTerm] = useState<string | undefined>(defaultExampleAltTerm);
  const [exampleDefinition, setExampleDefinition] = useState<string | undefined>(defaultExampleDefinition);

  const [showNewJargonTermForm, setShowNewJargonTermForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [clickedAutogenerate, setClickedAutogenerate] = useState(false);
  
  const { results: glossary = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "postEditorJargonTerms",
      postId: document._id,
      limit: 500
    },
    collectionName: "JargonTerms",
    fragmentName: 'JargonTerms',
  })

  const { sortedTerms, getCount } = useJargonCounts(document, glossary);

  const deletedTerms = sortedTerms.filter((item) => item.deleted);
  const nonDeletedTerms = sortedTerms.filter((item) => !item.deleted);
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

  const addNewJargonTerms = async () => {
    // TODO: maybe just disable button if no prompt?
    if (!glossaryPrompt) return;
    if (mutationLoading) return;
    
    try {
      await getNewJargonTerms({
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
  
  const promptEditor = <div>
    <h3>WARNING! This will not be saved after page reload</h3>
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

  const header = <div className={classNames(classes.header, formCollapsed && classes.formCollapsed)}>
    <LWTooltip title={showNewJargonTermForm ? "Cancel adding a new term" : "Add a new term to the glossary"}>
      <div className={classNames(classes.newTermButton, showNewJargonTermForm && classes.newTermButtonCancel)} onClick={() => setShowNewJargonTermForm(!showNewJargonTermForm)}>
        +
      </div>
    </LWTooltip>
    <div className={classes.headerButtons}>
      <LWTooltip title="Enable all glossary hoverovers for readers of this post">
        <div className={classNames(classes.headerButton, sortedUnapprovedTerms.length === 0 && classes.disabled)} 
          onClick={() => handleSetApproveAll(true)}>
          ENABLE ALL{ sortedUnapprovedTerms.length > 0 ? ` (${sortedUnapprovedTerms.length})` : '' }
        </div>
      </LWTooltip>
      <LWTooltip title="Disable all glossary hoverovers for readers of this post">
        <div className={classNames(classes.headerButton, sortedApprovedTerms.length === 0 && classes.disabled)} 
          onClick={() => handleSetApproveAll(false)}>
          DISABLE ALL{ sortedApprovedTerms.length > 0 ?  ` (${sortedApprovedTerms.length})` : '' }
        </div>
      </LWTooltip>
      <LWTooltip title={<div><p>Hide all terms that aren't currently enabled</p><p>(you can unhide them later)</p></div>}>
        <div className={classNames(classes.headerButton, sortedUnapprovedTerms.length === 0 && classes.disabled)} onClick={handleDeleteUnused}>HIDE DISABLED TERMS</div>
      </LWTooltip>
      <LWTooltip title="Unhide all hidden terms">
        <div className={classNames(classes.headerButton, deletedTerms.length === 0 && classes.disabled)} onClick={handleUnhideAll}>
          UNHIDE ALL{ deletedTerms.length > 0 ? ` (${deletedTerms.length})` : '' }
        </div>
      </LWTooltip>
    </div>
  </div>

  const generateJargonFlagsRow = <div className={classes.checkboxRow}>
    <LWTooltip title={`Automatically query ${JARGON_LLM_MODEL} every ~1000 characters added to the post`}>
      <div className={classes.checkboxContainer} onClick={() => setClickedAutogenerate(true)}>
        <MetaInfo>Autogenerate</MetaInfo>
        <Checkbox
          className={classes.generationFlagCheckbox}
          checked={currentUser?.generateJargonForDrafts}
          onChange={(e) => updateCurrentUser({generateJargonForDrafts: e.target.checked})}
        />
      </div>
    </LWTooltip>
    {clickedAutogenerate && <>
      <LWTooltip title="Automatically query jargon for all drafts">
        <div className={classes.checkboxContainer}>
          <MetaInfo>All drafts</MetaInfo>
          <Checkbox
            className={classes.generationFlagCheckbox}
            checked={currentUser?.generateJargonForDrafts}
            onChange={(e) => updateCurrentUser({generateJargonForDrafts: e.target.checked})}
          />
        </div>
      </LWTooltip>
      <LWTooltip title="Automatically query jargon for all published posts">
        <div className={classes.checkboxContainer}>
          <MetaInfo>All published posts</MetaInfo>
          <Checkbox
            className={classes.generationFlagCheckbox}
            checked={currentUser?.generateJargonForPublishedPosts}
            onChange={(e) => updateCurrentUser({generateJargonForPublishedPosts: e.target.checked})}
          />
        </div>
      </LWTooltip>
    </>}
  </div>

  const footer = <div className={classNames(classes.buttonRow, formCollapsed && classes.formCollapsed)}>
    <Button onClick={addNewJargonTerms} className={classNames(classes.generateButton, (mutationLoading || !glossaryPrompt) && classes.disabled)}>Generate new terms</Button>
    <div className={classes.headerButtons}>
      <LWTooltip title="Make changes to the jargon generator LLM prompt">
        <div className={classes.headerButton} onClick={() => setEditingPrompt(!editingPrompt)}>{editingPrompt ? "SAVE PROMPT" : "EDIT PROMPT"}</div>
      </LWTooltip>
    </div>
    <div className={classes.button} onClick={() => setShowMoreTerms(!showMoreTerms)}>
      {showMoreTerms 
        ? <>SHOW LESS</>
        : <>SHOW MORE</>
      }
    </div>
    {mutationLoading && <Loading/>}
    {mutationLoading && <div>(Loading... warning, this will take 30-60 seconds.)</div>}
  </div>

  return <div className={classes.root}>
    {showTitle && <Row justifyContent="space-between" alignItems="flex-start">
      <LWTooltip title="Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.">
        <h3 className={classes.formSectionHeadingTitle}>Glossary [Beta]
        </h3>
      </LWTooltip>
      {generateJargonFlagsRow}
      <div className={classes.expandCollapseIcon} onClick={() => setFormCollapsed(!formCollapsed)}>{formCollapsed ? <IconRight height={16} width={16} /> : <IconDown height={16} width={16} />}</div>
    </Row>}
    {header}
    <div className={classNames(classes.window, showMoreTerms && classes.expanded, formCollapsed && classes.formCollapsed)}>
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
          return <JargonEditorRow 
            key={item._id} 
            jargonTerm={item} 
            instancesOfJargonCount={getCount(item)}
            setShowMoreTerms={setShowMoreTerms}
          />;
        })}
        {deletedTerms.length > 0 && <div className={classes.button} onClick={() => setShowDeletedTerms(!showDeletedTerms)}>
          <LWTooltip title="Hidden terms are hidden from readers unless they explicitly opt into 'Show me hidden AI slop the author doesn't necessarily endorse'">
            {showDeletedTerms ? 
              <span>Hide hidden terms</span>
            : 
              <span>Show hidden terms ({deletedTerms.length})</span>
            }
          </LWTooltip>
        </div>}
        {deletedTerms.length > 0 && showDeletedTerms && deletedTerms.map((item) => {
          return <JargonEditorRow key={item._id} jargonTerm={item} instancesOfJargonCount={getCount(item)} setShowMoreTerms={setShowMoreTerms}/>
        })}

      </div>
      <LoadMore {...loadMoreProps} />
    </div>
    {generateJargonFlagsRow}
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

