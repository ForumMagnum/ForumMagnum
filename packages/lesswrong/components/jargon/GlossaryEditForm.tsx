import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery"
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classNames from 'classnames';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import JargonEditorRow, { formStyles } from './JargonEditorRow';
import { isFriendlyUI } from '@/themes/forumTheme';
import { useJargonCounts } from '@/components/hooks/useJargonCounts';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { removeJargonDot } from './GlossarySidebar';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { JargonTermForm } from './JargonTermForm';
import { EditablePost } from '@/lib/collections/posts/helpers';
import LoadMore from "../common/LoadMore";
import Loading from "../vulcan-core/Loading";
import LWTooltip from "../common/LWTooltip";
import { IconRight, IconDown } from "../vulcan-forms/FormGroup";
import Row from "../common/Row";
import MetaInfo from "../common/MetaInfo";
import EditUserJargonSettings from "./EditUserJargonSettings";
import ForumIcon from "../common/ForumIcon";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { useQueryWithLoadMore } from '@/components/hooks/useQueryWithLoadMore';

const JargonTermsMultiQuery = gql(`
  query multiJargonTermGlossaryEditFormQuery($selector: JargonTermSelector, $limit: Int, $enableTotal: Boolean) {
    jargonTerms(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...JargonTerms
      }
      totalCount
    }
  }
`);

const JargonTermsUpdateMutation = gql(`
  mutation updateJargonTermGlossaryEditForm1($selector: SelectorInput!, $data: UpdateJargonTermDataInput!) {
    updateJargonTerm(selector: $selector, data: $data) {
      data {
        ...JargonTerms
      }
    }
  }
`);

const PostsEditUpdateMutation = gql(`
  mutation updatePostGlossaryEditForm($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsEdit
      }
    }
  }
`);

// Integrity Alert! This is currently designed so if the model changes, users are informed
// about what model is being used in the jargon generation process.
// If you change this architecture, make sure to update GlossaryEditForm.tsx and the Users' schema
export const JARGON_LLM_MODEL = 'claude-3-5-sonnet-20241022';
export const JARGON_LLM_MODEL_TITLE = JARGON_LLM_MODEL.toUpperCase()

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
    position: 'relative',
  },
  window: {
    maxHeight: 160,
    overflowY: 'scroll',
    display: 'flex',
    justifyContent: 'space-between',
    ...removeJargonDot,
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
    padding: 12,
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
  expandButton: {
    cursor: 'pointer',
    padding: 10,
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: 0.6,
    '&:hover': {
      opacity: 0.8
    },
    position: 'absolute',
    bottom: 4,
    right: 0
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: theme.palette.border.faint,
    marginBottom: 10,
  },
  headerButtons: {
    display: 'flex',
    alignItems: 'center'
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
    border: theme.palette.border.faint,
    borderRadius: 4,
    paddingBottom: 10,
    paddingTop: 16,
    paddingLeft: 24,
    paddingRight: 24,
    marginTop: 16,

  },
  newTermButton: {
    cursor: 'pointer',
    background: theme.palette.buttons.startReadingButtonBackground,
    borderRadius: 4,
    fontSize: 25,
    fontWeight: 900,
    padding: "0 12px 1px 12px",
    marginRight: 10,
  },
  newTermButtonCancel: {
    background: 'unset',
    color: theme.palette.grey[500],
    marginRight: 16,
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
  promptEditorWarning: {
    color: theme.palette.error.main,
    marginTop: 16,
  },
  formCollapsed: {
    display: 'none',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 8,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    }
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  generationFlagCheckbox: {
    padding: 8,
    marginRight: 2,
  },
  inline: {
    display: 'inline',
    cursor: 'pointer',
  },
  warningIcon: {
    marginRight: 10,
    opacity: 0.85,
    height: 20,
    width: 20,
  },
  editPromptIcon: {
    height: 20,
    width: 20,
    marginLeft: 5,
    marginTop: 1,
    color: theme.palette.grey[500]
  }
});

/*
  Returns the number of rows that are effectively visible in the glossary, to determine whether to show the "Expand" button.
*/
const getRowCount = (showDeletedTerms: boolean, nonDeletedTerms: JargonTerms[], deletedTerms: JargonTerms[]) => {
  let rowCount = nonDeletedTerms.length // all non-deleted terms straightforwardly take up one row
  if (showDeletedTerms) {
    rowCount += deletedTerms.length + 1 // +1 for the "Show hidden terms" button row, and the deleted terms themselves
  } else {
    rowCount += deletedTerms.length > 0 ? 1 : 0 // +1 for the "Show hidden terms" button row
  }
  return rowCount;
}

export const GlossaryEditForm = ({ classes, document, showTitle = true }: {
  classes: ClassesType<typeof styles>,
  document: Pick<EditablePost, '_id' | 'generateDraftJargon' | 'contents' | 'userId' | 'draft'>,
  showTitle?: boolean,
}) => {
  const [updatePost] = useMutation(PostsEditUpdateMutation);

  const updatePostAutoGenerate = (autoGenerate: boolean) => {
    void updatePost({
      variables: {
        selector: { _id: document._id },
        data: { generateDraftJargon: autoGenerate }
      }
    });
  }

  const [formCollapsed, setFormCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDeletedTerms, setShowDeletedTerms] = useState(false);
  const [generatedOnce, setGeneratedOnce] = useState(false);
  const [showNewJargonTermForm, setShowNewJargonTermForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);

  const { userId } = document;

  const getPromptExampleStorageKey = (key: string) => `${userId}_${key}`;

  const { glossaryPrompt, setGlossaryPrompt } = useLocalStorageState("glossaryPrompt", getPromptExampleStorageKey, defaultGlossaryPrompt);
  const { examplePost, setExamplePost } = useLocalStorageState("examplePost", getPromptExampleStorageKey, defaultExamplePost);
  const { exampleTerm, setExampleTerm } = useLocalStorageState("exampleTerm", getPromptExampleStorageKey, defaultExampleTerm);
  const { exampleAltTerm, setExampleAltTerm } = useLocalStorageState("exampleAltTerm", getPromptExampleStorageKey, defaultExampleAltTerm);
  const { exampleDefinition, setExampleDefinition } = useLocalStorageState("exampleDefinition", getPromptExampleStorageKey, defaultExampleDefinition);

  const { data, refetch, loadMoreProps } = useQueryWithLoadMore(JargonTermsMultiQuery, {
    variables: {
      selector: { postEditorJargonTerms: { postId: document._id } },
      limit: 500,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const glossary = data?.jargonTerms?.results ?? [];

  const { sortedTerms, getCount } = useJargonCounts(document, glossary);

  const deletedTerms = sortedTerms.filter((item) => item.deleted);
  const nonDeletedTerms = sortedTerms.filter((item) => !item.deleted);
  const sortedApprovedTerms = nonDeletedTerms.filter((item) => item.approved);
  const sortedUnapprovedTerms = nonDeletedTerms.filter((item) => !item.approved);

  const [getNewJargonTerms, { loading: mutationLoading, error }] = useMutation(gql(`
    mutation getNewJargonTerms($postId: String!, $glossaryPrompt: String, $examplePost: String, $exampleTerm: String, $exampleAltTerm: String, $exampleDefinition: String) {
      getNewJargonTerms(postId: $postId, glossaryPrompt: $glossaryPrompt, examplePost: $examplePost, exampleTerm: $exampleTerm, exampleAltTerm: $exampleAltTerm, exampleDefinition: $exampleDefinition) {
        ...JargonTerms
      }
    }
  `));

  const autogenerateJargonTerms = async () => {
    if (!glossaryPrompt) return;
    if (mutationLoading) return;

    void updatePostAutoGenerate(true);
    setGeneratedOnce(true);

    try {
      await getNewJargonTerms({ 
        variables: { postId: document._id, glossaryPrompt, examplePost, exampleTerm, exampleAltTerm, exampleDefinition }
      });
      void refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const [updateJargonTerm] = useMutation(JargonTermsUpdateMutation);

  const handleSetApproveAll = (approve: boolean) => {
    const termsToUpdate = approve ? sortedUnapprovedTerms : sortedApprovedTerms;
    for (const jargonTerm of termsToUpdate) {
      void updateJargonTerm({
        variables: {
          selector: { _id: jargonTerm._id },
          data: {
            approved: approve
          }
        },
        optimisticResponse: {
          updateJargonTerm: {
            __typename: "JargonTermOutput",
            data: {
              __typename: "JargonTerm",
              ...{
                ...jargonTerm,
                approved: approve,
              }
            }
          }
        }
      });
    }
  }

  const handleDeleteUnused = () => {
    const termsToUpdate = sortedUnapprovedTerms;
    for (const jargonTerm of termsToUpdate) {
      void updateJargonTerm({
        variables: {
          selector: { _id: jargonTerm._id },
          data: {
            approved: false,
            deleted: true,
          }
        },
        optimisticResponse: {
          updateJargonTerm: {
            __typename: "JargonTermOutput",
            data: {
              __typename: "JargonTerm",
              ...{
                ...jargonTerm,
                approved: false,
                deleted: true,
              }
            }
          }
        }
      });
    }
  }

  const handleUnhideAll = () => {
    for (const jargonTerm of deletedTerms) {
      void updateJargonTerm({
        variables: {
          selector: { _id: jargonTerm._id },
          data: { deleted: false }
        },
        optimisticResponse: {
          updateJargonTerm: {
            __typename: "JargonTermOutput",
            data: {
              __typename: "JargonTerm",
              ...{
                ...jargonTerm,
                deleted: false,
              }
            }
          }
        }
      });
    }
  }

  const handleShowDeletedTerms = () => {
    setShowDeletedTerms(!showDeletedTerms);
    setExpanded(true);
  }
  
  const promptEditor = <div>
    <h3 className={classes.promptEditorWarning}>WARNING! Prompt edits are only saved in your browser's localStorage.  If you clear your browser's localStorage or switch devices, your prompt edits will be lost.</h3>
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

  const generateJargonFlagsRow = <div className={classes.checkboxRow}>
    <LWTooltip title={<div>
        {document.draft && <Row><ForumIcon icon={"Warning"} className={classes.warningIcon} /> <div>Send this draft to {JARGON_LLM_MODEL_TITLE}, automatically generating glossary terms every 5 min. Review them before publishing.</div></Row>}
      </div>}>
      <div className={classes.checkboxContainer}>
        <Checkbox
          className={classes.generationFlagCheckbox}
          checked={document?.generateDraftJargon ?? undefined}
          onChange={(e) => updatePostAutoGenerate(e.target.checked)}
        />
        <MetaInfo>Autogenerate</MetaInfo>
      </div>
    </LWTooltip>
    <EditUserJargonSettings />
  </div>

  const header = (sortedTerms.length > 0) ? <div className={classNames(classes.header, formCollapsed && classes.formCollapsed)}>
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
  </div> : null;

  const footer = <div className={classNames(classes.buttonRow, formCollapsed && classes.formCollapsed)}>
    <div className={classes.headerButtons}>
    <LWTooltip title={showNewJargonTermForm ? "Cancel adding a new term" : "Manually add a new term to the glossary"}>
      <div className={classNames(classes.newTermButton, showNewJargonTermForm && classes.newTermButtonCancel)} onClick={() => setShowNewJargonTermForm(!showNewJargonTermForm)}>
        +
      </div>
      </LWTooltip>
      <LWTooltip title={<div>Send post to {JARGON_LLM_MODEL_TITLE},<br/>to generate new glossary terms/explanations</div>}>
        <Button onClick={autogenerateJargonTerms} className={classNames(classes.generateButton, (mutationLoading || !glossaryPrompt) && classes.disabled)}>Autogenerate Glossary</Button>
      </LWTooltip>
      <LWTooltip title="Edit the jargon generator LLM prompt">
        <div className={classes.headerButton} onClick={() => setEditingPrompt(!editingPrompt)}>{editingPrompt ? "SAVE PROMPT" : <ForumIcon icon="Settings" className={classes.editPromptIcon} />}</div>
      </LWTooltip>
    </div>
    {mutationLoading && <Loading/>}
    {mutationLoading && <div>(Loading... warning, this will take 30-60 seconds.)</div>}
  </div>

  const rowCount = getRowCount(showDeletedTerms, nonDeletedTerms, deletedTerms);

  return <div className={classes.root}>
    {showTitle && <Row justifyContent="space-between" alignItems="flex-start">
      <LWTooltip title="Beta feature! Select/edit terms below, and readers will be able to hover over and read the explanation.">
        <h3 className={classes.formSectionHeadingTitle}>Glossary [Beta]
        </h3>
      </LWTooltip>
      <div className={classes.expandCollapseIcon} onClick={() => setFormCollapsed(!formCollapsed)}>{formCollapsed ? <IconRight height={16} width={16} /> : <IconDown height={16} width={16} />}</div>
    </Row>}
    {header}
    <div className={classNames(classes.window, expanded && classes.expanded, formCollapsed && classes.formCollapsed)}>
      <div>
        {nonDeletedTerms.map((item) => {
          return <JargonEditorRow 
            key={item._id} 
            jargonTerm={item} 
            instancesOfJargonCount={getCount(item)}
            setShowMoreTerms={setExpanded}
          />;
        })}
        {deletedTerms.length > 0 && <div className={classes.button} onClick={handleShowDeletedTerms}>
          <LWTooltip title="Hidden terms are hidden from readers unless they explicitly opt into 'Show me hidden AI slop the author doesn't necessarily endorse'">
            {showDeletedTerms ? 
              <span>Hide hidden terms</span>
            : 
              <span>Show hidden terms ({deletedTerms.length})</span>
            }
          </LWTooltip>
        </div>}
        {deletedTerms.length > 0 && showDeletedTerms && deletedTerms.map((item) => {
          return <JargonEditorRow key={item._id} jargonTerm={item} instancesOfJargonCount={getCount(item)} setShowMoreTerms={setExpanded}/>
        })}

      </div>
      <LoadMore {...loadMoreProps} />
    </div>
    {showNewJargonTermForm && <div className={classes.formStyles}>
      <JargonTermForm
        postId={document._id}
        onSuccess={() => setShowNewJargonTermForm(false)}
        onCancel={() => setShowNewJargonTermForm(false)}
      />
    </div>}
    {footer}
    {(generatedOnce || editingPrompt || sortedTerms.length > 0) && generateJargonFlagsRow}
    {editingPrompt && promptEditor}
    {/* if there are more than 5 terms, they overflow the default max-height, so show the expand button */}
    {rowCount > 5 ? <div className={classes.expandButton} onClick={() => setExpanded(!expanded)}>
      {expanded 
        ? <>COLLAPSE</>
        : <>EXPAND</>
      }
    </div> : null}
  </div>;
}

export default registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});



