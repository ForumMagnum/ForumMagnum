import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from '../../lib/analyticsEvents';

const UltraFeedSettingsDialog = ({ open, onClose }: {
  open: boolean;
  onClose: () => void;
}) => {
  const { captureEvent } = useTracking();
  const { LWDialog, UltraFeedSettings } = Components;
  
  // Track dialog open/close events
  React.useEffect(() => {
    if (open) {
      captureEvent('ultraFeedSettingsOpened');
    }
  }, [open, captureEvent]);
  
  const handleClose = () => {
    captureEvent('ultraFeedSettingsClosed');
    onClose();
  };
  
  return (
    <LWDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <UltraFeedSettings onClose={handleClose} />
    </LWDialog>
  );
};

const UltraFeedSettingsDialogComponent = registerComponent('UltraFeedSettingsDialog', UltraFeedSettingsDialog);

export default UltraFeedSettingsDialogComponent;

declare global {
  interface ComponentTypes {
    UltraFeedSettingsDialog: typeof UltraFeedSettingsDialogComponent
  }
} 