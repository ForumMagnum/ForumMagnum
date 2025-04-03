// TODO: run `yarn run generate` after creating component
import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useTracking } from '@/lib/analyticsEvents';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TemplateComponent", (theme: ThemeType) => ({ 
  root: {
  }
}));

const TemplateComponent = () => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking(); // use this for non-link buttons (eventTypes should be pastTenseVerbs, e.g linkClicked)

  return (
    // <AnalyticsContext 
    // // choose one of: pageContext|pageSectionContext|pageSubSectionContext|pageElementContext|pageElementSubContext=""
    // >
      <div className={classes.root}>
      </div>
    // </AnalyticsContext>
  )
}

const TemplateComponentComponent = registerComponent('TemplateComponent', TemplateComponent);

declare global {
  interface ComponentTypes {
    TemplateComponent: typeof TemplateComponentComponent
  }
}

export default TemplateComponent;
