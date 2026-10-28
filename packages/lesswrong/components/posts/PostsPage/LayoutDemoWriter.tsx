'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny-claude-v1): the layout demo's "Write with Claude" page.
// A real shared draft open in LessWrong's collaborative editor (with the layout demo's widget placement
// bar), plus a prompt that hands the draft to Claude. Claude reads and edits the draft through the same
// agent API LessWrong authors use (see /api/SKILL.md); its edits show up here live.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import LexicalEditor from '@/components/editor/LexicalEditor';
import { CENTRAL_COLUMN_WIDTH, LAYOUT_DEMO_PATH } from './constants';
import { LayoutDemoBar, rememberWriterDraft } from './LayoutDemoTabs';

const styles = defineStyles('LayoutDemoWriter', (theme: ThemeType) => ({
  root: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    margin: '0 auto',
    padding: '32px 0 160px',
    [theme.breakpoints.down('xs')]: {
      padding: '20px 16px 120px',
    },
  },
  panel: {
    ...theme.typography.body2,
    fontSize: 14,
    lineHeight: 1.45,
    color: theme.palette.grey[800],
    background: theme.palette.grey[100],
    borderRadius: 6,
    padding: '12px 14px',
    marginBottom: 28,
  },
  steps: {
    margin: '6px 0 10px',
    paddingLeft: 20,
  },
  prompt: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    lineHeight: 1.4,
    padding: '8px 10px',
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 4,
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
    resize: 'vertical',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    ...theme.typography.body2,
    fontSize: 13,
    padding: '5px 12px',
    borderRadius: 5,
    border: 'none',
    cursor: 'pointer',
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  link: {
    fontSize: 13,
  },
  title: {
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    margin: '0 0 24px',
  },
}));

function claudePrompt(siteUrl: string, draftUrl: string) {
  return [
    `Help me write a LessWrong post in this shared draft: ${draftUrl}`,
    ``,
    `It's on an experimental copy of LessWrong at ${siteUrl}. Send every request there, not to www.lesswrong.com.`,
    `1. Read ${siteUrl}/api/SKILL.md, especially "Helping Users With Drafts" and "Widget placement".`,
    `2. Read the draft: curl -H "Accept: text/markdown" "${draftUrl}"`,
    `3. Write with the draft API in edit mode (insertBlock, replaceText, deleteBlock). Add interactive widgets with insertWidget, and put one beside the text with a <meta name="lw-layout" content="position=right width=33%"> line at the top of its HTML.`,
    ``,
    `What I want: `,
  ].join('\n');
}

export function LayoutDemoWriter({ postId, linkSharingKey, title, initialHtml }: {
  postId: string,
  linkSharingKey: string,
  title: string,
  initialHtml: string,
}) {
  const classes = useStyles(styles);
  const [siteUrl, setSiteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setSiteUrl(window.location.origin);
    rememberWriterDraft(`${LAYOUT_DEMO_PATH}/write?postId=${postId}&key=${linkSharingKey}`);
  }, [postId, linkSharingKey]);
  const draftUrl = `${siteUrl}/editPost?postId=${postId}&key=${linkSharingKey}`;
  const prompt = useMemo(() => siteUrl ? claudePrompt(siteUrl, draftUrl) : '', [siteUrl, draftUrl]);

  const copyPrompt = useCallback(() => {
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [prompt]);

  return <div className={classes.root}>
    <div className={classes.panel}>
      <b>Write with Claude.</b> This is a real draft on the experiment server, shared so anyone with this
      page's link can edit it. Claude edits it through the same API LessWrong authors already use, and
      its changes appear here live.
      <ol className={classes.steps}>
        <li>Copy the prompt, add what you want written at the end, and give it to Claude (Claude Code works
          as is; in claude.ai, first add <code>{siteUrl ? new URL(siteUrl).host : '…'}</code> to the allowed
          domains in Settings).</li>
        <li>Keep this page open and watch. Hover a widget to move it left or right, or change its width.</li>
      </ol>
      <textarea className={classes.prompt} readOnly rows={8} value={prompt} onFocus={e => e.currentTarget.select()} />
      <div className={classes.actions}>
        <button type="button" className={classes.button} onClick={copyPrompt} disabled={!prompt}>
          {copied ? 'Copied' : 'Copy prompt for Claude'}
        </button>
        <a className={classes.link} href={`${LAYOUT_DEMO_PATH}/write?new=1`}>Start a new draft</a>
      </div>
    </div>
    <h1 className={classes.title}>{title}</h1>
    <ContentStyles contentType="post">
      <LexicalEditor
        data={initialHtml}
        collectionName="Posts"
        documentId={postId}
        commentEditor={false}
        placeholder="Start writing, or ask Claude to."
        keepFocusOnLoad
      />
    </ContentStyles>
    <LayoutDemoBar active="write" note="Shared draft · Normal text width (682)" />
  </div>;
}
