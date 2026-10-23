import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import RejectionRateLimitForm, { type RejectionRateLimitSettings } from './RejectionRateLimitForm';

// Drawn over the option checkbox's fill when it's checked
const CHECK_MARK_IMAGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 11 11'%3E%3Cpath d='M2 5.8l2.2 2.2 4.6-5' fill='none' stroke='%23fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

const styles = defineStyles('ModerationSendOptions', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    color: theme.palette.grey[900],
    cursor: 'pointer',
  },
  checkbox: {
    appearance: 'none',
    flexShrink: 0,
    width: 14,
    height: 14,
    margin: 0,
    border: `1.5px solid ${theme.palette.grey[500]}`,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.default,
    cursor: 'pointer',
    // The global input:focus reset strips borders, which would hide the box while it's focused
    '&:focus': {
      border: `1.5px solid ${theme.palette.grey[500]}`,
    },
    '&:checked': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.main,
      backgroundImage: CHECK_MARK_IMAGE,
      backgroundSize: '100% 100%',
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.light}`,
      outlineOffset: 1,
    },
  },
}));

const SendOption = ({ label, tooltip, checked, onChange }: {
  label: string,
  tooltip: string,
  checked: boolean,
  onChange: (checked: boolean) => void,
}) => {
  const classes = useStyles(styles);
  return <LWTooltip title={tooltip} placement="top-start">
    <label className={classes.option}>
      <input type="checkbox" className={classes.checkbox} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  </LWTooltip>;
};

/**
 * The extra actions a rejection or a moderator message can carry out once
 * it's sent: rate limiting the user, disabling their permissions, and
 * rejecting their other pending content.
 */
const ModerationSendOptions = ({
  rateLimitEnabled,
  rateLimitSettings,
  onRateLimitChange,
  showDisablePermissions,
  disablePermissions,
  onDisablePermissionsChange,
  rejectAll,
  rejectAllLabel,
  rejectAllTooltip,
  onRejectAllChange,
}: {
  rateLimitEnabled: boolean,
  rateLimitSettings: RejectionRateLimitSettings,
  onRateLimitChange: (enabled: boolean, settings: RejectionRateLimitSettings) => void,
  // Hidden when the user's permissions are already all disabled
  showDisablePermissions: boolean,
  disablePermissions: boolean,
  onDisablePermissionsChange: (checked: boolean) => void,
  rejectAll: boolean,
  rejectAllLabel: string,
  rejectAllTooltip: string,
  onRejectAllChange: (checked: boolean) => void,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root}>
    <SendOption
      label="Rate limit"
      tooltip="Set a post/comment limit that lifts after good karma"
      checked={rateLimitEnabled}
      onChange={(checked) => onRateLimitChange(checked, rateLimitSettings)}
    />
    {rateLimitEnabled && <RejectionRateLimitForm settings={rateLimitSettings} onChange={(settings) => onRateLimitChange(true, settings)} />}
    {showDisablePermissions && <SendOption
      label="Disable permissions"
      tooltip="Turn off posting, commenting, messaging and voting"
      checked={disablePermissions}
      onChange={onDisablePermissionsChange}
    />}
    <SendOption
      label={rejectAllLabel}
      tooltip={rejectAllTooltip}
      checked={rejectAll}
      onChange={onRejectAllChange}
    />
  </div>;
};

export default ModerationSendOptions;
