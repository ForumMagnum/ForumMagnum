// TODO: Import component in components.ts
import React, { useRef } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useSingle } from '@/lib/crud/withSingle';
import { useLocation } from '@/lib/routeUtil';
import { userCanDo, userOwns } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType) => ({
  title: {
    ...theme.typography.display2,
  }
});

export const ThinkSequence = ({classes, sequence}: {
  classes: ClassesType<typeof styles>,
  sequence: SequencesPageWithChaptersFragment
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const currentUser = useCurrentUser();

  const { params: {sequenceId} } = useLocation();
  const { document, loading } = useSingle({
    documentId: sequenceId,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageWithChaptersFragment',
  });

  const nextSuggestedNumberRef = useRef(1);

  const { ChaptersList, Loading, ThinkWrapper, Error404, SingleColumnSection } = Components;

  if (!document && !loading) return <ThinkWrapper>
    <Error404/>
  </ThinkWrapper>

  if (!document && loading) return <ThinkWrapper>
    <Loading />
  </ThinkWrapper>

  const canEdit = userCanDo(currentUser, 'sequences.edit.all') || (userCanDo(currentUser, 'sequences.edit.own') && userOwns(currentUser, document))
  const canCreateChapter = userCanDo(currentUser, 'chapters.new.all')
  const canEditChapter = userCanDo(currentUser, 'chapters.edit.all') || canEdit


  return <ThinkWrapper document={document}>
    {loading && <Loading />}
    <h1 className={classes.title}>{document?.title}</h1>
    <ChaptersList sequenceId={document._id} canEdit={canEditChapter} nextSuggestedNumberRef={nextSuggestedNumberRef} />
  </ThinkWrapper>
}

const ThinkSequenceComponent = registerComponent('ThinkSequence', ThinkSequence, {styles});

declare global {
  interface ComponentTypes {
    ThinkSequence: typeof ThinkSequenceComponent
  }
}
