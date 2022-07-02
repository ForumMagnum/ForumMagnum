import { Components, registerComponent } from '../../../../lib/vulcan-lib';
import React, { useState } from 'react';
import classNames from 'classnames';


const styles = (theme: ThemeType): JssStyles => ({
  section: {
    background: theme.palette.grey[0],
    padding: '24px 32px',
    marginBottom: 24
  },
  tabsRow: {
    display: 'flex',
    columnGap: 30,
    marginBottom: 24
  },
  tab: {
    display: 'inline-block',
    fontSize: 22,
    lineHeight: '32px',
    fontWeight: '700',
    paddingBottom: 3,
    borderBottom: `3px solid transparent`,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.5
    }
  },
  activeTab: {
    borderBottom: `3px solid ${theme.palette.primary.main}`,
  },
  tabRowAction: {
    flex: '1 1 0',
    textAlign: 'right'
  },

})

const EAUsersProfileTabbedSection = ({user, currentUser, tabs, classes}: {
  user: UsersProfile,
  currentUser: UsersCurrent|null,
  tabs: Array<any>,
  classes: ClassesType,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0].name)
  const ownPage = currentUser?._id === user._id

  const { Typography } = Components

  return (
    <div className={classes.section}>
      <div className={classes.tabsRow}>
        {tabs.map(tab => {
          if (tab.ownPageOnly && !ownPage) return null
          
          return <Typography
            key={tab.name}
            variant="headline"
            onClick={() => setActiveTab(tab.name)}
            className={classNames(classes.tab, {[classes.activeTab]: activeTab === tab.name})}
          >
            {tab.name}
          </Typography>
        })}
        {/* <div className={classes.tabRowAction}>
          {tab === 'posts' && <SettingsButton
            onClick={() => setShowSettings(!showSettings)}
            label={`Sorted by ${ SORT_ORDER_OPTIONS[currentSorting].label }`}
          />}
          {tab === 'drafts' && <Link to="/newPost">
            <SectionButton>
              <DescriptionIcon /> New Post
            </SectionButton>
          </Link>}
        </div> */}
      </div>
      {tabs.find((t => t.name === activeTab)).body}
    </div>
  )
}

const EAUsersProfileTabbedSectionComponent = registerComponent(
  'EAUsersProfileTabbedSection', EAUsersProfileTabbedSection, {styles}
);

declare global {
  interface ComponentTypes {
    EAUsersProfileTabbedSection: typeof EAUsersProfileTabbedSectionComponent
  }
}
