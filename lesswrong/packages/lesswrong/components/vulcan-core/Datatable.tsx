import { LoadMoreCallback, useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { getSchema } from '../../lib/utils/getSchema';
import { getFieldValue } from './Card';
import _sortBy from 'lodash/sortBy';
import { formatLabel, formatMessage } from '../../lib/vulcan-i18n/provider';
import { useCurrentUser } from '../common/withUser';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getCollection } from "../../lib/vulcan-lib/getCollection";
import LoadMore from "@/components/common/LoadMore";
import { Loading } from "@/components/vulcan-core/Loading";

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
>({columns, collectionName, fragmentName, limit, terms}: {
  columns: Column[],
  collectionName: CollectionNameString,
  fragmentName: FragmentTypeName
  limit?: number,
  terms: ViewTermsByCollectionName[CollectionName]
}) => {
  const collection = getCollection(collectionName);
  const { results, loading, loadingMore, loadMore, count, totalCount } = useMulti({
    collectionName,
    fragmentName,
    terms: terms,
    limit,
    enableTotal: true,
  });
  return <DatatableLayout collectionName={collection.options.collectionName}>
    <DatatableContents
      columns={columns}
      collection={collection}
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

const DatatableHeader = ({ collection, column }: {
  collection: CollectionBase<any>
  column: Column;
}) => {
  const columnName = getColumnName(column);
  
  if (collection) {
    const schema = getSchema(collection);

    /*

    use either:

    1. the column name translation : collectionName.columnName, global.columnName, columnName
    2. the column name label in the schema (if the column name matches a schema field)
    3. the raw column name.

    */
    const formattedLabel = formatLabel({fieldName: columnName, collectionName: collection.collectionName, schema: schema});

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
  collection: CollectionBase<any>;
  results?: any[];
  loading?: boolean;
  loadMore: LoadMoreCallback;
  count?: number;
  totalCount: number;
  loadingMore: boolean;
  emptyState?: JSX.Element;
}) => {
  const { title, collection, results, columns, loading, loadingMore, loadMore, count, totalCount, emptyState } = props;
  if (loading) {
    return <div className="datatable-list datatable-list-loading"><Loading /></div>;
  } else if (!results || !results.length) {
    return emptyState || null;
  }

  const hasMore = totalCount > results.length;
  const sortedColumns = _sortBy(columns, column => column.order);
  return (
    <DatatableContentsLayout>
      {title && <DatatableTitle title={title}/>}
      <DatatableContentsInnerLayout>
        <DatatableContentsHeadLayout>
          {sortedColumns.map((column, index) =>
            <DatatableHeader key={index} collection={collection} column={column} />)
          }
        </DatatableContentsHeadLayout>
        <DatatableContentsBodyLayout>
          {results.map((document: any, index: number) => <DatatableRow {...props} collection={collection} columns={columns} document={document} key={index} />)}
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
  collection: CollectionBase<any>;
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


const DatatableComponent = registerComponent('Datatable', Datatable);

declare global {
  interface ComponentTypes {
    Datatable: typeof DatatableComponent,
  }
}

export default DatatableComponent;
