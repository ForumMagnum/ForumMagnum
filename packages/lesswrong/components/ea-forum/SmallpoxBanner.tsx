import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection, { SECTION_WIDTH } from '../common/SingleColumnSection';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';

const bannerHeight = 250
const mobileImageId = 'Banner/Smallpox_Eradication_Day-17.png'
const desktopImageId = 'Banner/Smallpox_Eradication_Day-16.png'
const featuredPost = '/posts/jk7A3NMdbxp65kcJJ/500-million-but-not-a-single-one-more'

const mobileImage = `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/w_${SECTION_WIDTH},h_${bannerHeight}/${mobileImageId}`
const desktopImage = `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/w_${SECTION_WIDTH},h_${bannerHeight}/${desktopImageId}`

const styles = (_theme: ThemeType) => ({
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
});

const SmallpoxBanner = ({ classes }: {
  classes: ClassesType<typeof styles>;
}) => {
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
  'SmallpoxBanner', SmallpoxBanner, {styles},
);


