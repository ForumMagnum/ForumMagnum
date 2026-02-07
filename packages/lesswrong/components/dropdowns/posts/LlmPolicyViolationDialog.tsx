import React, { useState, useRef, useCallback } from 'react';
import LWDialog from '../../common/LWDialog';
import { DialogContent } from '../../widgets/DialogContent';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import ContentStyles from '../../common/ContentStyles';
import Loading from '../../vulcan-core/Loading';
import { focusLexicalEditor } from '../../editor/focusLexicalEditor';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import dynamic from 'next/dynamic';
import { userGetDisplayName } from '@/lib/collections/users/helpers';

const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'));

const LLM_POLICY_VIOLATION_TEMPLATE_ID = "X2SzJuYxiF5GKBm3D";

const llmPolicyViolationTemplateQuery = gql(`
  query llmPolicyViolationTemplateQuery($selector: SelectorInput) {
    moderationTemplate(selector: $selector) {
      result {
        ...ModerationTemplateFragment
      }
    }
  }
`);

const styles = defineStyles("LlmPolicyViolationDialog", (theme: ThemeType) => ({
  dialogContent: {
    padding: '16px 24px',
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
  },
  editorContainer: {
    marginBottom: 16,
    minHeight: 200,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    padding: 8,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  },
}));

function buildAuthorMention(authorDisplayName: string, authorSlug: string): string {
  const profileUrl = `/users/${authorSlug}?mention=user`;
  return `<a href="${profileUrl}">@${authorDisplayName}</a>`;
}

function buildModComment(templateHtml: string, authorDisplayName: string, authorSlug: string): string {
  const authorMention = buildAuthorMention(authorDisplayName, authorSlug);
  return templateHtml.replace(/\{\{authorMention\}\}/g, authorMention);
}

const LlmPolicyViolationDialog = ({post, onClose, onSubmit}: {
  post: PostsList | SunshinePostsList,
  onClose: () => void,
  onSubmit: (modCommentHtml: string) => void,
}) => {
  const classes = useStyles(styles);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const authorDisplayName = userGetDisplayName(post.user);
  const authorSlug = post.user?.slug ?? '';

  const { data: templateData, loading: templateLoading } = useQuery(llmPolicyViolationTemplateQuery, {
    variables: { selector: { _id: LLM_POLICY_VIOLATION_TEMPLATE_ID } },
    ssr: false,
  });

  const templateHtml = templateData?.moderationTemplate?.result?.contents?.html;
  const initialHtml = templateHtml ? buildModComment(templateHtml, authorDisplayName, authorSlug) : null;

  const [modCommentHtml, setModCommentHtml] = useState<string | null>(null);
  const effectiveHtml = modCommentHtml ?? initialHtml;

  const handleSubmit = useCallback(() => {
    if (effectiveHtml) {
      onSubmit(effectiveHtml);
      onClose();
    }
  }, [effectiveHtml, onSubmit, onClose]);

  return (
    <LWDialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <div className={classes.dialogContent}>
          <div className={classes.title}>LLM Policy Violation</div>
          <div className={classes.description}>
            This will unlist the post (accessible via link only), post a moderator comment,
            and unapprove the user so their future content requires review.
          </div>
          {(templateLoading || !initialHtml) ? (
            <div className={classes.loadingContainer}>
              <Loading />
            </div>
          ) : (
            <div className={classes.editorContainer} ref={editorContainerRef}>
              <ContentStyles contentType='comment'>
                <LexicalEditor
                  data={initialHtml}
                  placeholder="Enter mod comment..."
                  onChange={setModCommentHtml}
                  onReady={() => {
                    focusLexicalEditor(editorContainerRef.current);
                  }}
                  commentEditor
                />
              </ContentStyles>
            </div>
          )}
          <div className={classes.buttonRow}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={classes.submitButton}
              onClick={handleSubmit}
              disabled={!effectiveHtml}
              variant="contained"
            >
              Unlist &amp; Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </LWDialog>
  );
};

export default LlmPolicyViolationDialog;
