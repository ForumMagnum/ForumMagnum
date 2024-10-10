import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import { commentBodyStyles } from '@/themes/stylePiping';
import { ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';
import { PopperPlacementType } from '@material-ui/core/Popper';

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

export const JargonTooltip = ({term, definitionHTML, altTerms, replacedSubstrings, isFirstOccurrence = false, placement="bottom-start", children, classes}: {
  term: string,
  definitionHTML: string,
  altTerms: string[],
  replacedSubstrings: ContentReplacedSubstringComponentInfo[],
  isFirstOccurrence?: boolean,
  placement?: PopperPlacementType
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
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
    </div>
  </Card>

  return <LWTooltip title={tooltip} tooltip={false} placement={placement} clickable={true}>
    <span className={ isFirstOccurrence ? classes.jargonWord : undefined}>
      {children}
    </span>
  </LWTooltip>;
}

export function jargonTermsToTextReplacements(terms: GlossaryTerm[]): ContentReplacedSubstringComponentInfo[] {
  return terms.map((glossaryItem: GlossaryTerm) => ({
    replacedString: glossaryItem.term,
    componentName: "JargonTooltip",
    replace: "all",
    caseInsensitive: true,
    props: {
      term: glossaryItem.term,
      definitionHTML: glossaryItem.html,
      altTerms: glossaryItem.altTerms,
    },
  }));
}

const JargonTooltipComponent = registerComponent('JargonTooltip', JargonTooltip, {styles});

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltipComponent
  }
}
