import React from 'react'
import IconButton from 'material-ui/IconButton'

export const ToolbarButton = ({
  icon,
  isActive,
  onClick
}: {
  icon: string,
  isActive: string,
  onClick(): void
}) => (
  <IconButton
    onTouchTap={onClick}
    iconStyle={isActive ? { color: 'rgb(0, 188, 212)' } : { color: 'white' }}
  >
    {icon}
  </IconButton>
)
