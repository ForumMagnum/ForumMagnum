import React, { useEffect } from 'react';
import { registerComponent, Components, useSingle } from 'meteor/vulcan:core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  date: {
    marginLeft: theme.spacing.unit*1.5,
    fontStyle: "italic"
  }
})

const SelectVersion = ({classes, documentId, revisionVersion, updateVersionNumber, updateVersion}) => {
  const { document, loading } = useSingle({
    collection: Posts,
    queryName: 'postsSelectVersionQuery',
    fragmentName: 'PostsRevisionEdit',
    fetchPolicy: 'cache-then-network',
    extraVariables: { version: 'String' },
    extraVariablesValues: { version: revisionVersion },
    documentId
  })

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

registerComponent("SelectVersion", SelectVersion, withStyles(styles, {name:"SelectVersion"}));
