import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import { commentBodyStyles } from '@/themes/stylePiping';
import { ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';
import { PopperPlacementType } from '@material-ui/core/Popper';
import { useGlossaryPinnedState } from '../hooks/useUpdateGlossaryPinnedState';

const styles = (theme: ThemeType) => ({
  card: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    maxWidth: 350,
    ...commentBodyStyles(theme),
    color: theme.palette.grey[700],
    marginTop: 0,
    marginBottom: 0,
  },
  jargonWord: {
    color: theme.palette.text.jargonTerm,
    textTransform: 'capitalize',
  },
  altTerms: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-between',
  },
  altTerm: {
    color: theme.palette.grey[600],
    fontSize: "0.8em",
    marginRight: 8,
  }
});

export const JargonTooltip = ({definitionHTML, approved, altTerms, humansAndOrAIEdited, isFirstOccurrence = false, placement="top-start", children, classes, tooltipClassName, tooltipTitleClassName}: {
  definitionHTML: string,
  approved: boolean,
  altTerms: string[],
  humansAndOrAIEdited: JargonTermsDefaultFragment['humansAndOrAIEdited'],
  isFirstOccurrence?: boolean,
  placement?: PopperPlacementType
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  tooltipClassName?: string,
  tooltipTitleClassName?: string,
}) => {
  const { LWTooltip, ContentItemBody } = Components;

  const { postGlossariesPinned } = useGlossaryPinnedState();

  let humansAndOrAIEditedText = 'AI Generated'
  if (humansAndOrAIEdited === 'humans') {
    humansAndOrAIEditedText = 'Edited by Human';
  } else if (humansAndOrAIEdited === 'humansAndAI') {
    humansAndOrAIEditedText = 'Edited by AI and Human';
  }

  const tooltip = <Card className={classes.card}>
    <ContentItemBody
      dangerouslySetInnerHTML={{ __html: definitionHTML }}
    />
    {!approved && <div>Unapproved [admin only]</div>}
    <div className={classes.altTerms}>
      <div>
        {altTerms.map((term: string) => (
        <span className={classes.altTerm} key={term}>{term}</span>
        ))}
      </div>
      {humansAndOrAIEditedText && <span className={classes.altTerm}>{humansAndOrAIEditedText}</span>}
    </div>
  </Card>

  // Check the glossary pinned state is a bit of a hack to allow the tooltip to show up on every occurrence of a jargon term
  // when the glossary is pinned, until we fix substring replacement in general.
  if (!isFirstOccurrence && !postGlossariesPinned) {
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
  >
    <span className={classes.jargonWord}>
      {children}
    </span>
  </LWTooltip>;
}

type MinimumExpandableJargonTerm = Pick<JargonTermsPost, '_id' | 'term' | 'altTerms'>;

export function expandJargonAltTerms<T extends MinimumExpandableJargonTerm>(glossaryItem: T, includeOriginalTerm = true): T[] {
  const expandedTerms = [...glossaryItem.altTerms.map(altTerm => ({
    ...glossaryItem,
    term: altTerm,
    // I considered replacing the alt term in the altTerms list with the original term, but decided that'd be confusing to users
  }))];

  if (includeOriginalTerm) {
    expandedTerms.unshift(glossaryItem);
  }
  
  return expandedTerms;
}

function convertGlossaryItemToTextReplacement(glossaryItem: JargonTermsPost): ContentReplacedSubstringComponentInfo {
  return {
    replacedString: glossaryItem.term,
    componentName: "JargonTooltip",
    replace: 'all',
    caseInsensitive: true,
    props: {
      term: glossaryItem.term,
      approved: glossaryItem.approved,
      definitionHTML: glossaryItem.contents?.html ?? '',
      altTerms: glossaryItem.altTerms,
      humansAndOrAIEdited: glossaryItem.humansAndOrAIEdited,
    },
  };
}

export function jargonTermsToTextReplacements(terms: JargonTermsPost[]): ContentReplacedSubstringComponentInfo[] {
  return terms
    .flatMap((glossaryItem) => expandJargonAltTerms(glossaryItem))
    .map(convertGlossaryItemToTextReplacement);
}

const JargonTooltipComponent = registerComponent('JargonTooltip', JargonTooltip, {styles});

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltipComponent
  }
}
