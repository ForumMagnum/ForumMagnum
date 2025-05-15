import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { gql } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery";
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
  const { data, loading } = useQuery(gql`query AdminMetadataQuery {
    AdminMetadata
  }`, { ssr: true });

  if (loading)
    return <Loading/>
  
  const adminMetadata = JSON.parse(data.AdminMetadata);
  const {serverInfo} = adminMetadata;
  
  return <ul>
    {Object.keys(serverInfo).map(key => <li key={key}>
      {key}: {typeof serverInfo[key]==="string" ? serverInfo[key] : JSON.stringify(serverInfo[key])}
    </li>)}
  </ul>
}

export default registerComponent('AdminMetadata', AdminMetadata, {styles});



