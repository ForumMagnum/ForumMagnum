import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useQuery, gql } from '@apollo/client';

const styles = (theme: ThemeType): JssStyles => ({
  indexesTable: {
    border: theme.palette.border.maxIntensity,
    padding: 5,
    ...theme.typography.code,
  },
  indexRow: {
    lineBreak: "anywhere",
    display: "block",
    width: 700,
    padding: 5,
  },
});

const adminMetadataQuery = gql`query AdminMetadataQuery {
  AdminMetadata
}`;

const AdminMetadata = ({ classes }: { classes: ClassesType }) => {
  const { data, loading } = useQuery(adminMetadataQuery, { ssr: true });
  if (loading)
    return <Components.Loading/>
  
  const adminMetadata = JSON.parse(data.AdminMetadata);
  const {missingIndexes, extraIndexes, serverInfo} = adminMetadata;
  
  return (<div>
    <h3>Server Information</h3>
    <ul>
      {Object.keys(serverInfo).map(key => <li key={key}>
        {key}: {typeof serverInfo[key]==="string" ? serverInfo[key] : JSON.stringify(serverInfo[key])}
      </li>)}
    </ul>
  </div>);
}

const AdminMetadataComponent = registerComponent('AdminMetadata', AdminMetadata, {styles});

declare global {
  interface ComponentTypes {
    AdminMetadata: typeof AdminMetadataComponent
  }
}

