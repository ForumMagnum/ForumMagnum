import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import { commentBodyStyles } from '@/themes/stylePiping';
import { ContentReplacedSubstringComponentInfo, ContentReplacementMode } from '../common/ContentItemBody';
import { PopperPlacementType } from '@material-ui/core/Popper';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  card: {
    padding: 16,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    maxWidth: 350,
    ...commentBodyStyles(theme),
    color: theme.palette.grey[700],
    marginTop: 0,
    marginBottom: 0,
  },
  jargonWord: {
    color: theme.palette.grey[600],
  },
  altTerms: {
    marginTop: 8,
  },
  altTerm: {
    color: theme.palette.grey[600],
    fontSize: "0.8em",
    marginRight: 8,
  }
});

export const JargonTooltip = ({term, definitionHTML, altTerms, humansAndOrAIEdited, replacedSubstrings, isFirstOccurrence = false, placement="top-start", children, classes, clickable=true, tooltipClassName}: {
  term: string,
  definitionHTML: string,
  altTerms: string[],
  humansAndOrAIEdited: JargonTermsDefaultFragment['humansAndOrAIEdited'],
  replacedSubstrings: ContentReplacedSubstringComponentInfo[],
  isFirstOccurrence?: boolean,
  placement?: PopperPlacementType
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  clickable?: boolean,
  tooltipClassName?: string,
}) => {
  const { LWTooltip, ContentItemBody } = Components;
  const replacedSubstringsWithoutTermOrAltTerms = replacedSubstrings.filter(s => s.replacedString !== term && !altTerms.includes(term));
  /*const replacedSubstringsWithoutTermOrAltTerms = Object.fromEntries(
    Object.entries(replacedSubstrings).filter(([key]) => key !== term && !altTerms.includes(key))
  );*/
  const tooltip = <Card className={classes.card}>
    <ContentItemBody
      dangerouslySetInnerHTML={{ __html: definitionHTML }}
      replacedSubstrings={replacedSubstringsWithoutTermOrAltTerms}
    />
    <div className={classes.altTerms}>
      {altTerms.map((term: string) => (
        <span className={classes.altTerm} key={term}>{term}</span>
      ))}
      {humansAndOrAIEdited && <span>{humansAndOrAIEdited}</span>}
    </div>
  </Card>

  return <LWTooltip title={tooltip} tooltip={false} placement={placement} clickable={clickable} className={tooltipClassName}>
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

function convertGlossaryItemToTextReplacement(glossaryItem: JargonTermsPost, replacementMode: ContentReplacementMode): ContentReplacedSubstringComponentInfo {
  return {
    replacedString: glossaryItem.term,
    componentName: "JargonTooltip",
    replace: replacementMode,
    caseInsensitive: true,
    props: {
      term: glossaryItem.term,
      definitionHTML: glossaryItem.contents?.html ?? '',
      altTerms: glossaryItem.altTerms,
      humansAndOrAIEdited: glossaryItem.humansAndOrAIEdited,
    },
  };
}

export function jargonTermsToTextReplacements(terms: JargonTermsPost[], replacementMode: ContentReplacementMode): ContentReplacedSubstringComponentInfo[] {
  return terms
    .flatMap((glossaryItem) => expandJargonAltTerms(glossaryItem))
    .map((glossaryItem) => convertGlossaryItemToTextReplacement(glossaryItem, replacementMode));
}

const JargonTooltipComponent = registerComponent('JargonTooltip', JargonTooltip, {styles});

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltipComponent
  }
}
