// When used in a view, set the query so that it returns rows where a field is
// null or is missing. Equivalent to a search with mongo's `field:null`, except
// that null can't be used this way within Vulcan views because it's ambiguous
// between searching for null/missing, vs overriding the default view to allow
// any value.
export const viewFieldNullOrMissing = {nullOrMissing:true};

// When used in a view, set the query so that any value for this field is
// permitted, overriding constraints from the default view if they exist.
export const viewFieldAllowAny = {allowAny:true};

export const jsonArrayContainsSelector = (field: string, value: AnyBecauseTodo) =>
  ({$expr: {$jsonArrayContains: [field, value]}});
