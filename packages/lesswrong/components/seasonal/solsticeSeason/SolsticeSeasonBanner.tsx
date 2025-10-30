import React, { useState, useMemo, useCallback } from 'react';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { JssStyles } from '@/lib/jssStyles';
import { Link } from '@/lib/reactRouterWrapper';
import classNames from 'classnames';
import SolsticeGlobe, { SolsticeGlobePoint } from './SolsticeGlobe';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import GroupLinks from '../../localGroups/GroupLinks';
import ContentStyles from '../../common/ContentStyles'; 

const smallBreakpoint = 1525

function getCarouselSections(classes: JssStyles) {
  return [
    {
      minorTitle: "Solstice",
      subtitle: <div>
        <div>Celebrate the solstice with events around the world. Join communities marking the longest or shortest day of the year.</div>
        <Link to={`/newPost?eventForm=true&SOLSTICE=true`} target="_blank" rel="noopener noreferrer" className={classes.createEventButton}>
          <span className={classes.createEventButtonIcon}>+</span> CREATE SOLSTICE EVENT</Link>
      </div>,
      buttonText: "Solstice",
      shortButtonText: "Solstice"
    }
  ]
}

const styles = defineStyles("SolsticeSeasonBanner", (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    background: "black",
    top: 0,
    right: 0,
    width: '50vw',
    height: '100vh',
    [theme.breakpoints.down(1425)]: {
      display: 'none',
    },
  },
  title: {
    fontSize: 45,
    fontWeight: 500,
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontVariant: 'small-caps',
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 0,
    lineHeight: 1.2,
  },
  minorTitle: {
    fontSize: 38,
    fontWeight: 500,
    [theme.breakpoints.down(smallBreakpoint)]: {
      fontSize: 34,
    },
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontVariant: 'small-caps',
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 0,
    lineHeight: 1.2,
  },
  textContainer: {
    width: 320,
    marginRight: 20,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 370,
      marginRight: 0,
    },
    zIndex: 4,
    lineHeight: 1.5,
    transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    transform: 'translateX(0)',
    opacity: 1,
    marginBottom: 14,
    '&.transitioning': {
      transform: 'translateX(-100%)',
      opacity: 0,
    },
    '& a': {
      color: theme.palette.link.color,
    },
  },
  subtitle: {
    fontSize: 15,
    height: 90,
    [theme.breakpoints.up(smallBreakpoint)]: {
      fontSize: 18,
      height: 120,
    },
    '& a': {
      color: theme.dark ? theme.palette.primary.light : theme.palette.primary.main,
    },
    fontWeight: 500,
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textShadow: `0 0 5px light-dark(${theme.palette.background.default}, transparent), 0 0 10px light-dark(${theme.palette.background.default}, transparent), 0 0 15px light-dark(${theme.palette.background.default}, transparent)`,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.text.primary,
    transition: 'opacity 0.3s ease-out',
    '& li': {
      marginLeft: -10
    },
    '& ul': {
      margin: 0,
    },
  },
  meetupTypes: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 320,
    marginRight: 20,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 370,
      marginRight: 0,
    },
    gap: 8,
    paddingTop: 10,
  },
  meetupType: {
    background: theme.palette.grey[400],
    color: theme.palette.text.alwaysWhite,
    borderRadius: 4,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 7,
    paddingBottom: 7,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 400,
    '&:hover': {
      opacity: 0.5
    },
    fontFamily: theme.typography.body2.fontFamily,
    transition: 'opacity 0.1s ease-out',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    '& a': {
      textDecoration: 'underline',
    },
    '& a:hover': {
      textDecoration: 'none',
    },
  },
  activeMeetupType: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  activeAcxMeetupType: {
    background: theme.palette.meetupMonth.acx,
    color: theme.palette.text.alwaysWhite,
  },
  activeIfanyoneMeetupType: {
    background: theme.palette.meetupMonth.ifanyone,
    color: theme.palette.text.alwaysWhite,
  },
  activePetrovMeetupType: {
    background: theme.palette.meetupMonth.petrov,
    color: theme.palette.grey[100],
  },
  date: {
    fontSize: 16,
    fontWeight: 400,
    color: theme.palette.text.primary,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 10,
    opacity: 0.8,
  },
  globeGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    background: `radial-gradient(ellipse at top, transparent 30%, ${theme.palette.background.default} 100%)`,
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-out',
  },
  globeGradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(to left, transparent 0%, ${theme.palette.background.default} 100%)`,
    [theme.breakpoints.up(1620)]: {
      background: `linear-gradient(to left, transparent 0%, ${theme.palette.background.default} 100%)`,
    },
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-out',
  },
  globeContainer: {
    position: 'absolute',
    top: -80,
    right: 0,
    width: '80%',
    height: '100vh',
    transition: 'opacity 0.3s ease-out',
    zIndex: 2,
  },
  scrollBackground: {
    position: 'absolute',
    top: -80,
    right: 0,
    width: '80%',
    height: '80%',
    background: theme.dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  contentContainer: {
    width: 'calc(100% - 400px)',
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 'calc(100% - 300px)',
    },
    paddingTop: 120,
    paddingBottom: 80,
    position: 'absolute',
    zIndex: 1,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  carouselSection: {
    position: 'absolute',
    bottom: 0,
    display: 'block',
    opacity: 1,
    transition: 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out',
    transform: 'translateX(0)',
  },
  createEventButton: {
    ...theme.typography.commentStyle,
    color: theme.dark ? theme.palette.primary.light : theme.palette.primary.main,
    paddingTop: 10,
    fontSize: 15,
    display: 'inline-block',
    cursor: 'pointer',
    border: 'none',
  },
  createEventButtonIcon: {
    fontSize: 16,
    fontWeight: 900,
    marginRight: 8,
    marginLeft: 8,
  },
  buttonText: {
    display: 'inline-block',
    [theme.breakpoints.down(smallBreakpoint)]: {
      display: 'none',
    },
  },
  shortButtonText: {
    display: 'none',
    [theme.breakpoints.down(smallBreakpoint)]: {
      display: 'inline-block',
    },
  },
  popupContainer: {
    position: 'fixed',
    zIndex: 1000,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    width: 250,
    maxHeight: 400,
    overflowY: 'auto',
    boxShadow: theme.palette.boxShadowColor(0.3),
    padding: 16,
  },
  popupLoading: {
    padding: 10,
    width: 250,
    height: 250,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    fontSize: "15px",
    marginTop: "3.5px",
    marginBottom: "0px",
    marginRight: 10,
    color: theme.palette.text.primary,
  },
  popupBody: {
    marginTop: 10,
    marginBottom: 10,
    maxHeight: 150,
    overflowY: 'auto',
    wordBreak: 'break-word',
    '&::-webkit-scrollbar': {
      width: '2px'
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.grey[400],
      borderRadius: '2px',
      '&:hover': {
        background: theme.palette.grey[600]
      }
    },
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.palette.grey[400]} transparent`
  },
  popupContactInfo: {
    marginBottom: "10px",
    marginTop: "10px",
    fontWeight: theme.isEAForum ? 450 : 400,
    color: theme.palette.text.dim60,
  },
  popupLink: {
    fontWeight: theme.isEAForum ? 450 : 400,
    color: theme.palette.link.dim3,
    flex: 'none'
  },
  popupLinksWrapper: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  popupCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: theme.palette.text.dim60,
    lineHeight: 1,
    padding: 4,
    '&:hover': {
      color: theme.palette.text.primary,
    }
  },
}));


export const SolsticeSeasonQuery = gql(`
  query solsticeSeasonQuery {
    HomepageCommunityEvents(limit: 500) {
      events {
        _id
        lat
        lng
        types
      }
    }
  }
`);

export const PostsListQuery = gql(`
  query SolsticeSeasonEventPopup($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

type SolsticeGlobePopupProps = {
  eventId: string;
  screenCoords: { x: number; y: number };
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  classes: any;
};

const SolsticeGlobePopup = ({ eventId, screenCoords, onClose, classes }: SolsticeGlobePopupProps) => {
  const { loading, data } = useQuery(PostsListQuery, {
    variables: { documentId: eventId },
  });
  const document = (data as any)?.post?.result;

  if (loading) {
    return (
      <div
        className={classes.popupContainer}
        style={{
          left: `${screenCoords.x}px`,
          top: `${screenCoords.y - 15}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className={classes.popupLoading}>Loading...</div>
      </div>
    );
  }

  if (!document) return null;

  const { htmlHighlight = "" } = document.contents || {};
  const htmlBody = { __html: htmlHighlight };

  return (
    <div
      className={classes.popupContainer}
      style={{
        left: `${screenCoords.x}px`,
        top: `${screenCoords.y - 15}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <button className={classes.popupCloseButton} onClick={onClose}>
        ×
      </button>
      <Link to={postGetPageUrl(document)}>
        <h5 className={classes.popupTitle}> [Event] {document.title} </h5>
      </Link>
      <ContentStyles contentType={"comment"} className={classes.popupBody}>
        <div dangerouslySetInnerHTML={htmlBody} />
      </ContentStyles>
      {document.contactInfo && (
        <div className={classes.popupContactInfo}>{document.contactInfo}</div>
      )}
      <div className={classes.popupLinksWrapper}>
        <Link className={classes.popupLink} to={postGetPageUrl(document)}>
          Full link
        </Link>
        <div>
          <GroupLinks document={document} />
        </div>
      </div>
    </div>
  );
};

export default function SolsticeSeasonBannerInner() {
  const classes = useStyles(styles);
  const [isLoading, setIsLoading] = useState(true);
  const [everClickedGlobe, setEverClickedGlobe] = useState(false);
  const carouselSections = useMemo(() => getCarouselSections(classes), [classes]);
  
  const defaultPointOfView = useMemo(() => ({
    lat: 20,
    lng: -70,
    altitude: 2.2
  }), [])

  const { data } = useQuery(SolsticeSeasonQuery)

  type QueryResult = {
    HomepageCommunityEvents?: {
      events: Array<{
        _id: string;
        lat: number;
        lng: number;
        types: Array<string> | null;
      }>;
    };
  };
  
  const events = useMemo(() => (data as QueryResult | undefined)?.HomepageCommunityEvents?.events ?? [], [data]);

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [nextCarouselIndex, setNextCarouselIndex] = useState<number | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null)

  
  const acxCarouselIndex = 1 
  const solsticeCarouselIndex = 2 
  // const ifanyoneCarouselIndex = 2 
  // const petrovCarouselIndex = 3 
  const lwCarouselIndex = 3
  const activeIndex = nextCarouselIndex ?? currentCarouselIndex
  const filterKey = activeIndex === acxCarouselIndex ? 'SSC' : activeIndex === solsticeCarouselIndex ? 'SOLSTICE' : activeIndex === lwCarouselIndex ? 'LW' : undefined

  type EventType = typeof events[0];
  
  const filteredEvents = useMemo(() => {
    if (filterKey) {
      return events.filter((event: EventType) => (event.types ?? []).includes(filterKey));
    }
    return events;
  }, [filterKey, events]);

  const pointsData = useMemo(() => {
    return filteredEvents
      .filter((event: EventType) => event.lat != null && event.lng != null)
      .map((event: EventType) => ({
        lat: event.lat!,
        lng: event.lng!,
        size: 0.5,
        color: filterKey === 'SSC' ? '#ff6b6b' : filterKey === 'SOLSTICE' ? '#c7ceea' : filterKey === 'LW' ? '#95e1d3' : '#c7ceea',
        eventId: event._id,
        event: event,
      }));
  }, [filteredEvents, filterKey]);

  const handleMeetupTypeClick = useCallback((index: number) => {
    if (index === currentCarouselIndex) return

    setIsSettingUp(true)
    setNextCarouselIndex(index)

    setTimeout(() => {
      setIsSettingUp(false)
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentCarouselIndex(index)
        setNextCarouselIndex(null)
      }, 300)
    }, 10)
  }, [currentCarouselIndex])

  if (isLoading) {
    return <div className={classes.root}>
      <div className={classes.globeGradient} />
      <div className={classes.globeGradientRight} />
      <div className={classes.scrollBackground} />
      <div 
        className={classes.globeContainer} 
        onClick={() => setEverClickedGlobe(true)}
        style={{ opacity: 0 }}
      >
        <SolsticeGlobe 
          pointsData={pointsData}
          defaultPointOfView={defaultPointOfView}
          onPointClick={(point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => {
            if (point.eventId) {
              setSelectedEventId(point.eventId);
              setPopupCoords(screenCoords);
            }
          }}
          onReady={() => setIsLoading(false)}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>;
  }

  return <div className={classNames(classes.root)}>
    <div className={classes.globeGradient}/>
    <div className={classes.globeGradientRight} />
    <div className={classes.scrollBackground} />
    <div 
      className={classes.globeContainer} 
      onClick={() => setEverClickedGlobe(true)}
    >
      <SolsticeGlobe 
        pointsData={pointsData}
        defaultPointOfView={defaultPointOfView}
        onPointClick={(point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => {
          if (point.eventId) {
            setSelectedEventId(point.eventId);
            setPopupCoords(screenCoords);
          }
        }}
        style={{ width: '100%', height: '100%' }}
        onClick={() => setEverClickedGlobe(true)}
      />
      {selectedEventId && popupCoords && (
        <SolsticeGlobePopup
          eventId={selectedEventId}
          screenCoords={popupCoords}
          onClose={() => {
            setSelectedEventId(null);
            setPopupCoords(null);
          }}
          classes={classes}
        />
      )}
      <div className={classes.contentContainer}>
        <div className={classes.textContainer} onClick={() => setEverClickedGlobe(true)}>
          {carouselSections.map((section, index) => {
            
            const aboutToTransition = isSettingUp && index === nextCarouselIndex
            const isTransitioningOut = (!isSettingUp && isTransitioning && index === currentCarouselIndex)
            const isTransitioningIn = (!isSettingUp && isTransitioning && index === nextCarouselIndex)
            
            let translateX = '0'
            if (isTransitioningOut) {
              translateX = '-100%'
            } else if (aboutToTransition) {
              translateX = '100%'
            } else if (isTransitioningIn) {
              translateX = '0'
            }

            const shouldRender = index === currentCarouselIndex || index === nextCarouselIndex
            
            const opacity = (aboutToTransition || isTransitioningOut) ? 0 : 1;

            return <div key={index} className={classes.carouselSection} style={{
              display: shouldRender ? 'block' : 'none',
              opacity,
              transition: !isSettingUp ? 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out' : 'none',
              transform: `translateX(${translateX})`,
            }}>
              {section.minorTitle && <h3 className={classes.minorTitle}>{section.minorTitle}</h3>}
              {section.subtitle && <div className={classes.subtitle}>{section.subtitle}</div>}
            </div>
          })}
        </div>
      </div>
    </div>
  </div>;
}

export const SolsticeSeasonBanner = () => {
  return <SuspenseWrapper name="SolsticeSeasonBanner">
    <SolsticeSeasonBannerInner />
  </SuspenseWrapper>
}
