import React from 'react'
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useSingle } from '../../lib/crud/withSingle';
import { useMessages } from '../common/withMessages';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { SECTION_WIDTH, SingleColumnSection } from '../common/SingleColumnSection';
import { PublicInstanceSetting } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_HANDBOOK_COOKIE } from '../../lib/cookies/cookies';
import { CloudinaryImage2 } from "../common/CloudinaryImage2";
import { Loading } from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";

const bannerHeight = 250

const styles = (theme: ThemeType) => ({
  bannerContainer: {
    position: 'absolute',
    top: 130, // desktop header height + layout margin + negative margin
    width: SECTION_WIDTH,
    '@media (max-width: 959.95px) and (min-width: 600px)': {
      top: 86, // tablet header height
    },
    [`@media (max-width: ${SECTION_WIDTH-1}px)`]: {
      right: 0,
      width: '100vw',
    },
    [theme.breakpoints.down('xs')]: {
      top: 77, // mobile header height
    },
    height: bannerHeight,
    overflow: 'hidden',
  },
  bannerImgWrapper: {
    position: 'absolute',
    transform: 'scale(1.1)',
    filter: 'blur(4px)',
    width: '100%',
    '& img': {
      marginLeft: '50%',
      transform: 'translateX(-50%)',
    },
  },
  bannerOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: theme.palette.primary.main,
    opacity: .5,
  },
  overImage: {
    position: 'relative',
    [theme.breakpoints.up('md')]: {
      marginTop: -10
    },
    [theme.breakpoints.down('sm')]: {
      marginTop: -36, // mobile/tablet header height
    },
    minHeight: bannerHeight,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  overImageText: {
    margin: 0,
    textAlign: 'center',
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.text.alwaysWhite,
    '& a:hover': {
      // Don't change opacity on hover
      opacity: 1,
    },
  },
  title: {
    width: 300,
    fontStyle: "italic",
  },
  divider: {
    width: 70,
    marginTop: 10,
    marginBottom: 10,
    borderBottom: `solid 1px ${theme.palette.text.alwaysWhite}`,
  },
  description: {
    width: 200,
    fontSize: 17,
  },
  ctaButton: {
    marginTop: 26,
    ...theme.typography.display1,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 17,
    fontStyle: "italic",
    color: theme.palette.text.alwaysWhite,
    textTransform: 'none',
  },
  dismiss: {
    // hack
    position: 'relative',
    marginTop: -20,
    [`@media (min-width: ${SECTION_WIDTH-1}px)`]: {
      marginRight: 4,
    },
    fontFamily: theme.typography.uiSecondary.fontFamily,
    fontSize: 14,
    textAlign: 'right',
    color: theme.palette.grey.A400,
    zIndex: 1,
  },
});

const END_OF_TIME = new Date('2038-01-18')
const eaHomeSequenceFirstPostId = new PublicInstanceSetting<string | null>('eaHomeSequenceFirstPostId', null, "optional") // Post ID for the first post in the EAHomeHandbook Sequence

const EAHomeHandbookInner = ({ classes, documentId }: {
  classes: ClassesType<typeof styles>;
  documentId: string;
}) => {
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
  });
  const { flash } = useMessages();
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_HANDBOOK_COOKIE]);
  const hideHandbook = cookies[HIDE_HANDBOOK_COOKIE]
  if (hideHandbook) return null
  if (loading || !document) return <Loading />


  const handleDismiss = () => {
    setCookie(HIDE_HANDBOOK_COOKIE, 'true', {
      expires: END_OF_TIME
    })
    flash({
      messageString: "We won't show this again. If you want to read the this in the future, you can access it from the sidebar menu." // TODO: s/this/something/
    })
  }

  return <React.Fragment>
    <SingleColumnSection>
      <div className={classes.bannerContainer}>
        <div className={classes.bannerImgWrapper}>
          <CloudinaryImage2
            publicId={document.bannerImageId ?? ''}
            height={bannerHeight}
            width={SECTION_WIDTH}
            objectFit='cover'
          />
        </div>
        <div className={classes.bannerOverlay} />
      </div>
      <div className={classes.overImage}>
        <Typography variant='display1' className={classNames(classes.overImageText, classes.title)}>
          <Link to={`/s/${document._id}`}>{document.title}</Link>
        </Typography>
        <div className={classes.divider} />
        {document.user && <Typography variant='display1' className={classNames(classes.overImageText, classes.description)}>
          Intro Sequence by{' '}
          <Link to={`/users/${document.user.slug}`}>{document.user.displayName}</Link>
        </Typography>}
        <Button
          variant='contained'
          color='primary'
          className={classes.ctaButton}
          href={`/posts/${eaHomeSequenceFirstPostId.get()}`} // TODO: slug
        >
          Start Reading
        </Button>
      </div>
      <div className={classes.dismiss}>
        <a onClick={handleDismiss}>Don't show this</a>
      </div>
    </SingleColumnSection>
  </React.Fragment>
}

export const EAHomeHandbook = registerComponent(
  'EAHomeHandbook', EAHomeHandbookInner, {styles},
)

declare global {
  interface ComponentTypes {
    EAHomeHandbook: typeof EAHomeHandbook
  }
}
