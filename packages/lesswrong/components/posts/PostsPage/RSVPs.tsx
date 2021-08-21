import { gql, useMutation } from '@apollo/client';
import React, { useCallback, useEffect } from 'react';
import { RSVPType } from '../../../lib/collections/posts/schema';
import { useLocation } from '../../../lib/routeUtil';
import { Components, getFragment, registerComponent } from '../../../lib/vulcan-lib';
import { useDialog } from '../../common/withDialog';

const styles = (theme: ThemeType): JssStyles => ({
});

const RSVPs = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
}) => {
  const { openDialog } = useDialog();
  const { query } = useLocation();
  const openRSVPForm = useCallback(() => {
    openDialog({
      componentName: "RSVPForm",
      componentProps: { post }
    })
  }, [post])
  useEffect(() => {
    if(query.rsvpDialog) {
      openRSVPForm()
    }
  })
  return <p>
    <b>RSVPs:</b>
    {post.isEvent && post.rsvps?.length > 0 && <span>
      {post.rsvps.map((rsvp:RSVPType) => <span>
        {rsvp.name} ({rsvp.response})
      </span>)}
    </span>}
    <button onClick={openRSVPForm}>RSVP</button>
  </p>;
}

const RSVPsComponent = registerComponent('RSVPs', RSVPs, {styles});

declare global {
  interface ComponentTypes {
    RSVPs: typeof RSVPsComponent
  }
}
