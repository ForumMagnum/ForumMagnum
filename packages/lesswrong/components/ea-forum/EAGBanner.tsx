import React from 'react'
import { createStyles } from '@material-ui/core/styles'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';

const bannerHeight = 250
const mobileImageId = 'Banner/eagr_banner.png'
const desktopImageId = 'Banner/eagr_banner.png'
const featuredPost = '/posts/XZWyp3EHo2DvmNGih/apply-now-for-ea-global-reconnect-march-20-21'
const container = cloudinaryCloudNameSetting.get()
const mobileImage = `https://res.cloudinary.com/${container}/image/upload/w_${SECTION_WIDTH},h_${bannerHeight}/${mobileImageId}`
const desktopImage = `https://res.cloudinary.com/${container}/image/upload/w_${SECTION_WIDTH},h_${bannerHeight}/${desktopImageId}`

const styles = createStyles((theme: ThemeType): JssStyles => ({
  link: {
    '&:hover': {
      opacity: 'unset'
    }
  },
  image: {
    height: bannerHeight,
    width: '100%',
    objectFit: 'cover',
  }
}))

const EAGBanner = ({ classes }) => {
  const { SingleColumnSection } = Components
  
  return <SingleColumnSection>
    <Link to={featuredPost} className={classes.link}>
      <picture>
        <source media="(max-width: 959.95px)" srcSet={mobileImage} />
        <source media="(min-width: 960px)" srcSet={desktopImage} />
        <img className={classes.image} src={desktopImage} />
      </picture>
    </Link>
  </SingleColumnSection>
}

const EAGBannerComponent = registerComponent(
  'EAGBanner', EAGBanner, {styles},
)

declare global {
  interface ComponentTypes {
    EAGBanner: typeof EAGBannerComponent
  }
}
