import React from 'react'
import { createStyles } from '@material-ui/core/styles'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { cloudinaryCloudNameSetting, DatabasePublicSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';

// const eventBannerMobileImageSetting = new DatabasePublicSetting<string | null>('eventBannerMobileImage', null)
// const eventBannerDesktopImageSetting = new DatabasePublicSetting<string | null>('eventBannerDesktopImage', null)
// const eventBannerLinkSetting = new DatabasePublicSetting<string | null>('eventBannerLink', null)

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    padding: 20,
    width: '100%',
    objectFit: 'cover',
    ...theme.typography.display1,
    marginTop: '0.5em',
    border: theme.palette.border.commentBorder,
    borderWidth: 2,
    borderRadius: 2,
    borderColor: theme.palette.primary.main,
    background: theme.palette.background.pageActiveAreaBackground,
  }
}))

const MaintenanceBanner = ({ classes }) => {
  const currentUser = useCurrentUser()
  const { SingleColumnSection } = Components

  return <SingleColumnSection className={classes.root}>
    <div>
      The EA Forum will be undergoing scheduled maintenance at TIME on DATE, we anticipate this will take around TIME
    </div>
    {currentUser ? <Button
      type="submit"
      id="new-comment-submit"
      onClick={() => { }}
    >
      Dismiss
    </Button> : <></>}
  </SingleColumnSection>
}

const MaintenanceBannerComponent = registerComponent(
  'MaintenanceBanner', MaintenanceBanner, { styles },
)

declare global {
  interface ComponentTypes {
    MaintenanceBanner: typeof MaintenanceBannerComponent
  }
}
