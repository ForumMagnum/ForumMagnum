import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import isEmpty from 'lodash/isEmpty';
import { defineStyles, useStyles } from '../hooks/useStyles';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { MenuItem } from "../common/Menus";
import SingleColumnSection from "../common/SingleColumnSection";
import RecentComments from "./RecentComments";
import SectionTitle from "../common/SectionTitle";
import SettingsButton from "../icons/SettingsButton";

const styles = defineStyles('AllComments', theme => ({
  settings: {
    background: theme.palette.panelBackground.default,
    padding: 16,
    marginBottom: 32,
    ...theme.typography.body2,
  },
}));


interface AllCommentsViewSettings {
  sortBy: 'new' | 'magic'
  minimumKarma: number
}

const defaultCommentsViewSettings: AllCommentsViewSettings = {
  sortBy: 'new',
  minimumKarma: 1,
}

const AllCommentsSettings = ({ expanded, settings, setSettings }: {
  expanded: boolean,
  settings: AllCommentsViewSettings
  setSettings: (newSettings: AllCommentsViewSettings) => void
}) => {
  const classes = useStyles(styles);
  if (!expanded) return null;
  return <div className={classes.settings}>
    {<div>
      Sort By: {' '}
      <Select
        value={settings.sortBy}
        onChange={ev => {
          setSettings({
            ...settings,
            sortBy: ev.target.value as 'new' | 'magic',
          });
        }}
      >
        <MenuItem value="new">Latest</MenuItem>
        <MenuItem value="magic">Magic</MenuItem>
      </Select>
    </div>}
    <div>
      Minimum Karma:{' '}
      <Input
        type='number'
        value={ settings.minimumKarma }
        onChange={ev => setSettings({...settings, minimumKarma: parseInt(ev.target.value)})}
        ></Input>
    </div>
  </div>
}


const AllComments = () => {
  const { query } = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(defaultCommentsViewSettings);

  const terms: CommentsViewTerms = isEmpty(query) ? {
    view: 'allRecentComments',
    limit: 100,
    sortBy: settings.sortBy,
    minimumKarma: settings.minimumKarma,
  } : { ...query, view: (query.view as CommentsViewName | undefined) ?? 'default' };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  }
  
  return (
    <SingleColumnSection>
      <div onClick={toggleSettings}>
        <SectionTitle title="All Comments">
          <SettingsButton label="Settings" />
        </SectionTitle>
      </div>
      <AllCommentsSettings expanded={showSettings} settings={settings} setSettings={setSettings} />
      <RecentComments terms={terms} truncated={true}/>
    </SingleColumnSection>
  )
};

export default registerComponent('AllComments', AllComments);



