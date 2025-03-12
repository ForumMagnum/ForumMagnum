import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Card from '@/lib/vendor/@material-ui/core/src/Card';
import Divider from '@/lib/vendor/@material-ui/core/src/Divider';
import Tooltip from '@/lib/vendor/@material-ui/core/src/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import { useMulti } from '../../../lib/crud/withMulti';
import moment from 'moment';
import sample from 'lodash/sample';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { HIDE_FEATURED_RESOURCE_COOKIE } from '../../../lib/cookies/cookies';

const styles = (theme: ThemeType) => ({
  card: {
    margin: '1.5em 0 1em 1em',
    padding: '2em',
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: theme.borderRadius.default,
  },
  closeButton: {
    padding: '.25em',
    margin: "-1.5em -1.5em 0 0",
    minHeight: '.75em',
    minWidth: '.75em',
    alignSelf: 'end',
  },
  closeIcon: {
    width: '.6em',
    height: '.6em',
    color: theme.palette.icon.dim6,
  },
  title: {
    color: theme.palette.text.dim700,
    paddingBottom: '1em',
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
  divider: {
    width: '50%',
  },
  body: {
    color: theme.palette.text.dim700,
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.05rem',
  },
  ctaButton: {
    borderRadius: theme.borderRadius.small,
    minWidth: '50%',
    background: theme.palette.primary.main,
    color: theme.palette.buttons.featuredResourceCTAtext,
    '&:hover': {
      background: theme.palette.primary.main,
    },
  }
});

const LinkButton = ({ resource, classes }: {
  classes: ClassesType<typeof styles>,
  resource: FeaturedResourcesFragment,
}) => {
  const { captureEvent } = useTracking({eventType: "linkClicked", eventProps: {to: resource.ctaUrl}});
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    captureEvent(undefined, {buttonPressed: e.button});
  };

  return <a href={resource.ctaUrl} target="_blank" rel="noopener noreferrer">
    <Button color="primary" className={classes.ctaButton} onClick={handleClick}>
      {resource.ctaText}
    </Button>
  </a>;
};

const FeaturedResourceBanner = ({terms, classes}: {
  terms: FeaturedResourcesViewTerms,
  classes: ClassesType<typeof styles>,
}) => {
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_FEATURED_RESOURCE_COOKIE])
  const [resource, setResource] = useState<FeaturedResourcesFragment | undefined>(undefined)
  const { results, loading } = useMulti({
    terms,
    collectionName: 'FeaturedResources',
    fragmentName: 'FeaturedResourcesFragment',
    enableTotal: false,
  });
  const { Typography } = Components

  useEffect(() => {
    if (loading || !results?.length) {
      return;
    }

    setResource(sample(results));
  }, [results, loading]);

  if (cookies[HIDE_FEATURED_RESOURCE_COOKIE]) {
    return null;
  }

  const hideBanner = () => setCookie(
    HIDE_FEATURED_RESOURCE_COOKIE,
    "true", {
    expires: moment().add(30, 'days').toDate(),
  });

  if (!resource) {
    return null;
  }

  return <AnalyticsContext pageElementContext="featuredResourceLink" resourceName={resource.title} resourceUrl={resource.ctaUrl} >
      <Card className={classes.card}>
      <Tooltip title="Hide this for the next month">
        <Button className={classes.closeButton} onClick={hideBanner}>
          <CloseIcon className={classes.closeIcon} />
        </Button>
      </Tooltip>
      <Typography variant="title" className={classes.title}>
        {resource.title}
      </Typography>
      <Divider className={classes.divider} />
      <Typography variant="body2" className={classes.body}>
        {resource.body}
      </Typography>
      {resource.ctaUrl && resource.ctaText && <LinkButton resource={resource} classes={classes} />}
    </Card>
  </AnalyticsContext>
}

const FeaturedResourceBannerComponent = registerComponent(
  'FeaturedResourceBanner', FeaturedResourceBanner, { styles }
)

declare global {
  interface ComponentTypes {
    FeaturedResourceBanner: typeof FeaturedResourceBannerComponent
  }
}
