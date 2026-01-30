"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  $createParagraphNode,
  $getRoot,
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
  LineBreakNode,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { mergeRegister } from '@lexical/utils';

export const TRIGGER_AUTOCOMPLETE_COMMAND: LexicalCommand<void> = createCommand('TRIGGER_AUTOCOMPLETE_COMMAND');
export const TRIGGER_AUTOCOMPLETE_405B_COMMAND: LexicalCommand<void> = createCommand('TRIGGER_AUTOCOMPLETE_405B_COMMAND');

/**
 * Convert HTML to markdown using a simple approach
 * For a more complete solution, consider using a library like turndown
 */
function htmlToMarkdown(html: string): string {
  // Basic conversion - strip HTML tags and preserve structure
  // This is a simplified version; the CKEditor plugin uses TurndownService
  let text = html;
  
  // Convert headings
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  
  // Convert paragraphs
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert bold
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**');
  
  // Convert italic
  text = text.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*');
  
  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Convert lists
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<\/?[uo]l[^>]*>/gi, '\n');
  
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  
  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

/**
 * Get the post title from the page if available
 */
function getPostTitle(): string | null {
  const titleElement = document.querySelector('.form-component-EditTitle');
  return titleElement?.textContent ?? null;
}

/**
 * Get the current user's name from the page if available
 */
function getUserName(): string | null {
  const userElement = document.querySelector('.UsersMenu-userButtonContents');
  return userElement?.textContent ?? null;
}

/**
 * Get the ID of the comment being replied to, if any
 */
function getReplyingCommentId(): string | undefined {
  const currentlySelectedTextField = document.activeElement;
  const replyingToCommentNode = currentlySelectedTextField?.closest('.comments-node');
  return replyingToCommentNode?.id;
}

/**
 * Get the post ID from the URL
 */
function getPostId(): string | undefined {
  // URL format: /posts/:postId/:postSlug
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'posts' && pathParts[2]?.length === 17) {
    return pathParts[2];
  }
  return undefined;
}

/**
 * Handle streaming response from the autocomplete API
 */
async function handleStream(
  stream: ReadableStream<Uint8Array>,
  onMessage: (message: string) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              onMessage(data.content);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetch autocomplete from the API
 */
async function fetchAutocompletion(
  prefix: string,
  endpoint: string,
  onCompletion: (text: string) => void
): Promise<void> {
  const replyingCommentId = getReplyingCommentId();
  const postId = getPostId();
  
  // Get training data from localStorage
  const selectedTrainingUserId = JSON.parse(localStorage.getItem('selectedTrainingUserId') || 'null');
  const selectedTrainingComments = JSON.parse(localStorage.getItem('selectedTrainingComments') || '[]');
  const selectedTrainingPosts = JSON.parse(localStorage.getItem('selectedTrainingPosts') || '[]');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prefix,
      commentIds: selectedTrainingComments,
      postIds: selectedTrainingPosts,
      replyingCommentId,
      postId,
      userId: selectedTrainingUserId ?? undefined,
    }),
  });

  if (!response.body) {
    throw new Error('No response body');
  }

  await handleStream(response.body, onCompletion);
}

/**
 * Plugin for AI-powered autocomplete.
 * 
 * Keyboard shortcuts:
 * - Ctrl+Y: Trigger autocomplete
 * - Ctrl+Shift+Y: Trigger autocomplete with 405b model
 */
export function LLMAutocompletePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const isAutocompleting = useRef(false);

  // Get the content before cursor as markdown
  const getPrefix = useCallback((): string => {
    let content = '';
    
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        // Get selected content
        content = selection.getTextContent();
      } else {
        // Get entire document content as HTML, then convert to markdown
        const html = $generateHtmlFromNodes(editor, null);
        content = htmlToMarkdown(html);
      }
    });

    // Add title and metadata if available
    const title = getPostTitle();
    const userName = getUserName();
    
    if (title) {
      const karma = 50 + Math.floor(Math.random() * 100);
      content = `# ${title}\nby ${userName || 'Anonymous'}\n${new Date().toDateString()}\n${karma}\n${content}`;
    }

    return content;
  }, [editor]);

  // Insert text from autocomplete response
  const insertMessage = useCallback((message: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const paragraphs = message.split('\n\n');
      
      paragraphs.forEach((paragraph, paragraphIndex) => {
        if (paragraphIndex > 0) {
          // Insert new paragraph
          const newParagraph = $createParagraphNode();
          selection.insertNodes([newParagraph]);
        }

        if (paragraph.trim() === '') return;

        const lines = paragraph.split('\n');
        lines.forEach((line, lineIndex) => {
          const prevLine = lines[lineIndex - 1];
          
          // Insert soft break if needed
          if ((prevLine?.trim() !== '' && lineIndex > 0) || line.trim() === '') {
            const lineBreak = new LineBreakNode();
            selection.insertNodes([lineBreak]);
          }
          
          // Insert text
          if (line) {
            const textNode = $createTextNode(line);
            selection.insertNodes([textNode]);
          }
        });
      });
    });
  }, [editor]);

  // Trigger autocomplete
  const autocomplete = useCallback(async (use405b: boolean = false) => {
    if (isAutocompleting.current) return;
    isAutocompleting.current = true;

    try {
      const prefix = getPrefix();
      
      // Insert a space before the completion
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(' ');
        }
      });

      const endpoint = use405b ? '/api/autocomplete405b' : '/api/autocomplete';
      await fetchAutocompletion(prefix, endpoint, insertMessage);
    } finally {
      isAutocompleting.current = false;
    }
  }, [editor, getPrefix, insertMessage]);

  useEffect(() => {
    return mergeRegister(
      // Handle Ctrl+Y for autocomplete
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event: KeyboardEvent) => {
          // Ctrl+Y (keyCode 89)
          if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            event.stopPropagation();
            void autocomplete(false);
            return true;
          }
          
          // Ctrl+Shift+Y for 405b model
          if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            event.stopPropagation();
            void autocomplete(true);
            return true;
          }
          
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),

      // Handle commands
      editor.registerCommand(
        TRIGGER_AUTOCOMPLETE_COMMAND,
        () => {
          void autocomplete(false);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),

      editor.registerCommand(
        TRIGGER_AUTOCOMPLETE_405B_COMMAND,
        () => {
          void autocomplete(true);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, autocomplete]);

  return null;
}

export default LLMAutocompletePlugin;

