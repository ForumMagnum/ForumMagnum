import React, { useCallback, useState} from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {AnalyticsContext, useTracking} from '../../lib/analyticsEvents.tsx'
import classNames from 'classnames'

const styles = (theme: ThemeType) => ({
  tabsSection: {
    marginTop: 10,
    marginBottom: 26,
    [theme.breakpoints.down('sm')]: {
      marginTop: 20,
    },
  },
  tabsRow: {
    position: 'relative',
  },
  topicsBar: {
    display: 'flex',
    columnGap: 8,
  },
  tab: {
    width: '150px',
    backgroundColor: theme.palette.panelBackground.default,
    color: theme.palette.grey[500],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '23px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: 3,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[700],
    },
  },
  activeTab: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[700],
    '&:hover': {
     color: theme.palette.grey[800],
    },
  },
  tagDescriptionTooltip: {
    margin: 8,
  }
})

export interface TabRecord {
  name: string,
  label: string,
  description?: string,
  disabled?: boolean,
}

/**
 * A horizontal bar of clickable tabs as alternative to a dropdown
 */
const TabPicker = <T extends TabRecord[]>(
  {
    classes,
    sortedTabs,
    defaultTab,
    onTabSelectionUpdate,
    showDescriptionOnHover = false,
  }: {
    classes: ClassesType<typeof styles>,
    sortedTabs: T,
    defaultTab?: T[number]['name'],
    onTabSelectionUpdate: (tab: T[number]['name']) => void,
    showDescriptionOnHover?: boolean,
  },
) => {

  const [activeTab, setActiveTab] = useState<T[number]['name']>(defaultTab ?? sortedTabs[0].name)

  const { LWTooltip } = Components

  const updateActiveTab = useCallback((activeTab: T[number]['name']) => {
    setActiveTab(activeTab)
    onTabSelectionUpdate(activeTab)
  }, [onTabSelectionUpdate])

  return <div className={classes.topicsBar}>
      {sortedTabs.map(tab => {
        const isActive = tab.name === activeTab;
        return <LWTooltip
          title={showDescriptionOnHover ? tab.description : null} 
          popperClassName={classes.tagDescriptionTooltip}
          key={tab.name}
        >
          <button
            onClick={() => updateActiveTab(tab.name)}
            className={classNames(classes.tab, {
              [classes.activeTab]: isActive,
            })}
          >
            {tab.label}
          </button>
        </LWTooltip>
      })}
    </div>
}

const TabPickerComponent = registerComponent('TabPicker', TabPicker, {styles})

declare global {
  interface ComponentTypes {
    TabPicker: typeof TabPickerComponent
  }
}
