import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Card } from "@/components/widgets/Paper";
import { commentBodyStyles } from '@/themes/stylePiping';
import { ContentReplacedSubstringComponentInfo, ContentItemBody } from '../common/ContentItemBody';
import type { Placement as PopperPlacementType } from "popper.js"
import { useGlossaryPinnedState } from '../hooks/useUpdateGlossaryPinnedState';
import classNames from 'classnames';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { LWTooltip } from "../common/LWTooltip";
import { ForumIcon } from "../common/ForumIcon";
import { LWClickAwayListener } from "../common/LWClickAwayListener";

const styles = defineStyles('JargonTooltip', (theme: ThemeType) => ({
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
      color: theme.palette.text.jargonTerm,
      '&:after': {
        content: '""',
      },
      '&:first-child': {
        color: "unset"
      }
    },
    '& strong $jargonWord, & b $jargonWord': {
      color: 'unset',
    }
  },
  jargonWord: {
    cursor: 'default',
    '&:after': {
      content: '"°"',
      display: 'inline-block',
      width: 4,
      height: 4,
    },
    '&:hover': {
      opacity: .6
    },
    'a &': {
      // When the span is inside a link, inherit the link's color
      color: 'inherit',
    }
  },
  pinnedJargonWord: {
    color: theme.palette.text.jargonTerm,
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
  },
  open: {
    border: `1px solid ${theme.palette.lwTertiary.main}`,
  },
  close: {
    color: theme.palette.grey[500],
    marginRight: 'auto',
    marginLeft: 10
  },
  warning: {
    color: theme.palette.text.warning,
    fontSize: '.9em',
    marginBottom: 8,
  }
}));


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

export const JargonTooltipInner = ({term, definitionHTML, approved, deleted, humansAndOrAIEdited, isFirstOccurrence = false, placement="top-start", children, tooltipClassName, tooltipTitleClassName, forceTooltip=false, replacedSubstrings}: {
  term: string,
  definitionHTML: string,
  approved: boolean,
  deleted: boolean,
  altTerms: string[],
  humansAndOrAIEdited: JargonTermsPost['humansAndOrAIEdited'],
  isFirstOccurrence?: boolean,
  placement?: PopperPlacementType
  children: React.ReactNode,
  tooltipClassName?: string,
  tooltipTitleClassName?: string,
  forceTooltip?: boolean,
  replacedSubstrings?: ContentReplacedSubstringComponentInfo[],
}) => {
  const classes = useStyles(styles);

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

  const tooltip = <Card className={classNames(classes.card, open && classes.open)}>
    {!approved && <div className={classes.warning}>Unapproved by author. Believe at your own peril</div>}
    <ContentItemBody
      dangerouslySetInnerHTML={{ __html: definitionHTML }}
      replacedSubstrings={replacedSubstrings}
    />
    <div className={classes.metadata}>
      {humansAndOrAIEditedText && <div><span className={classes.metadataItem}>
        {icons}{humansAndOrAIEditedText}
      </span></div>}
      {open && <div className={classes.close}><em>Click to close</em></div>}
    </div>
  </Card>

  // Check the glossary pinned state is a bit of a hack to allow the tooltip to show up on every occurrence of a jargon term
  // when the glossary is pinned, until we fix substring replacement in general.
  if (!isFirstOccurrence && !postGlossariesPinned && !forceTooltip) {
    return <>{children}</>;
  }

  return <AnalyticsContext nestedPageElementContext={term}>
    <LWTooltip
      title={tooltip}
      tooltip={false}
      // We don't want text in the post to reflow when jargon terms are highlighted
      inlineBlock={false}
      placement={placement}
      className={tooltipClassName}
      titleClassName={tooltipTitleClassName}
      forceOpen={open}
      analyticsProps={{ pageElementContext: 'jargonTermHovered' }}
      otherEventProps={{ term }}
    >
      <LWClickAwayListener onClickAway={() => setOpen(false)}>
        {/* TODO: fix this so that it uses "displayAsPinned" instead of "postGlossariesPinned" */}
        <span className={classNames(classes.jargonWord, postGlossariesPinned && classes.pinnedJargonWord)} onClick={clickTooltip}>
          {children}
        </span>
      </LWClickAwayListener>
    </LWTooltip>
  </AnalyticsContext>;
}

export const JargonTooltip = registerComponent('JargonTooltip', JargonTooltipInner);

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltip
  }
}
