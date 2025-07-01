import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection, { SECTION_WIDTH } from '../common/SingleColumnSection';
import { cloudinaryCloudNameSetting, eventBannerDesktopImageSetting, eventBannerLinkSetting, eventBannerMobileImageSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';

const bannerHeight = 250
const container = cloudinaryCloudNameSetting.get()

const styles = (theme: ThemeType) => ({
  link: {
    '&:hover': {
      opacity: 'unset'
    }
  },
  image: {
    height: bannerHeight,
    width: '100%',
    objectFit: 'cover',
    [theme.breakpoints.down('md')]: {
      width: 'calc(100% + 16px)',
      marginRight: -8,
      marginLeft: -8,
    },
  }
});

const EventBanner = ({ classes }: {
  classes: ClassesType<typeof styles>;
}) => {
  const mobileImageId = eventBannerMobileImageSetting.get()
  const desktopImageId = eventBannerDesktopImageSetting.get()
  const featuredPost = eventBannerLinkSetting.get()

  const mobileImage = `https://res.cloudinary.com/${container}/image/upload/w_${SECTION_WIDTH*2},h_${bannerHeight*2}/${mobileImageId}`
  const desktopImage = `https://res.cloudinary.com/${container}/image/upload/w_${SECTION_WIDTH*2},h_${bannerHeight*2}/${desktopImageId}`
  
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

export default registerComponent(
  'EventBanner', EventBanner, {styles},
);


