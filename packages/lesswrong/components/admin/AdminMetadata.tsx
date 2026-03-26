import React from 'react';
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import Loading from "../vulcan-core/Loading";

const AdminMetadata = () => {
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
    // eslint-disable-next-line no-console
    console.error(error);
  }
  
  return <ul>
    {Object.keys(serverInfo).map(key => <li key={key}>
      {key}: {typeof serverInfo[key]==="string" ? serverInfo[key] : JSON.stringify(serverInfo[key])}
    </li>)}
  </ul>
}

export default AdminMetadata;



