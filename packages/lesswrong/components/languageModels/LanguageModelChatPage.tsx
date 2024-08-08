// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
  }
});

export const LanguageModelChatPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const { SingleColumnSection, LanguageModelChat } = Components;

  return <div className={classes.root}>
    <SingleColumnSection>
      <LanguageModelChat fullPage />
    </SingleColumnSection>
  </div>;
}

const LanguageModelChatPageComponent = registerComponent('LanguageModelChatPage', LanguageModelChatPage, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelChatPage: typeof LanguageModelChatPageComponent
  }
}
