import * as _ from 'underscore';

export const mongoSelectorToSql = <T extends DbObject>(selector: MongoSelector<T>, options?: MongoFindOptions<T>) => {
  let queryTextFragments: string[] = [];
  let args: any[] = [];
  
  console.log(`Converting query: ${JSON.stringify(selector)}, ${JSON.stringify(options)}`);
  
  let selectorFragments: string[] = [];
  for (let selectorKey of Object.keys(selector)) {
    if (selector[selectorKey] === undefined) continue;
    const {sql,arg} = mongoSelectorFieldToSql(selectorKey, selector[selectorKey], args.length+1);
    selectorFragments.push(sql);
    args = [...args, ...arg];
  }
  if (selectorFragments.length > 0)
    queryTextFragments.push('where '+selectorFragments.join(' and '));
  
  if (options?.sort) {
    const {sql: sortFragment, arg: sortArgs} = mongoSortToOrderBy(options.sort, args.length+1);
    queryTextFragments.push(sortFragment);
    args = [...args, ...sortArgs];
  }
  
  return {
    sql: queryTextFragments.join(" "),
    arg: args,
  };
}

export const mongoSelectorFieldToSql = (fieldName: string, value: any, argOffset: number): {sql: string, arg: any[]} => {
  if (fieldName==="_id") {
    if (typeof value==="string") {
      return {
        sql: `id=$${argOffset}`,
        arg: [value],
      };
    } else if (typeof value==="object" && value.$in) {
      return {
        sql: `id IN ($${argOffset})`,
        arg: [value.$in],
      };
    } else {
      throw new Error(`Don't know how to handle selector for ${fieldName}`); // TODO
    }
  } else if (fieldName==="$or") {
    const subselectors = value.map(s => mongoSelectorToSql(s));
    return {
      sql: `(${subselectors.map(s=>s.sql).join(" or ")})`,
      arg: _.flatten(subselectors.map(s=>s.arg, true)),
    };
  } else if (fieldName==="$and") {
    const subselectors = value.map(s => mongoSelectorToSql(s));
    return {
      sql: `(${subselectors.map(s=>s.sql).join(" and ")})`,
      arg: _.flatten(subselectors.map(s=>s.arg, true)),
    };
  } else if (fieldName==="$not") {
    throw new Error(`Don't know how to handle selector for ${fieldName}: $not`); // TODO
  } else if (typeof value==='object') {
    for (let op of Object.keys(value)) {
      if (op==="$in") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$in[0])} IN ($${argOffset})`,
          arg: [value.$in],
        }
      } else if (op==="$gt") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$gt)} > $${argOffset}`,
          arg: [value.$gt],
        }
      } else if (op==="$gte") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$gt)} >= $${argOffset}`,
          arg: [value.$gte],
        }
      } else if (op==="$lt") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$gt)} < $${argOffset}`,
          arg: [value.$lt],
        }
      } else if (op==="$lte") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$gt)} <= $${argOffset}`,
          arg: [value.$lte],
        }
      } else if (op==="$exists") {
        if (value.$exists) {
          return {
            sql: `json ? 'fieldName'`,
            arg: [],
          }
        } else {
          return {
            sql: `not (json ? 'fieldName')`,
            arg: [],
          }
        }
      } else if (op==="$ne") {
        return {
          sql: `${mongoFieldToSql(fieldName, value.$gt)} != $${argOffset}`,
          arg: [value.$lt],
        }
      } else {
        throw new Error(`Don't know how to handle selector for ${fieldName} op ${op}`); // TODO
      }
    }
    throw new Error(`Don't know how to handle selector for ${fieldName}: unrecognized object`); // TODO
  } else {
    return {
      sql: `${mongoFieldToSql(fieldName, value)}=$${argOffset}`,
      arg: [value],
    };
  }
}

const mongoFieldToSql = (fieldName: string, inferTypeFromValue: any) => {
  if (typeof inferTypeFromValue === 'string') {
    return `(json->>'${fieldName}')`;
  } else if (typeof inferTypeFromValue === 'number') {
    return `(json->'${fieldName}')::int`;
  } else if (typeof inferTypeFromValue==='boolean') {
    return `(json->'${fieldName}')::boolean`;
  } else if (inferTypeFromValue instanceof Date) {
    return `(json->'${fieldName}')::datetime`;
  } else {
    // TODO
    throw new Error(`Don't know how to handle selector for ${fieldName}: cannot infer type from ${inferTypeFromValue}`);
  }
}

const mongoSortToOrderBy = (mongoSort: any, argOffset: number): {sql: string, arg: string[]} => {
  const fragments: string[] = [];
  for (let sortKey of Object.keys(mongoSort)) {
    if (sortKey==='_id') {
      fragments.push(`id ${mongoSortDirectionToSql(mongoSort[sortKey])}`);
    } else {
      fragments.push(`json->>'${sortKey}' ${mongoSortDirectionToSql(mongoSort[sortKey])}`);
    }
  }
  
  return {
    sql: `order by ${fragments.join(", ")}`,
    arg: [],
  }
}

const mongoSortDirectionToSql = (sortDirection: number): string => {
  if (sortDirection===1) {
    return "ASC";
  } else if (sortDirection===-1) {
    return "DESC";
  } else {
    throw new Error(`Invalid sort direction: ${sortDirection}`);
  }
}
