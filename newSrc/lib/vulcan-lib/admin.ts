let AdminColumns: Array<any> = [];

export const addAdminColumn = columnOrColumns => {
  if (Array.isArray(columnOrColumns)) {
    AdminColumns = AdminColumns.concat(columnOrColumns);
  } else {
    AdminColumns.push(columnOrColumns);
  }
};

export const getAdminColumns = () => AdminColumns;
