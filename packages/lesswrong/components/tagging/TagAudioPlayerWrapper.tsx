import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { isTagAllowedType3Audio } from '../../lib/collections/tags/helpers';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

const styles = defineStyles("TagAudioPlayerWrapper", (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
}));

export const TagAudioPlayerWrapper = ({tag, showEmbeddedPlayer}: {
  tag: TagPageFragment,
  showEmbeddedPlayer: boolean,
}) => {
  const { T3AudioPlayer } = Components;
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

const TagAudioPlayerWrapperComponent = registerComponent('TagAudioPlayerWrapper', TagAudioPlayerWrapper);

declare global {
  interface ComponentTypes {
    TagAudioPlayerWrapper: typeof TagAudioPlayerWrapperComponent
  }
} 
