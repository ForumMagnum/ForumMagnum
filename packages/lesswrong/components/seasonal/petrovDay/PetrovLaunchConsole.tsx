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

export const PetrovLaunchConsole = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { SingleColumnSection } = Components;
  return <SingleColumnSection>
    <div className={classes.root}>


    </div>
    
  </SingleColumnSection>
}

const PetrovLaunchConsoleComponent = registerComponent('PetrovLaunchConsole', PetrovLaunchConsole, {styles});

declare global {
  interface ComponentTypes {
    PetrovLaunchConsole: typeof PetrovLaunchConsoleComponent
  }
}


// type: "TeamA-Nuke"
// data: 

// // you have a databse setting that is safe-samples and nuke-samples
// // when petrov sees something, you randomly draw from either safe-samples or nuke-samples
// // if it's a nuke, you have to defuse it before it's too late
// // if it's a safe, you can destroy it










// Each :50, somehow we need to generate a number of nukes, 
//    – takes in whether nukes are incoming at you 