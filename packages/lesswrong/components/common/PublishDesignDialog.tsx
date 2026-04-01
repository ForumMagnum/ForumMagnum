'use client';

import React, { useState, useCallback } from 'react';
import LWDialog from './LWDialog';
import { DialogContent } from '../widgets/DialogContent';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ContentStyles from './ContentStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import dynamic from 'next/dynamic';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import PostsTooltip from '../posts/PostsPreviewTooltip/PostsTooltip';
import { MARKETPLACE_POST_ID } from '@/lib/collections/homePageDesigns/constants';

const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'));

const publishHomePageDesignMutation = gql(`
  mutation PublishHomePageDesign($input: PublishHomePageDesignInput!) {
    publishHomePageDesign(input: $input) {
      data {
        _id
        publicId
        commentId
      }
    }
  }
`);

const styles = defineStyles("PublishDesignDialog", (theme: ThemeType) => ({
  dialogContent: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.palette.grey[700],
    marginBottom: 16,
    lineHeight: '1.5',
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  titleInput: {
    width: '100%',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    padding: '8px 12px',
    border: theme.palette.border.normal,
    borderRadius: 4,
    outline: 'none',
    color: theme.palette.text.normal,
    background: theme.palette.panelBackground.default,
    marginBottom: 12,
    boxSizing: 'border-box',
    '&:focus': {
      borderColor: theme.palette.primary.main,
    },
  },
  editorContainer: {
    marginBottom: 16,
    minHeight: 120,
    border: theme.palette.border.normal,
    borderRadius: 4,
    padding: 8,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: 12,
  },
  publishButton: {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    '&:hover': {
      backgroundColor: '#4e8a54',
    },
    '&:disabled': {
      opacity: 0.5,
    },
  },
}), { allowNonThemeColors: true });

const PublishDesignDialog = ({ publicId, onClose }: {
  publicId: string;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
  const [title, setTitle] = useState<string>('');
  const [descriptionHtml, setDescriptionHtml] = useState<string>('');
  const [publish, { loading }] = useMutation(publishHomePageDesignMutation);

  const handlePublish = useCallback(async () => {
    if (!title.trim() || !descriptionHtml.trim()) return;
    await publish({
      variables: {
        input: { publicId, title, descriptionHtml },
      },
    });
    onClose();
  }, [title, descriptionHtml, publicId, publish, onClose]);

  const marketplaceUrl = `/posts/${MARKETPLACE_POST_ID}`;

  return (
    <LWDialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <div className={classes.dialogContent}>
          <div className={classes.title}>Publish to Marketplace</div>
          <div className={classes.description}>
            This will post a comment with a link to your design in
            the <PostsTooltip postId={MARKETPLACE_POST_ID}><a href={marketplaceUrl} target="_blank" rel="noopener noreferrer">home page marketplace</a></PostsTooltip>.
            Your comment will appear immediately, but your design will go through
            a brief automated review (usually under a minute). If the review flags
            an issue, your comment will be removed and you'll receive a message
            letting you know.
          </div>
          <TextField
            className={classes.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title for your design"
            InputProps={{
              disableUnderline: true,
            }}
          />
          <div className={classes.editorContainer}>
            <ContentStyles contentType='comment'>
              <LexicalEditor
                data=""
                placeholder="Describe your design..."
                onChange={setDescriptionHtml}
                commentEditor
              />
            </ContentStyles>
          </div>
          <div className={classes.buttonRow}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={classes.publishButton}
              onClick={handlePublish}
              disabled={!title.trim() || !descriptionHtml.trim() || loading}
              variant="contained"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </LWDialog>
  );
};

export default PublishDesignDialog;
