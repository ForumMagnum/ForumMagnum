// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../lib/vulcan-lib';
import { useCurrentRoute } from '../lib/routeUtil';
import { useStandaloneNavigation } from '../lib/routeUtil';
import { shouldDisplayReviewVotingCanvas } from '@/lib/reviewUtils';
const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const LWBackgroundImage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { ReviewVotingCanvas, CloudinaryImage2 } = Components
  const { getReviewPhase } = require('@/lib/reviewUtils');
  const { currentRoute } = useCurrentRoute();
  const { standaloneNavigation } = useStandaloneNavigation();
  return <div className={classes.root}>
                {getReviewPhase() === 'VOTING' && currentRoute?.name === 'home' && <div className={classes.backgroundImage}>
                  <ReviewVotingCanvas />
                </div>}
                {(getReviewPhase() !== 'VOTING' || !standaloneNavigation) && <>
                  {currentRoute?.name !== 'home' && <div className={classes.imageColumn}> 
                    {/* Background image shown in the top-right corner of LW. The
                      * loading="lazy" prevents downloading the image if the
                      * screen-size is such that the image will be hidden by a
                      * breakpoint. */}
                    <CloudinaryImage2
                      loading="lazy"
                      className={classes.backgroundImage}
                      publicId="ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413"
                      darkPublicId={"ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413_copy_lnopmw"}
                      />
                  </div>}
                </>}
                
                {isLW && standaloneNavigation && <>
                  {currentRoute?.name !== 'home' && <div className={classes.imageColumn}> 
                    {/* Background image shown in the top-right corner of LW. The
                      * loading="lazy" prevents downloading the image if the
                      * screen-size is such that the image will be hidden by a
                      * breakpoint. */}
                    <CloudinaryImage2
                      loading="lazy"
                      className={classes.backgroundImage}
                      publicId="ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413"
                      darkPublicId={"ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413_copy_lnopmw"}
                    />
                  </div>}
                </>}
                {shouldDisplayReviewVotingCanvas() && currentRoute?.name === 'home' && <div className={classes.backgroundImage}>
                  <ReviewVotingCanvas />
                </div>}
  </div>;
}

const LWBackgroundImageComponent = registerComponent('LWBackgroundImage', LWBackgroundImage, {styles});

declare global {
  interface ComponentTypes {
    LWBackgroundImage: typeof LWBackgroundImageComponent
  }
}
