import React from 'react'
import { createStyles } from '@material-ui/core/styles'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const bannerHeight = 250
const imageId = 'Banner/fei3plshq5ijwi1upxwq'

const styles = createStyles((theme: ThemeType): JssStyles => ({
}))

const SmallpoxBanner = ({ classes }) => {
  const { SingleColumnSection, CloudinaryImage2 } = Components

  return <SingleColumnSection>
    <CloudinaryImage2
      publicId={imageId}
      height={bannerHeight}
      width={SECTION_WIDTH}
      objectFit='cover'
    />
  </SingleColumnSection>
}

const SmallpoxBannerComponent = registerComponent(
  'SmallpoxBanner', SmallpoxBanner, {styles},
)

declare global {
  interface ComponentTypes {
    SmallpoxBanner: typeof SmallpoxBannerComponent
  }
}
