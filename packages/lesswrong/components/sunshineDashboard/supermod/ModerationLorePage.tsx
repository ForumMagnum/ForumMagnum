'use client';

import { useForumType } from '@/components/hooks/useForumType';
import { supermodAgentStorageEnabledSetting } from '@/lib/instanceSettings';
import React, { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import SingleColumnSection from '@/components/common/SingleColumnSection';
import SectionTitle from '@/components/common/SectionTitle';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import Loading from '@/components/vulcan-core/Loading';
import { moderationLoreScopes, type ModerationLoreScope } from '@/lib/collections/moderationLoreDocs/newSchema';
import { SUPERMOD_AGENT_BASE_SYSTEM_PROMPT } from '@/lib/collections/moderationAgentConversations/agentSystemPrompt';
import { renderAgentMarkdown } from './agentMarkdown';

const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'));

const ModerationLoreDocsQuery = gql(`
  query multiModerationLoreDocsPageQuery($selector: ModerationLoreDocSelector, $limit: Int) {
    moderationLoreDocs(selector: $selector, limit: $limit) {
      results {
        ...ModerationLoreDocDisplay
      }
    }
  }
`);

const CreateModerationLoreDocMutation = gql(`
  mutation createModerationLoreDocPage($data: CreateModerationLoreDocDataInput!) {
    createModerationLoreDoc(data: $data) {
      data {
        ...ModerationLoreDocDisplay
      }
    }
  }
`);

const UpdateModerationLoreDocMutation = gql(`
  mutation updateModerationLoreDocPage($selector: SelectorInput!, $data: UpdateModerationLoreDocDataInput!) {
    updateModerationLoreDoc(selector: $selector, data: $data) {
      data {
        ...ModerationLoreDocDisplay
      }
    }
  }
`);

const styles = defineStyles('ModerationLorePage', (theme: ThemeType) => ({
  description: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    marginBottom: 16,
  },
  docCard: {
    border: theme.palette.border.normal,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.palette.panelBackground.default,
  },
  docHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  docTitle: {
    ...theme.typography.body1,
    fontWeight: 600,
  },
  docMeta: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  docActions: {
    display: 'flex',
    gap: 8,
  },
  actionButton: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    padding: '4px 10px',
    border: theme.palette.border.normal,
    borderRadius: 4,
    background: 'transparent',
    cursor: 'pointer',
    color: theme.palette.grey[700],
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  primaryButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    border: 'none',
  },
  editorContainer: {
    marginTop: 8,
    minHeight: 120,
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: 8,
  },
  collapsedContents: {
    maxHeight: 120,
    overflow: 'hidden',
    position: 'relative',
    '&:after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 40,
      background: `linear-gradient(transparent, ${theme.palette.panelBackground.default})`,
    },
  },
  editToggle: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    marginTop: 4,
  },
  newDocForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    border: theme.palette.border.normal,
    borderRadius: 6,
    padding: 16,
    marginBottom: 24,
    backgroundColor: theme.palette.panelBackground.default,
  },
  formRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    ...theme.typography.commentStyle,
    fontSize: 13,
  },
  textInput: {
    flex: 1,
    padding: '6px 10px',
    fontSize: 14,
    fontFamily: 'inherit',
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.normal,
  },
  select: {
    padding: '6px 8px',
    fontSize: 13,
    fontFamily: 'inherit',
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.normal,
  },
}));

const LoreDocCard = ({ doc, onSave, onDelete, collapsible }: {
  doc: ModerationLoreDocDisplay;
  onSave: (docId: string, html: string, title: string) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  /** Show the contents truncated with a faded cutoff and an Edit link (for long docs like the system prompt) */
  collapsible?: boolean;
}) => {
  const classes = useStyles(styles);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHtml, setEditedHtml] = useState('');
  const [editedTitle, setEditedTitle] = useState(doc.title ?? '');

  const startEditing = () => {
    setEditedHtml(doc.contents?.html ?? '');
    setEditedTitle(doc.title ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onSave(doc._id, editedHtml, editedTitle);
    setIsEditing(false);
  };

  return (
    <div className={classes.docCard}>
      <div className={classes.docHeader}>
        <div>
          {isEditing ? (
            <input
              className={classes.textInput}
              value={editedTitle}
              onChange={(event) => setEditedTitle(event.target.value)}
            />
          ) : (
            <span className={classes.docTitle}>{doc.title}</span>
          )}
          <div className={classes.docMeta}>
            {doc.scope === 'user'
              ? `User-scoped (${doc.targetUser?.displayName ?? doc.targetUserId})`
              : doc.scope === 'systemPrompt' ? 'System prompt' : 'Global'}
            {doc.user?.displayName ? ` · created by ${doc.user.displayName}` : ''}
          </div>
        </div>
        <div className={classes.docActions}>
          {isEditing ? (
            <>
              <button type="button" className={`${classes.actionButton} ${classes.primaryButton}`} onClick={() => void handleSave()}>Save</button>
              <button type="button" className={classes.actionButton} onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button type="button" className={classes.actionButton} onClick={startEditing}>Edit</button>
              <button type="button" className={classes.actionButton} onClick={() => void onDelete(doc._id)}>Delete</button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className={classes.editorContainer}>
          <ContentStyles contentType="comment">
            <LexicalEditor
              data={editedHtml}
              placeholder="Lore contents…"
              onChange={setEditedHtml}
              onReady={() => {}}
              commentEditor
            />
          </ContentStyles>
        </div>
      ) : (
        <>
          <div className={collapsible ? classes.collapsedContents : undefined}>
            <ContentStyles contentType="comment">
              <ContentItemBody dangerouslySetInnerHTML={{ __html: doc.contents?.html ?? '' }} />
            </ContentStyles>
          </div>
          {collapsible && (
            <button type="button" className={classes.editToggle} onClick={startEditing}>
              Edit
            </button>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Editing surface for moderation lore: human-written guidance ("how we
 * moderate") that gets injected into the supermod agent's context. Global
 * docs apply to every agent session; user-scoped docs ride along with that
 * user's dossier. The agent itself can only edit these via its lore tool at a
 * moderator's explicit request.
 */
const ModerationLorePage = () => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();

  const [newTitle, setNewTitle] = useState('');
  const [newScope, setNewScope] = useState<ModerationLoreScope>('global');
  const [newTargetUserId, setNewTargetUserId] = useState('');
  const [newHtml, setNewHtml] = useState('');
  const [editorVersion, setEditorVersion] = useState(0);

  const { data, loading, refetch } = useQuery(ModerationLoreDocsQuery, {
    variables: { selector: { default: {} }, limit: 200 },
    skip: !supermodAgentStorageEnabledSetting.get(forumType),
    ssr: false,
  });

  const [createLoreDoc] = useMutation(CreateModerationLoreDocMutation);
  const [updateLoreDoc] = useMutation(UpdateModerationLoreDocMutation);

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim() || !newHtml.trim()) {
      flash({ messageString: 'Title and contents are required' });
      return;
    }
    if (newScope === 'user' && !newTargetUserId.trim()) {
      flash({ messageString: 'User-scoped lore requires a target userId' });
      return;
    }
    await createLoreDoc({
      variables: {
        data: {
          title: newTitle.trim(),
          scope: newScope,
          targetUserId: newScope === 'user' ? newTargetUserId.trim() : null,
          contents: { originalContents: { type: 'ckEditorMarkup', data: newHtml } },
        },
      },
    });
    setNewTitle('');
    setNewTargetUserId('');
    setNewHtml('');
    setEditorVersion((version) => version + 1);
    await refetch();
  }, [newTitle, newHtml, newScope, newTargetUserId, createLoreDoc, refetch, flash]);

  const handleSave = useCallback(async (docId: string, html: string, title: string) => {
    await updateLoreDoc({
      variables: {
        selector: { _id: docId },
        data: {
          title,
          contents: { originalContents: { type: 'ckEditorMarkup', data: html } },
        },
      },
    });
    await refetch();
  }, [updateLoreDoc, refetch]);

  const handleDelete = useCallback(async (docId: string) => {
    if (!confirm('Delete this lore document?')) return;
    await updateLoreDoc({
      variables: {
        selector: { _id: docId },
        data: { deleted: true },
      },
    });
    await refetch();
  }, [updateLoreDoc, refetch]);

  const handleCustomizeSystemPrompt = useCallback(async () => {
    await createLoreDoc({
      variables: {
        data: {
          title: 'Agent system prompt',
          scope: 'systemPrompt',
          targetUserId: null,
          contents: { originalContents: { type: 'ckEditorMarkup', data: renderAgentMarkdown(SUPERMOD_AGENT_BASE_SYSTEM_PROMPT) } },
        },
      },
    });
    await refetch();
  }, [createLoreDoc, refetch]);

  if (!currentUser || !userIsAdminOrMod(currentUser)) return null;
  if (!supermodAgentStorageEnabledSetting.get(forumType)) {
    return <SingleColumnSection>Agent storage is unavailable on this instance.</SingleColumnSection>;
  }

  const docs = (data?.moderationLoreDocs?.results ?? []).filter((doc) => !doc.deleted);
  const globalDocs = docs.filter((doc) => doc.scope === 'global');
  const userDocs = docs.filter((doc) => doc.scope === 'user');
  const systemPromptDocs = docs.filter((doc) => doc.scope === 'systemPrompt');

  return (
    <SingleColumnSection>
      <SectionTitle title="Moderation Lore" />
      <div className={classes.description}>
        Guidance on how we moderate, written by moderators for the supermod agent (and each other).
        Global lore is injected into every agent session; user-scoped lore is attached to that user's dossier;
        system-prompt docs replace the agent's built-in system prompt (the proposal step vocabulary is
        generated from code and always appended).
      </div>

      <SectionTitle title="System prompt" />
      {systemPromptDocs.length === 0 ? (
        <div className={classes.newDocForm}>
          <div className={classes.description}>
            The agent is using its built-in system prompt. Customize it to create an editable copy;
            once one exists, it replaces the built-in prompt entirely.
          </div>
          <div>
            <button type="button" className={`${classes.actionButton} ${classes.primaryButton}`} onClick={() => void handleCustomizeSystemPrompt()}>
              Customize system prompt
            </button>
          </div>
        </div>
      ) : (
        systemPromptDocs.map((doc) => (
          <LoreDocCard key={doc._id} doc={doc} onSave={handleSave} onDelete={handleDelete} collapsible />
        ))
      )}

      <div className={classes.newDocForm}>
        <div className={classes.formRow}>
          <input
            className={classes.textInput}
            placeholder="Title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />
          <select
            className={classes.select}
            value={newScope}
            onChange={(event) => setNewScope(event.target.value as ModerationLoreScope)}
          >
            {moderationLoreScopes.map((scope) => (
              <option key={scope} value={scope}>{scope}</option>
            ))}
          </select>
          {newScope === 'user' && (
            <input
              className={classes.textInput}
              placeholder="Target userId"
              value={newTargetUserId}
              onChange={(event) => setNewTargetUserId(event.target.value)}
            />
          )}
        </div>
        <div className={classes.editorContainer}>
          <ContentStyles contentType="comment">
            <LexicalEditor
              key={editorVersion}
              data=""
              placeholder="New lore contents…"
              onChange={setNewHtml}
              onReady={() => {}}
              commentEditor
            />
          </ContentStyles>
        </div>
        <div>
          <button type="button" className={`${classes.actionButton} ${classes.primaryButton}`} onClick={() => void handleCreate()}>
            Create lore doc
          </button>
        </div>
      </div>

      {loading && !data && <Loading />}

      <SectionTitle title="Global lore" />
      {globalDocs.map((doc) => (
        <LoreDocCard key={doc._id} doc={doc} onSave={handleSave} onDelete={handleDelete} />
      ))}

      {userDocs.length > 0 && <SectionTitle title="User-scoped lore" />}
      {userDocs.map((doc) => (
        <LoreDocCard key={doc._id} doc={doc} onSave={handleSave} onDelete={handleDelete} />
      ))}
    </SingleColumnSection>
  );
};

export default ModerationLorePage;
