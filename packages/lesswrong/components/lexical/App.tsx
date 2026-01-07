/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './index.css';

import {$createLinkNode} from '@lexical/link';
import {$createListItemNode, $createListNode} from '@lexical/list';
import {LexicalCollaboration} from '@lexical/react/LexicalCollaborationContext';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {$createHeadingNode, $createQuoteNode} from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  defineExtension,
} from 'lexical';
import React, {type JSX, useMemo} from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalApp', (theme: ThemeType) => ({
  editorShell: {
    margin: '20px auto',
    borderRadius: 2,
    maxWidth: 1100,
    color: theme.palette.grey[1000],
    position: 'relative',
    lineHeight: '1.7',
    fontWeight: 400,
    
    // Typeahead menu width overrides
    '& .mentions-menu': {
      width: 250,
    },
    '& .auto-embed-menu': {
      width: 150,
    },
    '& .emoji-menu': {
      width: 200,
    },
    
    // Mention focus state
    '& .mention:focus': {
      boxShadow: `${theme.palette.lexicalEditor.mentionFocus} 0px 0px 0px 2px`,
      outline: 'none',
    },
    
    // Character limit display
    '& .characters-limit': {
      color: theme.palette.grey[550],
      fontSize: 12,
      textAlign: 'right',
      display: 'block',
      position: 'absolute',
      left: 12,
      bottom: 5,
      '&.characters-limit-exceeded': {
        color: theme.palette.error.main,
      },
    },
    
    // Responsive dropdown behavior
    '@media screen and (max-width: 1100px)': {
      '& .dropdown-button-text': {
        display: 'none !important',
      },
      '& .dialog-dropdown > .dropdown-button-text': {
        display: 'flex !important',
      },
      '& .font-size .dropdown-button-text': {
        display: 'flex !important',
      },
      '& .code-language .dropdown-button-text': {
        display: 'flex !important',
      },
    },
    
    // Editor image styles (Lexical theme class names)
    '& span.editor-image': {
      cursor: 'default',
      display: 'inline-block',
      position: 'relative',
      userSelect: 'none',
      overflow: 'hidden',
    },
    '& .editor-image img': {
      maxWidth: '100%',
      cursor: 'default',
    },
    '& .editor-image img.focused': {
      outline: `2px solid ${theme.palette.lexicalEditor.focusRing}`,
      userSelect: 'none',
    },
    '& .editor-image img.focused.draggable': {
      cursor: 'grab',
    },
    '& .editor-image img.focused.draggable:active': {
      cursor: 'grabbing',
    },
    
    // Emoji styles (Lexical theme class names)
    '& .emoji': {
      color: 'transparent',
      caretColor: theme.palette.grey[1000],
      backgroundSize: '16px 16px',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      verticalAlign: 'middle',
      margin: '0 -1px',
    },
    '& .emoji-inner': {
      padding: '0 0.15em',
    },
    '& .emoji-inner::selection': {
      color: 'transparent',
      backgroundColor: theme.palette.greyAlpha(0.4),
    },
    // Note: emoji background-images (happysmile, etc.) kept in CSS due to URL references
    
    // Keyword styles (Lexical theme class name)
    '& .keyword': {
      color: theme.palette.lexicalEditor.keyword,
      fontWeight: 'bold',
    },
    
    // Table cell action button (Lexical theme class names)
    '& .table-cell-action-button-container': {
      position: 'absolute',
      zIndex: 3,
      top: 0,
      left: 0,
      willChange: 'transform',
      '&.table-cell-action-button-container--active': {
        pointerEvents: 'auto',
        opacity: 1,
      },
      '&.table-cell-action-button-container--inactive': {
        pointerEvents: 'none',
        opacity: 0,
      },
    },
    '& .table-cell-action-button': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 0,
      position: 'absolute',
      top: 10,
      right: 10,
      borderRadius: 15,
      color: theme.palette.grey[900],
      cursor: 'pointer',
    },
    
    // Editor equation styles (Lexical theme class names)
    '& .editor-equation': {
      cursor: 'default',
      userSelect: 'none',
      '&.focused': {
        outline: `2px solid ${theme.palette.lexicalEditor.focusRing}`,
      },
    },
    
    // TableNode content editable (Lexical table theme)
    '& .TableNode__contentEditable': {
      minHeight: 20,
      border: 0,
      resize: 'none',
      cursor: 'text',
      display: 'block',
      position: 'relative',
      outline: 0,
      padding: 0,
      userSelect: 'text',
      fontSize: 15,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      zIndex: 3,
    },
  },
}));

import {isDevPlayground} from './appSettings';
import {buildHTMLConfig} from './buildHTMLConfig';
import {FlashMessageContext} from './context/FlashMessageContext';
import {SettingsContext, useSettings} from './context/SettingsContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {ToolbarContext} from './context/ToolbarContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import DocsPlugin from './plugins/DocsPlugin';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import {TableContext} from './plugins/TablePlugin';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

function $prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1');
    heading.append($createTextNode('Welcome to the playground'));
    root.append(heading);
    const quote = $createQuoteNode();
    quote.append(
      $createTextNode(
        `In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. ` +
          `You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.`,
      ),
    );
    root.append(quote);
    const paragraph = $createParagraphNode();
    paragraph.append(
      $createTextNode('The playground is a demo environment built with '),
      $createTextNode('@lexical/react').toggleFormat('code'),
      $createTextNode('.'),
      $createTextNode(' Try typing in '),
      $createTextNode('some text').toggleFormat('bold'),
      $createTextNode(' with '),
      $createTextNode('different').toggleFormat('italic'),
      $createTextNode(' formats.'),
    );
    root.append(paragraph);
    const paragraph2 = $createParagraphNode();
    paragraph2.append(
      $createTextNode(
        'Make sure to check out the various plugins in the toolbar. You can also use #hashtags or @-mentions too!',
      ),
    );
    root.append(paragraph2);
    const paragraph3 = $createParagraphNode();
    paragraph3.append(
      $createTextNode(`If you'd like to find out more about Lexical, you can:`),
    );
    root.append(paragraph3);
    const list = $createListNode('bullet');
    list.append(
      $createListItemNode().append(
        $createTextNode(`Visit the `),
        $createLinkNode('https://lexical.dev/').append(
          $createTextNode('Lexical website'),
        ),
        $createTextNode(` for documentation and more information.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Check out the code on our `),
        $createLinkNode('https://github.com/facebook/lexical').append(
          $createTextNode('GitHub repository'),
        ),
        $createTextNode(`.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Playground code can be found `),
        $createLinkNode(
          'https://github.com/facebook/lexical/tree/main/packages/lexical-playground',
        ).append($createTextNode('here')),
        $createTextNode(`.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Join our `),
        $createLinkNode('https://discord.com/invite/KmG4wQnnD9').append(
          $createTextNode('Discord Server'),
        ),
        $createTextNode(` and chat with the team.`),
      ),
    );
    root.append(list);
    const paragraph4 = $createParagraphNode();
    paragraph4.append(
      $createTextNode(
        `Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance :).`,
      ),
    );
    root.append(paragraph4);
  }
}

function App(): JSX.Element {
  const {
    settings: {isCollab, emptyEditor, measureTypingPerf},
  } = useSettings();

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: isCollab
          ? null
          : emptyEditor
            ? undefined
            : $prepopulatedRichText,
        html: buildHTMLConfig(),
        name: '@lexical/playground',
        namespace: 'Playground',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
      }),
    [emptyEditor, isCollab],
  );

  const classes = useStyles(styles);

  return (
    <LexicalCollaboration>
      <LexicalExtensionComposer extension={app} contentEditable={null}>
        <SharedHistoryContext>
          <TableContext>
            <ToolbarContext>
              <div className={classes.editorShell}>
                <Editor />
              </div>
              <Settings />
              {isDevPlayground ? <DocsPlugin /> : null}
              {isDevPlayground ? <PasteLogPlugin /> : null}
              {isDevPlayground ? <TestRecorderPlugin /> : null}

              {measureTypingPerf ? <TypingPerfPlugin /> : null}
            </ToolbarContext>
          </TableContext>
        </SharedHistoryContext>
      </LexicalExtensionComposer>
    </LexicalCollaboration>
  );
}

export default function PlaygroundApp(): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <App />
      </FlashMessageContext>
    </SettingsContext>
  );
}
