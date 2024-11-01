import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import { commentBodyStyles } from '@/themes/stylePiping';
import { ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';
import { PopperPlacementType } from '@material-ui/core/Popper';
import { useGlossaryPinnedState } from '../hooks/useUpdateGlossaryPinnedState';
import { useTracking } from '@/lib/analyticsEvents';

const styles = (theme: ThemeType) => ({
  card: {
    padding: 16,
    paddingBottom: 10,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    maxWidth: 350,
    ...commentBodyStyles(theme),
    color: theme.palette.grey[700],
    marginTop: 0,
    marginBottom: 0,
    '& $jargonWord': {
      color: theme.palette.grey[400]
    },
    '& strong $jargonWord, & b $jargonWord': {
      color: 'unset',
    }
  },
  jargonWord: {
    cursor: 'default',
    color: theme.palette.text.jargonTerm,
    'a &': {
      // When the span is inside a link, inherit the link's color
      color: 'inherit',
    }
  },
  metadata: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: theme.palette.grey[600],
    fontSize: "0.8em",
  },
  metadataItem: {
    marginRight: 8,
  },
  icon: {
    width: 12,
    height: 12,
    color: theme.palette.grey[400],
    marginRight: 4,
    position: 'relative',
    top: 1,
  }
});


function convertGlossaryItemToTextReplacement(glossaryItem: JargonTermsPost): ContentReplacedSubstringComponentInfo {
  // Create an array of all terms (original + alternates) to search for
  const allTerms = [glossaryItem.term, ...glossaryItem.altTerms];
  
  // First trim all terms, then sort by length and escape special chars
  const escapedTerms = allTerms
    .map(term => term.trim())
    .sort((a, b) => b.length - a.length)
    .map(term => term.replace(/[\\/$^*+?.()|[\]{}]-/g, '\\$&')); // Escape regex special chars
  
  return {
    replacedString: escapedTerms.join('|'),
    componentName: "JargonTooltip",
    replace: 'all',
    caseInsensitive: true,
    props: {
      term: glossaryItem.term,
      approved: glossaryItem.approved,
      deleted: glossaryItem.deleted,
      definitionHTML: glossaryItem.contents?.html ?? '',
      altTerms: glossaryItem.altTerms,
      humansAndOrAIEdited: glossaryItem.humansAndOrAIEdited
    },
    isRegex: true,
  };
}

export function jargonTermsToTextReplacements(terms: JargonTermsPost[]): ContentReplacedSubstringComponentInfo[] {
  return terms.map(convertGlossaryItemToTextReplacement);
}

export const JargonTooltip = ({term, definitionHTML, approved, deleted, humansAndOrAIEdited, isFirstOccurrence = false, placement="top-start", children, classes, tooltipClassName, tooltipTitleClassName, forceTooltip=false, replacedSubstrings}: {
  term: string,
  definitionHTML: string,
  approved: boolean,
  deleted: boolean,
  altTerms: string[],
  humansAndOrAIEdited: JargonTermsDefaultFragment['humansAndOrAIEdited'],
  isFirstOccurrence?: boolean,
  placement?: PopperPlacementType
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  tooltipClassName?: string,
  tooltipTitleClassName?: string,
  forceTooltip?: boolean,
  replacedSubstrings?: ContentReplacedSubstringComponentInfo[],
}) => {
  const { LWTooltip, ContentItemBody, ForumIcon, LWClickAwayListener } = Components;
  const { captureEvent } = useTracking();
  const [open, setOpen] = useState(false);

  const { postGlossariesPinned } = useGlossaryPinnedState();

  const clickTooltip = () => {
    captureEvent('clickJargonTermInPost', { term });
    setOpen(!open);
  };

  let humansAndOrAIEditedText = 'AI Generated'
  let icons = <ForumIcon icon="Sparkles" className={classes.icon}/>;
  if (humansAndOrAIEdited === 'humans') {
    humansAndOrAIEditedText = 'Edited by Human';
    icons = <ForumIcon icon="Pencil" className={classes.icon}/>;
  } else if (humansAndOrAIEdited === 'humansAndAI') {
    humansAndOrAIEditedText = 'Edited by AI and Human';
    icons = <>
      <ForumIcon icon="Sparkles" className={classes.icon}/>
      <ForumIcon icon="Pencil" className={classes.icon}/>
    </>;
  }

  const tooltip = <Card className={classes.card}>
    <ContentItemBody
      dangerouslySetInnerHTML={{ __html: definitionHTML }}
      replacedSubstrings={replacedSubstrings}
    />
    <div className={classes.metadata}>
      {humansAndOrAIEditedText && <div><span className={classes.metadataItem}>
        {icons}{humansAndOrAIEditedText}
      </span></div>}

      {!approved && <div>Unapproved</div>}
      {deleted && <div>Deleted</div>}
    </div>
  </Card>

  // Check the glossary pinned state is a bit of a hack to allow the tooltip to show up on every occurrence of a jargon term
  // when the glossary is pinned, until we fix substring replacement in general.
  if (!isFirstOccurrence && !postGlossariesPinned && !forceTooltip) {
    return <>{children}</>;
  }

  return <LWTooltip
    title={tooltip}
    tooltip={false}
    // We don't want text in the post to reflow when jargon terms are highlighted
    inlineBlock={false}
    placement={placement}
    className={tooltipClassName}
    titleClassName={tooltipTitleClassName}
    forceOpen={open}
  >
    <LWClickAwayListener onClickAway={() => setOpen(false)}>
      <span className={classes.jargonWord} onClick={clickTooltip}>
        {children}
      </span>
    </LWClickAwayListener>
  </LWTooltip>;
}

const JargonTooltipComponent = registerComponent('JargonTooltip', JargonTooltip, {styles});

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltipComponent
  }
}
