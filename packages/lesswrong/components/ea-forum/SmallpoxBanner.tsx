import React from 'react'
import { createStyles } from '@material-ui/core/styles'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';

const bannerHeight = 250
const mobileImageId = 'Banner/Smallpox_Eradication_Day-17.png'
const desktopImageId = 'Banner/Smallpox_Eradication_Day-16.png'
const featuredPost = '/posts/jk7A3NMdbxp65kcJJ/500-million-but-not-a-single-one-more'

const mobileImage = `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/w_${SECTION_WIDTH},h_${bannerHeight}/${mobileImageId}`
const desktopImage = `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/w_${SECTION_WIDTH},h_${bannerHeight}/${desktopImageId}`

const styles = createStyles((theme: ThemeType): JssStyles => ({
  image: {
    objectFit: 'cover'
  }
}))

const SmallpoxBanner = ({ classes }) => {
  const { SingleColumnSection } = Components
  
  return <SingleColumnSection>
    <Link to={featuredPost}>
      <picture>
        {/* 960px is the md boundary */}
        <source media="(max-width: 959px)" srcSet={mobileImage} />
        <source media="(min-width: 960px)" srcSet={desktopImage} />
        <img
          className={classes.image}
          src={desktopImage}
          height={bannerHeight}
          width='100%'
        />
      </picture>
    </Link>
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
