import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { Paper, Card }from '@/components/widgets/Paper';
import classNames from 'classnames';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import EditIcon from '@/lib/vendor/@material-ui/icons/src/Edit'
import { Link } from '../../lib/reactRouterWrapper';
import LWTooltip from "../common/LWTooltip";
import { ContentItemBody } from "../contents/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import CKEditor from '../../lib/vendor/ckeditor5-react/ckeditor';
import { getCkCommentEditor } from '../../lib/wrapCkEditor';
import type { Editor } from '@ckeditor/ckeditor5-core';
import LWDialog from '../common/LWDialog';
import { makeSortableListComponent } from '../form-components/sortableList';
import ForumIcon from '../common/ForumIcon';
import { getBrowserLocalStorage } from '@/components/editor/localStorageHandlers';
import { useCurrentUser } from '../common/withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';
import KeystrokeDisplay from './supermod/KeystrokeDisplay';
import { useGlobalKeydown } from '../common/withGlobalKeydown';

const styles = defineStyles('RejectContentDialog', (theme: ThemeType) => ({
  dialogContent: {
    width: 480,
    backgroundColor: theme.palette.panelBackground.default,
    padding: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    overflow: 'auto',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    marginBottom: 12,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.background.paper,
    outline: 'none',
    // Necessary to override the default input styling which remove the border if the input is focused
    '&:focus': {
      border: `1px solid ${theme.palette.grey[300]}`,
    }
  },
  rejectionCheckboxes: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  checkbox: {
    paddingTop: 2,
    paddingBottom: 2
  },
  editorContainer: {
    marginTop: 10,
    minHeight: 150,
    '& .ck-editor__editable': {
      minHeight: 150,
    },
  },
  hideEditorContainer: {
    display: 'none'
  },
  defaultIntroMessage: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 4,
    fontSize: 14,
    '& p': {
      margin: '0 0 10px 0',
      '&:last-child': {
        margin: 0,
      }
    },
    '& a': {
      color: theme.palette.primary.main,
    }
  },
  card: {
    padding: 12,
    width: 500,
  },
  reason: {
    '&:hover $editIcon, &:hover $hideButtonIcon': {
      opacity: 1
    },
    width: '100%',
  },
  templateTooltip: {
    width: '100%',
  },
  editIcon: {
    height: 12,
    color: theme.palette.grey[500],
    opacity: 0
  },
  topReason: {
    fontWeight: 600
  },
  nonTopReason: {
    opacity: .6
  },
  dragHandle: {
    cursor: 'grab',
    marginRight: 8,
    color: theme.palette.grey[400],
    opacity: 0,
    transition: 'opacity 0.2s ease',
    '&:hover': {
      color: theme.palette.grey[600],
    },
  },
  dragIndicatorIcon: {
    width: 16,
    height: 16,
  },
  templateRowItem: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 3,
    '&.selected': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  templateName: {
    flexGrow: 1,
  },
  hideButton: {
    cursor: 'pointer',
    marginTop: 4,
    marginLeft: 4,
    color: theme.palette.grey[400],
    '&:hover': {
      color: theme.palette.error.main,
    },
  },
  hideButtonIcon: {
    height: 14,
    width: 14,
    opacity: 0,
  },
  editLink: {
    marginTop: 4,
  },
  templateRow: {
    display: 'flex',
    alignItems: 'center',
    '&:hover $dragHandle': {
      opacity: 1,
      color: theme.palette.grey[600],
    },
  },
  hiddenSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  hiddenSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.grey[600],
    marginBottom: 8,
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  hiddenSectionIcon: {
    marginRight: 4,
  },
  hiddenTemplates: {
    paddingLeft: 24,
  },
  unhideButton: {
    cursor: 'pointer',
    marginTop: 4,
    marginLeft: 4,
    color: theme.palette.grey[400],
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
}));

interface TemplateConfig {
  hiddenTemplateIds: string[];
  templateOrder: string[];
}

type TemplateRowProps = {
  selected: boolean;
  template: ModerationTemplateFragment;
  isTop6: boolean;
  selections: Record<string, boolean>;
  onCheckboxChange: (label: string, checked: boolean) => void;
} & (
  {
    onHide: (templateId: string) => void;
    onUnhide?: never;
  } | {
    onHide?: never;
    onUnhide: (templateId: string) => void;
  }
);

const TemplateRowContent = ({
  template,
  selected,
  isTop6,
  selections,
  onCheckboxChange,
  onHide,
  onUnhide,
}: TemplateRowProps) => {
  const classes = useStyles(styles);

  return (
    <div className={classNames(classes.reason, isTop6 ? classes.topReason : classes.nonTopReason)}>
      <LWTooltip className={classes.templateTooltip} placement="right-end" tooltip={false} title={<Card className={classes.card}>
        <ContentStyles contentType='comment'>
          <ContentItemBody dangerouslySetInnerHTML={{__html: template.contents?.html ?? ""}} />
        </ContentStyles>
      </Card>}>
        <div className={classNames(classes.templateRowItem, { selected })}>
          <Checkbox
            checked={selections[template.name]}
            onChange={(_, checked) => onCheckboxChange(template.name, checked)}
            className={classes.checkbox}
          />
          <span className={classes.templateName}>{template.name}</span>
          <Link className={classes.editLink} to={`/admin/moderationTemplates#${template._id}`} target="_blank">
            <EditIcon className={classes.editIcon}/>
          </Link>
          {onHide && (
            <span className={classes.hideButton} onClick={() => onHide(template._id)}>
              <LWTooltip title="Hide this template" placement="right">
                <ForumIcon icon="Close" className={classes.hideButtonIcon} />
              </LWTooltip>
            </span>
          )}
          {onUnhide && (
            <span className={classes.unhideButton} onClick={() => onUnhide(template._id)}>
              <LWTooltip title="Unhide this template" placement="right">
                <ForumIcon icon="Eye" className={classes.hideButtonIcon} />
              </LWTooltip>
            </span>
          )}
        </div>
      </LWTooltip>
    </div>
  );
};

const STORAGE_KEY_PREFIX = 'rejectionTemplateConfig_';

const RejectContentDialog = ({rejectionTemplates, onClose, rejectContent}: {
  rejectionTemplates: ModerationTemplateFragment[],
  onClose?: () => void,
  rejectContent: (reason: string) => void,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [selections, setSelections] = useState<Record<string,boolean>>({});
  const [hideTextField, setHideTextField] = useState(true);
  const [rejectedReason, setRejectedReason] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [hiddenTemplateIds, setHiddenTemplateIds] = useState<Set<string>>(new Set());
  const [templateOrder, setTemplateOrder] = useState<string[]>([]);
  const [showHiddenSection, setShowHiddenSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialHeight, setInitialHeight] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const checkboxesContainerRef = useRef<HTMLDivElement>(null);
  const templateListRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const rejectionReasons = Object.fromEntries(rejectionTemplates.map(({name, contents}) => [name, contents?.html]));

  useEffect(() => {
    const ls = getBrowserLocalStorage();
    if (!ls || !currentUser) return;

    const storageKey = `${STORAGE_KEY_PREFIX}${currentUser._id}`;
    const storedConfig = ls.getItem(storageKey);
    
    if (storedConfig) {
      try {
        const config: TemplateConfig = JSON.parse(storedConfig);
        setHiddenTemplateIds(new Set(config.hiddenTemplateIds || []));
        
        const currentTemplateIds = new Set(rejectionTemplates.map(t => t._id));
        const storedOrderIds = new Set(config.templateOrder || []);
        
        // Find new templates that aren't in the stored order
        const newTemplateIds = rejectionTemplates
          .map(t => t._id)
          .filter(id => !storedOrderIds.has(id));
        
        // Keep only templates that still exist from the stored order
        const existingStoredOrder = (config.templateOrder || []).filter(id => 
          currentTemplateIds.has(id)
        );
        
        // Prepend new templates to the existing order
        const finalOrder = [...newTemplateIds, ...existingStoredOrder];
        setTemplateOrder(finalOrder);
      } catch (e) {
        // If parsing fails, use default order
        setTemplateOrder(rejectionTemplates.map(t => t._id));
      }
    } else {
      // No stored config, use default order
      setTemplateOrder(rejectionTemplates.map(t => t._id));
    }
  }, [currentUser, rejectionTemplates]);

  useEffect(() => {
    // Without the setTimeout, the input doesn't end up focused.
    // Maybe something about how dialog contents are mounted?  :shrug:
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, []);

  useEffect(() => {
    if (checkboxesContainerRef.current && initialHeight === null && templateOrder.length > 0) {
      const height = checkboxesContainerRef.current.offsetHeight;
      setInitialHeight(height);
    }
  }, [templateOrder, initialHeight]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const selectedElement = templateListRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const saveConfig = useCallback((hiddenIds: Set<string>, order: string[]) => {
    const ls = getBrowserLocalStorage();
    if (!ls || !currentUser) return;

    const storageKey = `${STORAGE_KEY_PREFIX}${currentUser._id}`;
    const config: TemplateConfig = {
      hiddenTemplateIds: Array.from(hiddenIds),
      templateOrder: order,
    };
    
    ls.setItem(storageKey, JSON.stringify(config));
  }, [currentUser]);

  const hideTemplate = useCallback((templateId: string) => {
    const newHiddenIds = new Set(hiddenTemplateIds);
    newHiddenIds.add(templateId);
    setHiddenTemplateIds(newHiddenIds);
    saveConfig(newHiddenIds, templateOrder);
  }, [hiddenTemplateIds, templateOrder, saveConfig]);

  const unhideTemplate = useCallback((templateId: string) => {
    const newHiddenIds = new Set(hiddenTemplateIds);
    newHiddenIds.delete(templateId);
    setHiddenTemplateIds(newHiddenIds);
    saveConfig(newHiddenIds, templateOrder);
  }, [hiddenTemplateIds, templateOrder, saveConfig]);

  const updateTemplateOrder = useCallback((newVisibleOrder: string[]) => {
    // Reconstruct full order: new visible order followed by hidden templates
    const hiddenIds = templateOrder.filter(id => hiddenTemplateIds.has(id));
    const fullOrder = [...newVisibleOrder, ...hiddenIds];
    
    setTemplateOrder(fullOrder);
    saveConfig(hiddenTemplateIds, fullOrder);
  }, [hiddenTemplateIds, templateOrder, saveConfig]);

  const handleClick = useCallback(() => {
    rejectContent(rejectedReason);
    onClose?.();
  }, [rejectContent, rejectedReason, onClose]);

  const composeRejectedReason = useCallback((label: string, checked: boolean) => {
    const newSelections = {...selections, [label]: checked};
    setSelections(newSelections);

    const composedReason = `<ul>${
      Object.entries(newSelections)
        .filter(([_, reasonSelected]) => reasonSelected)
        .map(([reasonKey]) => `<li>${rejectionReasons[reasonKey]}</li>`)
        .join('')
    }</ul>`;

    setRejectedReason(composedReason);
    if (editor) {
      editor.setData(composedReason);
    }
  }, [selections, rejectionReasons, editor]);

  const CommentEditor = getCkCommentEditor();

  const editorConfig = {
    toolbar: [
      'bold',
      'italic',
      '|',
      'link',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
    ],
    placeholder: 'Enter rejection reason...',
  };

  // Standard rejection intro that will be prepended to the message
  const standardIntroHtml = `
    <p>Unfortunately, I rejected your [content].</p>
    <p>LessWrong aims for particularly high quality (and somewhat oddly-specific) discussion quality. We get a lot of content from new users and sadly can't give detailed feedback on every piece we reject, but I generally recommend checking out our <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong">New User's Guide</a>, in particular the section on <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong#How_to_ensure_your_first_post_or_comment_is_well_received">how to ensure your content is approved</a>.</p>
    <p>Your content didn't meet the bar for at least the following reason(s):</p>
  `;

  // Create a map for quick template lookup
  const templatesById = Object.fromEntries(rejectionTemplates.map(t => [t._id, t]));

  const orderedTemplates = templateOrder
    .map(id => templatesById[id])
    .filter(template => !!template);
  
  const matchesSearch = (template: ModerationTemplateFragment) => {
    if (!searchQuery) return true;
    return template.name.toLowerCase().includes(searchQuery.toLowerCase());
  };
  
  const visibleTemplates = orderedTemplates.filter(t => !hiddenTemplateIds.has(t._id) && matchesSearch(t));
  const hiddenTemplates = orderedTemplates.filter(t => hiddenTemplateIds.has(t._id) && matchesSearch(t));

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev === visibleTemplates.length - 1 ? 0 : prev + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? visibleTemplates.length - 1 : prev - 1);
        break;
      case 'Enter':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (rejectedReason) {
            handleClick();
          }
        } else {
          e.preventDefault();
          if (visibleTemplates[selectedIndex]) {
            const template = visibleTemplates[selectedIndex];
            const currentlyChecked = selections[template.name] ?? false;
            composeRejectedReason(template.name, !currentlyChecked);
          }
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (hideTextField) {
          setHideTextField(false);
        }
        // We need the outer setTimeout to allow a rerender after `setHideTextField` causes a state update to show the editor
        // and the inner timeout to allow the scroll to finish (since apparently focusing an element will interrupt the scroll)
        setTimeout(() => {
          editorContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            editor?.focus();
          }, 300);
        }, 0);
        break;
    }
  }, [visibleTemplates, selectedIndex, selections, composeRejectedReason, rejectedReason, hideTextField, editor, handleClick]);

  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (rejectedReason) {
        e.preventDefault();
        handleClick();
      }
    }
  }, [rejectedReason, handleClick]));

  const SortableTemplateList = makeSortableListComponent({
    RenderItem: ({ contents: templateId }) => {
      const template = templatesById[templateId];
      if (!template) return null;

      const originalIndex = visibleTemplates.findIndex(t => t._id === templateId);
      const top6 = originalIndex < 6;
      const isSelected = originalIndex === selectedIndex;

      return (
        <div className={classes.templateRow}>
          <span className={classes.dragHandle}>
            <LWTooltip title="Drag to reorder" placement="left">
              <ForumIcon icon="DragIndicator" className={classes.dragIndicatorIcon} />
            </LWTooltip>
          </span>
          <TemplateRowContent
            template={template}
            isTop6={top6}
            selections={selections}
            onCheckboxChange={composeRejectedReason}
            onHide={hideTemplate}
            selected={isSelected}
          />
        </div>
      );
    }
  });

  const dialogContent = <>
    <input
      ref={searchInputRef}
      className={classes.searchInput}
      type="text"
      placeholder="Search templates..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={handleKeyDown}
    />
    <div 
      ref={checkboxesContainerRef}
      className={classes.rejectionCheckboxes}
      style={initialHeight !== null ? { minHeight: initialHeight } : undefined}
    >
    <div ref={templateListRef}>
      <SortableTemplateList
        value={visibleTemplates.map(t => t._id)}
        setValue={updateTemplateOrder}
        axis="y"
      />
    </div>
    
    {hiddenTemplates.length > 0 && (
      <div className={classes.hiddenSection}>
        <div 
          className={classes.hiddenSectionHeader}
          onClick={() => setShowHiddenSection(!showHiddenSection)}
        >
          <ForumIcon 
            icon={showHiddenSection ? "ExpandLess" : "ExpandMore"} 
            className={classes.hiddenSectionIcon}
          />
          Hidden Templates ({hiddenTemplates.length})
        </div>
        
        {showHiddenSection && (
          <div className={classes.hiddenTemplates}>
            {hiddenTemplates.map(template => (
              <div key={template._id} className={classes.templateRow}>
                <TemplateRowContent
                  template={template}
                  isTop6={false}
                  selections={selections}
                  onCheckboxChange={composeRejectedReason}
                  onUnhide={unhideTemplate}
                  selected={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    <div className={classNames(classes.editorContainer, { [classes.hideEditorContainer]: hideTextField })} ref={editorContainerRef}>
      <div className={classes.defaultIntroMessage}>
        <ContentStyles contentType='comment'>
          <ContentItemBody dangerouslySetInnerHTML={{__html: standardIntroHtml}} />
        </ContentStyles>
      </div>

      <ContentStyles contentType='comment'>
        <CKEditor
          editor={CommentEditor}
          data={rejectedReason}
          config={editorConfig}
          isCollaborative={false}
          onReady={(editor: Editor) => {
            setEditor(editor);
          }}
          onChange={(event: any, editor: Editor) => {
            const data = editor.getData();
            setRejectedReason(data);
          }}
        />
      </ContentStyles>
    </div>
    </div>
  </>

  const dialogElement = <Paper>
    <div className={classes.dialogContent}>
      {dialogContent}
      <Button onClick={handleClick} disabled={!rejectedReason}>
        Reject
        <KeystrokeDisplay keystroke="Ctrl+Enter" withMargin splitBeforeTranslation />
      </Button>
      <Button onClick={() => setHideTextField(!hideTextField)}>
        {hideTextField ? 'Edit Message' : 'Hide Message'}
        <KeystrokeDisplay keystroke="Tab" withMargin />
      </Button>
    </div>
  </Paper>;

  if (!onClose) {
    return dialogElement;
  }

  return (
    <LWDialog open={true} onClose={onClose}>
      {dialogElement}
    </LWDialog>
  );

};

export default RejectContentDialog;


