// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib';
import { useTracking } from '@/lib/analyticsEvents';
import { Components } from '@/lib/vulcan-lib';
import { hour } from 'later';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const PetrovWarningConsole = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { SingleColumnSection } = Components;
  return <SingleColumnSection>

  </SingleColumnSection>
}

const PetrovWarningConsoleComponent = registerComponent('PetrovWarningConsole', PetrovWarningConsole, {styles});

declare global {
  interface ComponentTypes {
    PetrovWarningConsole: typeof PetrovWarningConsoleComponent
  }
}