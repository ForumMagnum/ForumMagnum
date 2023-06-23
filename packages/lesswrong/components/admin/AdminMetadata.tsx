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
    <h2>Server Information</h2>
    <ul>
      {Object.keys(serverInfo).map(key => <li key={key}>
        {key}: {typeof serverInfo[key]==="string" ? serverInfo[key] : JSON.stringify(serverInfo[key])}
      </li>)}
    </ul>
    
    <h2>Missing Indexes</h2>
    { missingIndexes.length === 0
      ? "No missing indexes"
      : <table className={classes.indexesTable}><tbody>
          <tr>
            <td>Collection</td>
            <td>Index</td>
          </tr>
          {missingIndexes.map((missingIndex: AnyBecauseTodo, i: number) => (
            <tr key={i}>
              <td>{missingIndex.collectionName}</td>
              <td className={classes.indexRow}>{JSON.stringify(missingIndex.index)}</td>
            </tr>
          ))}
        </tbody></table>
    }
    
    <h2>Extra Indexes</h2>
    { extraIndexes.length === 0
      ? "No extra indexes"
      : <table className={classes.indexesTable}><tbody>
          <tr>
            <td>Collection</td>
            <td>Index</td>
          </tr>
          {extraIndexes.map((extraIndex: AnyBecauseTodo, i: number) => (
            <tr key={i}>
              <td>{extraIndex.collectionName}</td>
              <td className={classes.indexRow}>{JSON.stringify(extraIndex.index)}</td>
            </tr>
          ))}
        </tbody></table>
    }
  </div>);
}

const AdminMetadataComponent = registerComponent('AdminMetadata', AdminMetadata, {styles});

declare global {
  interface ComponentTypes {
    AdminMetadata: typeof AdminMetadataComponent
  }
}

