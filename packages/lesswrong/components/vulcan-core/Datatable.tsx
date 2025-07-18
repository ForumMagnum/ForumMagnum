import { LoadMoreCallback } from '../hooks/useQueryWithLoadMore';
import React from 'react';
import { getFieldValue } from './Card';
import _sortBy from 'lodash/sortBy';
import { formatLabel, formatMessage } from '../../lib/vulcan-i18n/provider';
import { useCurrentUser } from '../common/withUser';
import { registerComponent } from "../../lib/vulcan-lib/components";
import Loading from "./Loading";
import LoadMore from "../common/LoadMore";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

type ColumnComponent = React.ComponentType<{column: any}>

export interface Column {
  name: string;
  sortable?: false;
  label?: string;
  order?: number;
  component?: ColumnComponent;
}

const getColumnName = (column: Column) => (
  typeof column === 'string'
    ? column 
    : column.label || column.name
);

export const Datatable = <
  FragmentTypeName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString = CollectionNamesByFragmentName[FragmentTypeName]
>({columns, results, loading, loadingMore, loadMore, count, totalCount, collectionName}: {
  columns: Column[],
  results: AnyBecauseHard[],
  loading: boolean,
  loadingMore: boolean,
  loadMore: LoadMoreCallback,
  count: number,
  totalCount: number,
  collectionName: CollectionNameString,
}) => {
  return <DatatableLayout collectionName={collectionName}>
    <DatatableContents
      columns={columns}
      collectionName={collectionName}
      results={results}
      loading={loading}
      loadingMore={loadingMore}
      loadMore={loadMore}
      count={count}
      totalCount={totalCount!}
    />
  </DatatableLayout>
}

const DatatableLayout = ({ collectionName, children }: {
  collectionName: CollectionNameString;
  children: React.ReactNode;
}) => (
  <div className={`datatable datatable-${collectionName}`}>
    {children}
  </div>
);

const DatatableHeader = ({ collectionName, column }: {
  collectionName: CollectionNameString;
  column: Column;
}) => {
  const columnName = getColumnName(column);
  
  if (collectionName) {
    /*

    use either:

    1. the column name translation : collectionName.columnName, global.columnName, columnName
    2. the raw column name.

    */
    const formattedLabel = formatLabel({fieldName: columnName, collectionName});

    return <DatatableHeaderCellLayout>{formattedLabel}</DatatableHeaderCellLayout>;
  } else {
    const formattedLabel = formatMessage({ id: columnName, defaultMessage: columnName });
    return (
      <DatatableHeaderCellLayout
        className={`datatable-th-${columnName.toLowerCase().replace(/\s/g, '-')}`}
      >
        {formattedLabel}
      </DatatableHeaderCellLayout>
    );
  }
};

const DatatableHeaderCellLayout = ({ children, ...otherProps }: {
  children: React.ReactNode;
} & React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>) => (
  <th {...otherProps}>{children}</th>
);

const DatatableContents = (props: {
  columns: Column[];
  title?: string;
  collectionName: CollectionNameString;
  results?: any[];
  loading?: boolean;
  loadMore: LoadMoreCallback;
  count?: number;
  totalCount: number;
  loadingMore: boolean;
  emptyState?: React.JSX.Element;
}) => {
  const { title, collectionName, results, columns, loading, loadingMore, loadMore, count, totalCount, emptyState } = props;
  if (loading && (!results || !results.length)) {
    return <div className="datatable-list datatable-list-loading"><Loading /></div>;
  } else if (!loading && (!results || !results.length)) {
    return emptyState || null;
  }

  if (!results) return null;

  const hasMore = totalCount > results.length;
  const sortedColumns = _sortBy(columns, column => column.order);
  return (
    <DatatableContentsLayout>
      {title && <DatatableTitle title={title}/>}
      <DatatableContentsInnerLayout>
        <DatatableContentsHeadLayout>
          {sortedColumns.map((column, index) =>
            <DatatableHeader key={index} collectionName={collectionName} column={column} />)
          }
        </DatatableContentsHeadLayout>
        <DatatableContentsBodyLayout>
          {results.map((document: any, index: number) => <DatatableRow {...props} columns={columns} document={document} key={index} />)}
        </DatatableContentsBodyLayout>
      </DatatableContentsInnerLayout>
      {hasMore &&
        <DatatableContentsMoreLayout>
          {loadingMore
            ? <Loading />
            : <LoadMore count={count} totalCount={totalCount} loadMore={loadMore} />
          }
        </DatatableContentsMoreLayout>
      }
    </DatatableContentsLayout>
  );
};

const DatatableContentsLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <div className="datatable-list">
    {children}
  </div>
);
const DatatableContentsInnerLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <table className="table">
    {children}
  </table>
);
const DatatableContentsHeadLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <thead>
    <tr>
      {children}
    </tr>
  </thead>
);
const DatatableContentsBodyLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <tbody>{children}</tbody>
);
const DatatableContentsMoreLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <div className="datatable-list-load-more">
    {children}
  </div>
);

const DatatableTitle = ({ title }: {
  title: string;
}) => {
  return <div className="datatable-title">{title}</div>;
}


interface DatatableRowProps {
  columns: Column[];
  document: any;
}

const DatatableRow = (props: DatatableRowProps) => {
  const { columns, document } = props;
  const sortedColumns = _sortBy(columns, column => column.order);

  return <DatatableRowLayout className={`datatable-item`}>
    {
      sortedColumns
        .map((column, index) => (<DatatableCell
          key={index}
          column={column} document={document} 
        />))
    }
  </DatatableRowLayout>
};

const DatatableRowLayout = ({ children, ...otherProps }: {
  children: React.ReactNode;
} & React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>) => (
  <tr {...otherProps}>
    {children}
  </tr>
);

const DatatableCell = ({ column, document }: {
  column: Column;
  document: any;
}) => {
  const Component = column.component || DatatableDefaultCell;
  const currentUser = useCurrentUser();
  const componentProps = {
    column,
    document,
    currentUser
  };

  return (
    <DatatableCellLayout style={{padding: 4}} >
      <Component {...componentProps} />
    </DatatableCellLayout>
  );
};

const DatatableCellLayout = ({ children, ...otherProps }: {
  children: React.ReactNode;
} & React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>) => (
  <td {...otherProps}>{children}</td>
);

const DatatableDefaultCell = ({ column, document }: {
  column: Column;
  document: any;
}) => {
  return <div>
    {typeof column === 'string'
      ? getFieldValue(document[column])
      : getFieldValue(document[column.name])
     }
  </div>;
}


export default registerComponent('Datatable', Datatable);


