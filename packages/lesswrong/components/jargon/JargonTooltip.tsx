// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import Card from '@material-ui/core/Card';
import { commentBodyStyles } from '@/themes/stylePiping';
import { ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';
import { PopperPlacementType } from '@material-ui/core/Popper';

const styles = (theme: ThemeType) => ({
  card: {
    padding: 16,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    maxWidth: "350px",
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

export const JargonTooltip = ({classes, children, term, replacedSubstrings, isFirstOccurrence = false, placement="bottom-start"}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode,
  term: string,
  replacedSubstrings: Record<string, ContentReplacedSubstringComponentInfo>,
  isFirstOccurrence?: boolean,
  placement?: PopperPlacementType
}) => {
  const { LWTooltip, ContentItemBody } = Components;
  const termInfo = replacedSubstrings[term];
  const glossaryWithoutTermOrAltTerms = Object.fromEntries(
    Object.entries(replacedSubstrings).filter(([key]) => key !== term && !termInfo.props.altTerms.includes(key))
  );
  const tooltip = <Card className={classes.card}>
    <ContentItemBody dangerouslySetInnerHTML={{ __html: termInfo.props.contents.html }} glossary={glossaryWithoutTermOrAltTerms} />
    <div className={classes.altTerms}>
      {termInfo.props.altTerms.map((term: string) => (
        <span className={classes.altTerm} key={term}>{term}</span>
      ))}
    </div>
  </Card>  
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <LWTooltip title={tooltip} tooltip={false} placement={placement} clickable={true}>
    <span className={ isFirstOccurrence ? classes.jargonWord : undefined}>
      {children}
    </span>
  </LWTooltip>;
}

const JargonTooltipComponent = registerComponent('JargonTooltip', JargonTooltip, {styles});

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltipComponent
  }
}
