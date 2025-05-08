import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isTagAllowedType3Audio } from '../../lib/collections/tags/helpers';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';
import { T3AudioPlayer } from "../posts/PostsPage/T3AudioPlayer";

const styles = defineStyles("TagAudioPlayerWrapper", (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
}));

export const TagAudioPlayerWrapperInner = ({tag, showEmbeddedPlayer}: {
  tag: TagPageFragment,
  showEmbeddedPlayer: boolean,
}) => {
  const classes = useStyles(styles);

  return (
    <>
      {isTagAllowedType3Audio(tag) && 
        <T3AudioPlayer 
          showEmbeddedPlayer={!!showEmbeddedPlayer} 
          documentId={tag._id}
          collectionName="Tags"
        />}
    </>
  );
}

export const TagAudioPlayerWrapper = registerComponent('TagAudioPlayerWrapper', TagAudioPlayerWrapperInner);

declare global {
  interface ComponentTypes {
    TagAudioPlayerWrapper: typeof TagAudioPlayerWrapper
  }
} 
