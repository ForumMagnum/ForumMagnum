import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  indexesTable: {
    border: "1px solid black",
    padding: 5,
  },
  indexRow: {
    wordWrap: "break-word",
    display: "block",
    width: 700,
    padding: 5,
  },
});


const AdminMetadata = ({ adminMetadata, adminMetadataLoading, classes }) => {
  if (adminMetadataLoading)
    return <Components.Loading/>
  
  let missingIndexes = JSON.parse(adminMetadata.missingIndexes);
  let extraIndexes = JSON.parse(adminMetadata.extraIndexes);
  
  return (<div>
    <h4>Missing Indexes</h4>
    { missingIndexes.length === 0
      ? "No missing indexes"
      : <table className={classes.indexesTable}><tbody>
          <tr>
            <td>Collection</td>
            <td>Index</td>
          </tr>
          {missingIndexes.map((missingIndex,i) => (
            <tr key={i}>
              <td>{missingIndex.collectionName}</td>
              <td className={classes.indexRow}>{JSON.stringify(missingIndex.index)}</td>
            </tr>
          ))}
        </tbody></table>
    }
    
    <h4>Extra Indexes</h4>
    { extraIndexes.length === 0
      ? "No extra indexes"
      : <table className={classes.indexesTable}><tbody>
          <tr>
            <td>Collection</td>
            <td>Index</td>
          </tr>
          {extraIndexes.map((extraIndex,i) => (
            <tr key={i}>
              <td>{extraIndex.collectionName}</td>
              <td className={classes.indexRow}>{JSON.stringify(extraIndex.index)}</td>
            </tr>
          ))}
        </tbody></table>
    }
  </div>);
}

const adminMetadataQuery = gql`query AdminMetadataQuery {
  AdminMetadata {
    extraIndexes
    missingIndexes
  }
}`;

const withAdminMetadata = component => {
  return graphql(adminMetadataQuery,
    {
      alias: "withAdminMetadata",
      props(props) {
        return {
          adminMetadataLoading: props.data.loading,
          adminMetadata: props.data.AdminMetadata,
        }
      }
    }
  )(component);
}

registerComponent('AdminMetadata', AdminMetadata, withAdminMetadata, withStyles(styles, {name: "AdminMetadata"}));
