import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { SECTION_WIDTH, SingleColumnSection } from '../common/SingleColumnSection';
import { cloudinaryCloudNameSetting, DatabasePublicSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';

const eventBannerMobileImageSetting = new DatabasePublicSetting<string | null>('eventBannerMobileImage', null)
const eventBannerDesktopImageSetting = new DatabasePublicSetting<string | null>('eventBannerDesktopImage', null)
const eventBannerLinkSetting = new DatabasePublicSetting<string | null>('eventBannerLink', null)

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

const EventBannerInner = ({ classes }: {
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

export const EventBanner = registerComponent(
  'EventBanner', EventBannerInner, {styles},
)

declare global {
  interface ComponentTypes {
    EventBanner: typeof EventBanner
  }
}
