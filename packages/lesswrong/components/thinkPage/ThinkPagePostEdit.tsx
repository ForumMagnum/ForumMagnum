// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useLocation } from '@/lib/routeUtil';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkPagePostEdit  = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { PostsEditForm, ThinkPageWrapper } = Components;

  const { params } = useLocation();
  const documentId = params.documentId;
  const version = params.version;

  return <ThinkPageWrapper>
    <PostsEditForm documentId={documentId} version={version} showTableOfContents={false}/>
  </ThinkPageWrapper>
}

const ThinkPagePostEditComponent = registerComponent('ThinkPagePostEdit', ThinkPagePostEdit, {styles});

declare global {
  interface ComponentTypes {
    ThinkPagePostEdit: typeof ThinkPagePostEditComponent
  }
}
