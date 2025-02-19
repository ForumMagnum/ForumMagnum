import React from 'react';
import moment from 'moment';
import { Link } from '../../lib/reactRouterWrapper';
import without from 'lodash/without';

const parseImageUrl = (value: string) => {
  const isImage = ['.png', '.jpg', '.gif'].indexOf(value.substr(-4)) !== -1 || ['.webp', '.jpeg'].indexOf(value.substr(-5)) !== -1;
  return isImage ?
    <img style={{ width: '100%', minWidth: 80, maxWidth: 200, display: 'block' }} src={value} alt={value} /> :
    parseUrl(value);
};

const parseUrl = (value: string) => {
  return value.slice(0,4) === 'http'
    ? <a href={value} target="_blank" rel="noopener noreferrer">
        <LimitedString string={value}/>
      </a>
    : <LimitedString string={value}/>;
};

const LimitedString = ({ string }: { string: string }) =>
  <div>
    {string.indexOf(' ') === -1 && string.length > 30 ?
      <span title={string}>{string.substr(0, 30)}…</span> :
      <span>{(string)}</span>
    }
  </div>;

export const getFieldValue = (value?: any, typeName?: any) => {

  if (typeof value === 'undefined' || value === null) {
    return '';
  }

  // JSX element
  if (React.isValidElement(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    typeName = 'Array';
  }

  if (typeof typeName === 'undefined') {
    typeName = typeof value;
  }

  switch (typeName) {

    case 'Boolean':
    case 'boolean':
    case 'Number':
    case 'number':
    case 'SimpleSchema.Integer':
      return <code>{value.toString()}</code>;

    case 'Array':
      return <ol>{value.map((item: AnyBecauseTodo, index: number) => <li key={index}>{getFieldValue(item, typeof item)}</li>)}</ol>;

    case 'Object':
    case 'object':
      return getObject(value);

    case 'Date':
      return moment(new Date(value)).format('dddd, MMMM Do YYYY, h:mm:ss');

    case 'String':
    case 'string':
      return parseImageUrl(value);

    default:
      return value.toString();
  }
};

const getObject = (object: any) => {

  if (object.__typename === 'User') {

    const user = object;

    return (
      <div className="dashboard-user" style={{ whiteSpace: 'nowrap' }}>
        <Link to={user.pageUrl}>{user.displayName}</Link>
      </div>
    );

  } else {

    return (
      <table className="table table-bordered">
        <tbody>
          {without(Object.keys(object), '__typename').map(key =>
            <tr key={key}>
              <td><strong>{key}</strong></td>
              <td>{getFieldValue(object[key], typeof object[key])}</td>
            </tr>
          )}
        </tbody>
      </table>
    );

  }
};
