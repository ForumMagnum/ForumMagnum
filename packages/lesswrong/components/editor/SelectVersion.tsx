import React, { useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import { Posts } from '../../lib/collections/posts';

const styles = (theme: ThemeType): JssStyles => ({
  date: {
    marginLeft: theme.spacing.unit*1.5,
    fontStyle: "italic"
  }
})

const SelectVersion = ({classes, documentId, revisionVersion, updateVersionNumber, updateVersion}) => {
  const { document, loading } = useSingle({
    collection: Posts,
    fragmentName: 'PostsRevisionEdit',
    fetchPolicy: 'cache-and-network',
    extraVariables: { version: 'String' },
    extraVariablesValues: { version: revisionVersion },
    documentId
  })

  // the updateVersion function is implemented a bit weirdly.
  
  // Naively, you want for the select menu, "onChange -> change the text to the currentVersion"
  // We don't want to grab _all_ the versions on initial pageload because there might be a lot and they might be large.
  // So we only want to grab one version at a time.
  // The version needs to be grabbed via a hook. 
  // Hooks need to be run at the beginning of a component
  
  // In order to cause the hook to re-run, SelectVersion needs to send a signal back to EditorFormComponent (to update the 'version number' state, which in turn updates this component's props which causes it to re-render, this time fetching the revision corresponding to the new version number)

  // after the hook has finished grabbing the new revision, it propagates uses the useEffect trigger to propogate it back to the EditorFormComponent.

  // this all seems pretty convoluted, but Oli and I spent a few hours trying to get to get to a simpler implementation and it wasn't obvious how. Oli made some cursory attempt to implement a deferred hook in hopes that would streamline things, but says that it didn't end up helping. He had some sense that refactoring EditorFormComponent might make it easier.

  // at first I tried implementing this without the useEffect trigger, but that just resulted in the update causing the _last_ selected revision to get restored.

  useEffect(() => {
    updateVersion(document)
  }, [documentId, document, updateVersion])

  const { FormatDate, Loading } = Components
  
  if (!document?.revisions) return null
  if (loading) return <Loading />

  const tooltip = <div>
    <div>Select a past revision</div>
    <div>of this document</div>
  </div>

  return (
    <Tooltip title={tooltip} placement="left">
      <Select
        value={revisionVersion}
        onChange={(e) => updateVersionNumber(e.target.value)}
        disableUnderline
        >
          {document.revisions.map(({editedAt, version}) => 
            <MenuItem key={version} value={version}>
              <span>Version {version}</span><span className={classes.date}><FormatDate date={editedAt}/></span>
            </MenuItem>)
          }
      </Select>
    </Tooltip>
  )

}

export const SelectVersionComponent = registerComponent("SelectVersion", SelectVersion, {styles});

declare global {
  interface ComponentTypes {
    SelectVersion: typeof SelectVersionComponent
  }
}
