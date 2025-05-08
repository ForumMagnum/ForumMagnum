import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Card } from "@/components/widgets/Paper";
import { htmlToText } from 'html-to-text';
import { LWTooltip } from "../common/LWTooltip";
import { ContentStyles } from "../common/ContentStyles";
import { ContentItemBody } from "../common/ContentItemBody";
import { MetaInfo } from "../common/MetaInfo";

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 4
  },
  shortReason: {
    maxWidth: 500,
    overflow: "hidden"
  },
  reasonTooltip: {
    paddingTop: 4,
    paddingBottom: 2,
    paddingLeft: 12,
    paddingRight: 16,
    width: 400,
    fontSize: '1rem',
    marginBottom: 12
  },
});

export const RejectedReasonDisplayInner = ({classes, reason}: {
  classes: ClassesType<typeof styles>,
  reason: string|null
}) => {
  function getShortRejectedReason (reason: string|null|undefined) {
    const reasonSnippet = htmlToText(reason || "").split(".")[0]
    const bulletStrippedSnippet = reasonSnippet.includes(" * ") ? reasonSnippet.split(" * ")[1] : reasonSnippet
    if (bulletStrippedSnippet) return `Rejected for "${bulletStrippedSnippet}"`
    return "Rejected"
  }

  return <span className={classes.root}>
    <LWTooltip placement="bottom-start" tooltip={false} clickable title={<Card>
      <ContentStyles contentType='comment'>
        <ContentItemBody className={classes.reasonTooltip}
          dangerouslySetInnerHTML={{__html: reason || '<ul><li>No specific reason given</li></ul>' }}
        />
      </ContentStyles>
    </Card>}>
      <MetaInfo className={classes.shortReason}>
        {getShortRejectedReason(reason)}
      </MetaInfo>
    </LWTooltip>
  </span>;
}

export const RejectedReasonDisplay = registerComponent('RejectedReasonDisplay', RejectedReasonDisplayInner, {styles});

declare global {
  interface ComponentTypes {
    RejectedReasonDisplay: typeof RejectedReasonDisplay
  }
}

