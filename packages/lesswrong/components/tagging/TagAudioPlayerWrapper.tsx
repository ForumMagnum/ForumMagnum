import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { isTagAllowedType3Audio } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
});

export const TagAudioPlayerWrapper = ({tag, showEmbeddedPlayer, classes}: {
  tag: TagPageFragment,
  showEmbeddedPlayer: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { T3AudioPlayer } = Components;

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

const TagAudioPlayerWrapperComponent = registerComponent('TagAudioPlayerWrapper', TagAudioPlayerWrapper, {styles});

declare global {
  interface ComponentTypes {
    TagAudioPlayerWrapper: typeof TagAudioPlayerWrapperComponent
  }
} 