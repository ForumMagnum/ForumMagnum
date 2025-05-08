import React, { useRef, useState } from 'react';
import { registerComponent } from '../../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCheckMeritsCollapse } from '../../../common/useCheckMeritsCollapse';
import { Typography } from "../../../common/Typography";

const COLLAPSED_SECTION_HEIGHT = 200

export const eaUsersProfileSectionStyles = (theme: ThemeType) => ({
  background: theme.palette.grey[0],
  padding: '24px 24px',
  marginBottom: 24,
  borderRadius: theme.borderRadius.default,
  fontFamily: theme.palette.fonts.sansSerifStack,
  [theme.breakpoints.down('xs')]: {
    padding: 16,
  }
})

const styles = (theme: ThemeType) => ({
  section: {
    ...eaUsersProfileSectionStyles(theme)
  },
  tabsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 30,
    rowGap: '10px',
    marginBottom: 24,
    [theme.breakpoints.down('sm')]: {
      columnGap: 24,
    }
  },
  tab: {
    display: 'flex',
    columnGap: 10,
    fontSize: 20,
    lineHeight: '30px',
    fontWeight: '600',
    paddingBottom: 3,
    borderBottom: `3px solid transparent`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down('xs')]: {
      columnGap: 8,
      fontSize: 18,
      lineHeight: '28px',
    }
  },
  clickableTab: {
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.5
    },
  },
  activeTab: {
    borderBottom: `3px solid ${theme.palette.primary.main}`,
  },
  tabCount: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.palette.grey[600],
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    }
  },
  tabRowAction: {
    flex: '1 1 0',
    textAlign: 'right'
  },
  collapsableTabBody: {
    position: 'relative'
  },
  collapsedTabBody: {
    height: COLLAPSED_SECTION_HEIGHT,
    overflow: 'hidden',
    '&::after': {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: 50,
      content: "''",
      background: `linear-gradient(to top, ${theme.palette.grey[0]}, transparent)`,
    }
  },
  toggleCollapsedBtn: {
    marginTop: 20
  }
})

export type UserProfileTabType = {
  id: string,
  label: string,
  count?: number,
  secondaryNode?: React.ReactNode,
  body: React.ReactNode,
  collapsable?: boolean
}

const EAUsersProfileTabbedSectionInner = ({tabs, id, classes}: {
  tabs: Array<UserProfileTabType>,
  id?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [activeTab, setActiveTab] = useState(tabs.length ? tabs[0] : null)
  
  // handle the case when we want a collapsable tab body
  const bodyRef = useRef<HTMLDivElement>(null)
  // this tracks whether the tab body is collapsed or expanded
  const [collapsed, setCollapsed] = useState(true)
  
  const meritsCollapse = useCheckMeritsCollapse({
    ref: bodyRef,
    height: COLLAPSED_SECTION_HEIGHT,
    deps: [activeTab]
  })
  if (!activeTab) return null
  
  let tabBody = activeTab.body
  if (activeTab.collapsable) {
    tabBody = <>
      <div className={classNames(classes.collapsableTabBody, {[classes.collapsedTabBody]: collapsed && meritsCollapse})} ref={bodyRef}>
        {activeTab.body}
      </div>
      {meritsCollapse && (collapsed ?
        <Button variant="outlined" color="primary" className={classes.toggleCollapsedBtn} onClick={() => setCollapsed(false)}>
          Show more
        </Button> :
        <Button variant="outlined" color="primary" className={classes.toggleCollapsedBtn} onClick={() => setCollapsed(true)}>
          Show less
        </Button>)
      }
    </>
  }
  
  const tabsAreClickable = tabs.length > 1

  return (
    <div className={classes.section} id={id}>
      <div className={classes.tabsRow}>
        {tabs.map(tab => {
          return <Typography
            key={tab.id}
            variant="headline"
            onClick={() => setActiveTab(tab)}
            className={classNames(classes.tab, {
              [classes.clickableTab]: tabsAreClickable,
              [classes.activeTab]: activeTab.id === tab.id
            })}
          >
            {tab.label}
            {!!tab.count && <div className={classes.tabCount}>{tab.count}</div>}
          </Typography>
        })}
        <div className={classes.tabRowAction}>
          {activeTab.secondaryNode}
        </div>
      </div>
      {tabBody}
    </div>
  )
}

export const EAUsersProfileTabbedSection = registerComponent(
  'EAUsersProfileTabbedSection', EAUsersProfileTabbedSectionInner, {styles}
);

declare global {
  interface ComponentTypes {
    EAUsersProfileTabbedSection: typeof EAUsersProfileTabbedSection
  }
}
