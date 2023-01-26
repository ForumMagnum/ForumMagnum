import { Components, registerComponent, getCollection } from '../../lib/vulcan-lib';
import { LoadMoreCallback, withMulti } from '../../lib/crud/withMulti';
import withUser from '../common/withUser';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { getSchema } from '../../lib/utils/getSchema';
import { intlShape } from '../../lib/vulcan-i18n';
import { getFieldValue } from './Card';
import _sortBy from 'lodash/sortBy';
import classNames from 'classnames';
import type { ColumnComponents } from './datatableTypes';

export interface Column {
  name: string;
  sortable?: string;
  label?: string;
  order?: number;
  component?: ComponentTypes[ColumnComponents];
  componentName?: ColumnComponents
}

/*

Datatable Component

*/

// see: http://stackoverflow.com/questions/1909441/jquery-keyup-delay
const delay = (function(){
  var timer: any = 0;
  return function(callback: () => void, ms: number){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

const getColumnName = (column: Column) => (
  typeof column === 'string' 
  ? column 
  : column.label || column.name
);

class Datatable extends PureComponent<any,any> {

  constructor(props: any) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
    this.state = {
      value: '',
      query: '',
      currentSort: {}
    };
  }

  toggleSort = (column: string) => {
    let currentSort;
    if (!this.state.currentSort[column]) {
      currentSort = { [column] : 1 };
    } else if (this.state.currentSort[column] === 1) {
      currentSort = { [column] : -1 };
    } else {
      currentSort = {};
    }
    this.setState({ currentSort });
  }

  updateQuery(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.persist();
    e.preventDefault();
    this.setState({
      value: e.target.value
    });
    delay(() => {
      this.setState({
        query: e.target.value
      });
    }, 700 );
  }

  render() {
    if (this.props.data) { // static JSON datatable
      // TODO: that's definitely not the right type for columns, does this case ever get hit?
      // @ts-ignore
      return <Components.DatatableContents columns={Object.keys(this.props.data[0])} {...this.props} results={this.props.data} />;
            
    } else { // dynamic datatable with data loading
      
      const collection = this.props.collection || getCollection(this.props.collectionName);
      const options = {
        collection,
        ...this.props.options
      };

      const DatatableWithMulti: any = withMulti(options)(Components.DatatableContents);

      // add _id to orderBy when we want to sort a column, to avoid breaking the graphql() hoc;
      // see https://github.com/VulcanJS/Vulcan/issues/2090#issuecomment-433860782
      // this.state.currentSort !== {} is always false, even when console.log(this.state.currentSort) displays {}. So we test on the length of keys for this object.
      const orderBy = Object.keys(this.state.currentSort).length == 0 ? {} : { ...this.state.currentSort, _id: -1 };

      return (
        <Components.DatatableLayout collectionName={collection.options.collectionName}>
          <DatatableWithMulti {...this.props} collection={collection} terms={{ query: this.state.query, orderBy: orderBy }} currentUser={this.props.currentUser} toggleSort={this.toggleSort} currentSort={this.state.currentSort}/>
        </Components.DatatableLayout>
      );
    }
  }
}

(Datatable as any).propTypes = {
  title: PropTypes.string,
  collection: PropTypes.object,
  columns: PropTypes.array,
  data: PropTypes.array,
  options: PropTypes.object,
  emptyState: PropTypes.object,
};
const DatatableComponent = registerComponent('Datatable', Datatable, {
  hocs: [withUser]
});

export default Datatable;

const DatatableLayout = ({ collectionName, children }: {
  collectionName: CollectionNameString;
  children: React.ReactNode;
}) => (
  <div className={`datatable datatable-${collectionName}`}>
    {children}
  </div>
);
const DatatableLayoutComponent = registerComponent('DatatableLayout', DatatableLayout);

/*

DatatableHeader Component

*/
const DatatableHeader = ({ collection, column, toggleSort, currentSort }: {
  collection: CollectionBase<any>
  column: Column;
  toggleSort: (name: string) => void;
  currentSort: Record<string, number>;
}, { intl }: any) => {

  const columnName = getColumnName(column);
  
  if (collection) {
    const schema = getSchema(collection);

    /*

    use either:

    1. the column name translation : collectionName.columnName, global.columnName, columnName
    2. the column name label in the schema (if the column name matches a schema field)
    3. the raw column name.

    */
    const formattedLabel = intl.formatLabel({fieldName: columnName, collectionName: collection.collectionName, schema: schema});

    // if sortable is a string, use it as the name of the property to sort by. If it's just `true`, use column.name
    const sortPropertyName = typeof column.sortable === 'string' ? column.sortable : column.name;
    return column.sortable 
    ? <Components.DatatableSorter name={sortPropertyName} label={formattedLabel} toggleSort={toggleSort} currentSort={currentSort} /> 
    : <Components.DatatableHeaderCellLayout>{formattedLabel}</Components.DatatableHeaderCellLayout>;

  } else {

    const formattedLabel = intl.formatMessage({ id: columnName, defaultMessage: columnName });
    return (
      <Components.DatatableHeaderCellLayout
        className={`datatable-th-${columnName.toLowerCase().replace(/\s/g, '-')}`}
      >
        {formattedLabel}
      </Components.DatatableHeaderCellLayout>
    );
  }
};
DatatableHeader.contextTypes = {
  intl: intlShape
};
DatatableHeader.propTypes = {
};
const DatatableHeaderComponent = registerComponent('DatatableHeader', DatatableHeader);

const DatatableHeaderCellLayout = ({ children, ...otherProps }: {
  children: React.ReactNode;
} & React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>) => (
  <th {...otherProps}>{children}</th>
);
const DatatableHeaderCellLayoutComponent = registerComponent('DatatableHeaderCellLayout', DatatableHeaderCellLayout);

const SortNone = () =>
  <svg width='16' height='16' viewBox='0 0 438 438' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path d='M25.7368 247.243H280.263C303.149 247.243 314.592 274.958 298.444 291.116L171.18 418.456C161.128 428.515 144.872 428.515 134.926 418.456L7.55631 291.116C-8.59221 274.958 2.85078 247.243 25.7368 247.243ZM298.444 134.884L171.18 7.54408C161.128 -2.51469 144.872 -2.51469 134.926 7.54408L7.55631 134.884C-8.59221 151.042 2.85078 178.757 25.7368 178.757H280.263C303.149 178.757 314.592 151.042 298.444 134.884Z' transform='translate(66 6)' fill='currentColor' fillOpacity='0.2' />
  </svg>;

const SortDesc = () =>
  <svg width="16" height="16" viewBox="0 0 438 438" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.7368 0H280.263C303.149 0 314.592 27.7151 298.444 43.8734L171.18 171.213C161.128 181.272 144.872 181.272 134.926 171.213L7.55631 43.8734C-8.59221 27.7151 2.85078 0 25.7368 0Z" transform="translate(66 253.243)" fill="currentColor" fillOpacity="0.7"/>
    <path d="M171.18 7.54408L298.444 134.884C314.592 151.042 303.149 178.757 280.263 178.757H25.7368C2.85078 178.757 -8.59221 151.042 7.55631 134.884L134.926 7.54408C144.872 -2.51469 161.128 -2.51469 171.18 7.54408Z" transform="translate(66 6)" fill="currentColor" fillOpacity="0.2"/>
  </svg>;

const SortAsc = () =>
  <svg width="16" height="16" viewBox="0 0 438 438" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M298.444 134.884L171.18 7.54408C161.128 -2.51469 144.872 -2.51469 134.926 7.54408L7.55631 134.884C-8.59221 151.042 2.85078 178.757 25.7368 178.757H280.263C303.149 178.757 314.592 151.042 298.444 134.884Z" transform="translate(66 6)" fill="currentColor" fillOpacity="0.7"/>
    <path d="M280.263 0H25.7368C2.85078 0 -8.59221 27.7151 7.55631 43.8734L134.926 171.213C144.872 181.272 161.128 181.272 171.18 171.213L298.444 43.8734C314.592 27.7151 303.149 0 280.263 0Z" transform="translate(66 253.243)" fill="currentColor" fillOpacity="0.2"/>
  </svg>;

const DatatableSorter = ({ name, label, toggleSort, currentSort }: {
  name: string;
  label: string;
  toggleSort: (name: string) => void;
  currentSort: Record<string, number>;
}) => 
  <th>
    <div className="datatable-sorter" onClick={() => {toggleSort(name);}}>
      <span className="datatable-sorter-label">{label}</span>
      <span className="sort-icon">
        {!currentSort[name] ? (
          <SortNone/> 
        ) : currentSort[name] === 1 ? (
          <SortAsc/>
        ) : (
          <SortDesc/> 
        )
      }
      </span>
    </div>
  </th>;

const DatatableSorterComponent = registerComponent('DatatableSorter', DatatableSorter);

/*

DatatableContents Component

*/

interface DatatableContentsProps {
  columns: Column[];
  title?: string;
  collection: CollectionBase<any>;
  results?: any[];
  loading?: boolean;
  loadMore: LoadMoreCallback;
  count?: number;
  totalCount: number;
  networkStatus?: number;
  currentUser: UsersCurrent | null;
  emptyState?: JSX.Element;
  toggleSort: (name: string) => void;
  currentSort: Record<string, number>;
  rowClass: (document: any) => string;
}

const DatatableContents = (props: DatatableContentsProps) => {

  // if no columns are provided, default to using keys of first array item
  const { title, collection, results, columns, loading, loadMore, 
    count, totalCount, networkStatus, currentUser, emptyState, 
    toggleSort, currentSort } = props;

  const { DatatableHeader, DatatableContentsHeadLayout, DatatableTitle, DatatableContentsLayout, DatatableContentsInnerLayout, DatatableContentsBodyLayout, LoadMore } = Components

  if (loading) {
    return <div className="datatable-list datatable-list-loading"><Components.Loading /></div>;
  } else if (!results || !results.length) {
    return emptyState || null;
  }

  const isLoadingMore = networkStatus === 2;
  const hasMore = totalCount > results.length;
  const sortedColumns = _sortBy(columns, column => column.order);
  return (
    <DatatableContentsLayout>
      {title && <DatatableTitle title={title}/>}
      <DatatableContentsInnerLayout>
        <DatatableContentsHeadLayout>
          {
            sortedColumns
              .map((column, index) => (
                <DatatableHeader
                  key={index} collection={collection} column={column}
                  toggleSort={toggleSort} currentSort={currentSort} />)
              )
          }
        </DatatableContentsHeadLayout>
        <DatatableContentsBodyLayout>
          {results.map((document: any, index: number) => <Components.DatatableRow {...props} collection={collection} columns={columns} document={document} key={index} currentUser={currentUser} />)}
        </DatatableContentsBodyLayout>
      </DatatableContentsInnerLayout>
      {hasMore &&
        <Components.DatatableContentsMoreLayout>
          {isLoadingMore
            ? <Components.Loading />
            : (
            <LoadMore count={count} totalCount={totalCount} loadMore={loadMore} />
            )
          }
        </Components.DatatableContentsMoreLayout>
      }
    </DatatableContentsLayout>
  );
};
DatatableContents.propTypes = {
};
const DatatableContentsComponent = registerComponent('DatatableContents', DatatableContents);

const DatatableContentsLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <div className="datatable-list">
    {children}
  </div>
);
const DatatableContentsLayoutComponent = registerComponent('DatatableContentsLayout', DatatableContentsLayout);
const DatatableContentsInnerLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <table className="table">
    {children}
  </table>
);
const DatatableContentsInnerLayoutComponent = registerComponent('DatatableContentsInnerLayout', DatatableContentsInnerLayout);
const DatatableContentsHeadLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <thead>
    <tr>
      {children}
    </tr>
  </thead>
);
const DatatableContentsHeadLayoutComponent = registerComponent('DatatableContentsHeadLayout', DatatableContentsHeadLayout);
const DatatableContentsBodyLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <tbody>{children}</tbody>
);
const DatatableContentsBodyLayoutComponent = registerComponent('DatatableContentsBodyLayout', DatatableContentsBodyLayout);
const DatatableContentsMoreLayout = ({ children }: {
  children: React.ReactNode;
}) => (
  <div className="datatable-list-load-more">
    {children}
  </div>
);
const DatatableContentsMoreLayoutComponent = registerComponent('DatatableContentsMoreLayout', DatatableContentsMoreLayout);

/*

DatatableTitle Component

*/
const DatatableTitle = ({ title }: {
  title: string;
}) => 
  <div className="datatable-title">{title}</div>;

const DatatableTitleComponent = registerComponent('DatatableTitle', DatatableTitle);

/*

DatatableRow Component

*/

interface DatatableRowProps {
  columns: Column[];
  document: any;
  currentUser: UsersCurrent | null;
  rowClass: string | ((document: any) => string);
  collection: CollectionBase<any>;
}

const DatatableRow = (props: DatatableRowProps) => {

  const { columns, document, currentUser, rowClass } = props;

  const row = typeof rowClass === 'function' ? rowClass(document) : rowClass || '';
  const sortedColumns = _sortBy(columns, column => column.order);

  return (
  <Components.DatatableRowLayout className={`datatable-item ${row}`}>
      {
        sortedColumns
        .map((column, index) => (
        <Components.DatatableCell 
        key={index}
        column={column} document={document} 
        currentUser={currentUser} />
      ))}
  </Components.DatatableRowLayout>
  );
};
DatatableRow.propTypes = {
};
const DatatableRowComponent = registerComponent('DatatableRow', DatatableRow);

const DatatableRowLayout = ({ children, ...otherProps }: {
  children: React.ReactNode;
} & React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>) => (
  <tr {...otherProps}>
    {children}
  </tr>
);
const DatatableRowLayoutComponent = registerComponent('DatatableRowLayout', DatatableRowLayout);

/*

DatatableCell Component

*/

const cellStyles = (theme: JssStyles) => ({
  cell: {
    padding: 4
  }
})
const DatatableCell = ({ classes, column, document, currentUser }: {
  classes: ClassesType;
  column: Column;
  document: any;
  currentUser: UsersCurrent | null
}) => {
  const Component: any = column.component 
  || (column.componentName && Components[column.componentName])
  || Components.DatatableDefaultCell;
  const columnName = getColumnName(column);
  const componentProps = {
    column,
    document,
    currentUser
  };

  return (
    <Components.DatatableCellLayout className={classNames(`datatable-item-${columnName.toLowerCase().replace(/\s/g, '-')}`, classes.cell)}>
      <Component {...componentProps} />
    </Components.DatatableCellLayout>
  );
};
DatatableCell.propTypes = {
};
const DatatableCellComponent = registerComponent('DatatableCell', DatatableCell, {styles: cellStyles});

const DatatableCellLayout = ({ children, ...otherProps }: {
  children: React.ReactNode;
} & React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>) => (
  <td {...otherProps}>{children}</td>
);
const DatatableCellLayoutComponent = registerComponent('DatatableCellLayout', DatatableCellLayout);

/*

DatatableDefaultCell Component

*/
const DatatableDefaultCell = ({ column, document }: {
  column: Column;
  document: any;
}) =>
  <div>{typeof column === 'string' ? getFieldValue(document[column]) : getFieldValue(document[column.name])}</div>;

const DatatableDefaultCellComponent = registerComponent('DatatableDefaultCell', DatatableDefaultCell);


declare global {
  interface ComponentTypes {
    Datatable: typeof DatatableComponent,
    DatatableLayout: typeof DatatableLayoutComponent,
    DatatableHeader: typeof DatatableHeaderComponent,
    DatatableHeaderCellLayout: typeof DatatableHeaderCellLayoutComponent,
    DatatableSorter: typeof DatatableSorterComponent,
    DatatableContents: typeof DatatableContentsComponent,
    DatatableContentsLayout: typeof DatatableContentsLayoutComponent,
    DatatableContentsInnerLayout: typeof DatatableContentsInnerLayoutComponent,
    DatatableContentsHeadLayout: typeof DatatableContentsHeadLayoutComponent,
    DatatableContentsBodyLayout: typeof DatatableContentsBodyLayoutComponent,
    DatatableContentsMoreLayout: typeof DatatableContentsMoreLayoutComponent,
    DatatableTitle: typeof DatatableTitleComponent,
    DatatableRow: typeof DatatableRowComponent,
    DatatableRowLayout: typeof DatatableRowLayoutComponent,
    DatatableCell: typeof DatatableCellComponent,
    DatatableCellLayout: typeof DatatableCellLayoutComponent,
    DatatableDefaultCell: typeof DatatableDefaultCellComponent,
  }
}
