import React from 'react';
import { registerComponent, Components, useSingle } from 'meteor/vulcan:core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import { Posts } from '../../lib/collections/posts';

const SelectVersion = ({documentId, revisionVersion, onChange}) => {
  const { document, refetch, loading, error } = useSingle({
    collection: Posts,
    queryName: 'postsSelectVersionQuery',
    fragmentName: 'PostsRevision',
    fetchPolicy: 'cache-then-network',
    extraVariables: { version: 'String' },
    extraVariablesValues: { version: revisionVersion },
    documentId
  })
  console.log(error)
  console.log(documentId, revisionVersion, document?.contents)

  const { FormatDate, Loading } = Components
  
  if (!document?.revisions) return null
  if (loading) return <Loading />

  return (
    <Tooltip title="Select a past revision of this document" placement="left">
      <Select
        value={revisionVersion}
        onChange={(e) => onChange(document, e.target.value)}
        disableUnderline
        >
          {document.revisions.map(({editedAt, version}) => 
            <MenuItem key={version} value={version}>
              <span>Version {version}</span><em><FormatDate date={editedAt}/></em>
            </MenuItem>)
          }
      </Select>
    </Tooltip>
  )

}

registerComponent("SelectVersion", SelectVersion);
