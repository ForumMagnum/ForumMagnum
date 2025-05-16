import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen/gql';
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
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

const AdminMetadata = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { data, loading } = useQuery(gql(`
    query AdminMetadataQuery {
      AdminMetadata
    }
  `), { ssr: true });

  if (loading)
    return <Loading/>
  
  let serverInfo: Record<string, any> = {};
  try {
    serverInfo = data?.AdminMetadata ? JSON.parse(data?.AdminMetadata) : {};
  } catch (error) {
    console.error(error);
  }
  
  return <ul>
    {Object.keys(serverInfo).map(key => <li key={key}>
      {key}: {typeof serverInfo[key]==="string" ? serverInfo[key] : JSON.stringify(serverInfo[key])}
    </li>)}
  </ul>
}

export default registerComponent('AdminMetadata', AdminMetadata, {styles});



