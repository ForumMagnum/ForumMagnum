import React, { useRef, useState } from 'react';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { Paper }from '@/components/widgets/Paper';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import { Badge } from "@/components/widgets/Badge";
import { useTracking, AnalyticsContext } from '../../../lib/analyticsEvents';
import classNames from 'classnames';
import { useSuspenseQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import LWClickAwayListener from "../../common/LWClickAwayListener";
import ForumIcon from "../../common/ForumIcon";
import { SuspenseWrapper } from '../../common/SuspenseWrapper';
import ErrorBoundary from '../../common/ErrorBoundary';
import { ColoredNumber } from './ColoredNumber';
import { styles } from './styles';
import { useStyles } from '../../hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';

import dynamic from 'next/dynamic';
const KarmaChangesDisplay = dynamic(() => import('./KarmaChangesDisplay'), { ssr: false });
const LWPopper = dynamic(() => import('../../common/LWPopper'), { ssr: false });

const UserKarmaChangesQuery = gql(`
  query KarmaChangeNotifier($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UserKarmaChanges
      }
    }
  }
`);

const KarmaChangeNotifierLoaded = ({className}: {
  className?: string,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser()!;
  const updateCurrentUser = useUpdateCurrentUser();
  const [cleared,setCleared] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorEl = useRef<HTMLDivElement|null>(null)
  const { captureEvent } = useTracking()
  const [karmaChangeLastOpened, setKarmaChangeLastOpened] = useState(currentUser?.karmaChangeLastOpened || new Date());
  
  const { data } = useSuspenseQuery(UserKarmaChangesQuery, {
    variables: { documentId: currentUser._id },
  });
  const document = data?.user?.result;
  
  const [stateKarmaChanges,setStateKarmaChanges] = useState(document?.karmaChanges);

  const handleOpen = () => {
    setOpen(true);
    setKarmaChangeLastOpened(new Date());
  }

  const handleClose = () => {
    setOpen(false);
    if (!currentUser) return;
    if (document?.karmaChanges) {
      void updateCurrentUser({
        ...(document.karmaChanges.endDate && { karmaChangeLastOpened: new Date(document.karmaChanges.endDate) }),
        ...(document.karmaChanges.startDate && { karmaChangeBatchStart: new Date(document.karmaChanges.startDate) })
      });

      if (document.karmaChanges.updateFrequency === "realtime") {
        setCleared(true);
      }
    }
  }

  const handleToggle = () => {
    if (open) {
      handleClose()
    } else {
      handleOpen()
    }
    captureEvent("karmaNotifierToggle", {open: !open, karmaChangeLastOpened, karmaChanges: stateKarmaChanges})
  }

  const render = () => {
    if (!document) {
      return <KarmaChangeNotifierPlaceholder/>
    }
    const karmaChanges = stateKarmaChanges || document.karmaChanges; // Covers special case when state was initialized when user wasn't logged in
    if (!karmaChanges) {
      return <KarmaChangeNotifierPlaceholder/>
    }

    const { karmaChangeNotifierSettings: settings } = currentUser
    if (settings && settings.updateFrequency === "disabled")
      return null;

    const { posts, comments, tagRevisions, endDate, totalChange } = karmaChanges
    //Check if user opened the karmaChangeNotifications for the current interval
    const newKarmaChangesSinceLastVisit = new Date(karmaChangeLastOpened || 0) < new Date(endDate || 0)
    const starIsHollow = ((!comments?.length && !posts?.length && !tagRevisions?.length) || cleared || !newKarmaChangesSinceLastVisit)
    return <AnalyticsContext pageSection="karmaChangeNotifer">
      <div className={classNames(classes.root, className)}>
        <div ref={anchorEl}>
          <IconButton onClick={handleToggle} className={classes.karmaNotifierButton}>
            {starIsHollow
              ? <ForumIcon icon="KarmaOutline" className={classes.starIcon}/>
              : <Badge badgeContent={
                  <span className={classes.pointBadge}>
                    {(!!totalChange) && <ColoredNumber n={totalChange}/>}
                  </span>}
                >
                  <ForumIcon icon="Karma" className={classes.starIcon}/>
                </Badge>
            }
          </IconButton>
        </div>
        <LWPopper
          open={open}
          anchorEl={anchorEl.current}
          placement="bottom-end"
          className={classes.karmaNotifierPopper}
        >
          <LWClickAwayListener onClickAway={handleClose}>
            <Paper className={classes.karmaNotifierPaper}>
              <KarmaChangesDisplay karmaChanges={karmaChanges} handleClose={handleClose} />
            </Paper>
          </LWClickAwayListener>
        </LWPopper>
      </div>
    </AnalyticsContext>
  }
  
  return render();
}

const KarmaChangeNotifierPlaceholder = ({className}: {
  className?: string
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, classes.placeholder, className)}>
    <IconButton className={classes.karmaNotifierButton}>
      <ForumIcon icon="KarmaOutline" className={classes.starIcon}/>
    </IconButton>
  </div>
}

export const KarmaChangeNotifier = ({className}: {
  className?: string,
}) => {
  return <SuspenseWrapper
    name="KarmaChangeNotifier"
    fallback={<KarmaChangeNotifierPlaceholder className={className}
  />}>
    <ErrorBoundary>
      <KarmaChangeNotifierLoaded className={className}/>
    </ErrorBoundary>
  </SuspenseWrapper>
}

