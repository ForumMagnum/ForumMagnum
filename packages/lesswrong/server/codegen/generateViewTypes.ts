import { allViews } from '@/lib/views/allViews';
import { getAllCollections } from '@/server/collections/allCollections';
import orderBy from 'lodash/orderBy';

// NOT AN ESCAPING FUNCTION FOR UNTRUSTED INPUT
function wrapWithQuotes(s: string): string {
  return `"${s}"`;
}

export function generateViewTypes(): string {
  const sb: Array<string> = [];
  const collections = getAllCollections();
  const collectionsWithViews = collections
    .filter(collection => Object.keys(allViews[collection.collectionName]?.getAllViews() ?? {})?.length > 0);
  
  for (let collection of collections) {
    const collectionName = collection.collectionName;
    const views = allViews[collectionName]?.getAllViews() ?? {};
    const viewNames = orderBy(Object.keys(views), v=>v);
    
    /*sb.push(`interface ${collectionName}View extends ViewBase {\n`);
    sb.push(`  view: ${collectionName}ViewName\n`);
    sb.push(`  terms: ${collectionName}ViewTerms\n`);
    sb.push(`}\n`);*/
    if (viewNames.length > 0) {
      sb.push(`type ${collectionName}ViewName = ${viewNames.map(n=>wrapWithQuotes(n)).join("|")};\n`);
    } else {
      sb.push(`type ${collectionName}ViewName = never\n`);
    }
  }
  sb.push("\n");
  
  sb.push("interface ViewTermsByCollectionName {\n");
  for (let collection of collections) {
    const collectionName = collection.collectionName;
    const collectionViewSet = allViews[collectionName];
    
    // Does this collection have any views?
    if (collectionViewSet && (
      Object.keys(collectionViewSet.getAllViews()).length > 0
      || collectionViewSet.getDefaultView()
    )) {
      sb.push(`  ${collectionName}: ${collectionName}ViewTerms\n`);
    } else {
      sb.push(`  ${collectionName}: ViewTermsBase\n`);
    }
  }
  sb.push("}\n");
  sb.push("\n");
  
  /*sb.push(`type CollectionNameAndTerms = ${collections.map(c =>
    `{collectionName: ${wrapWithQuotes(c.collectionName)}, terms: ${c.collectionName}ViewTerms}`
  ).join("\n  |")}\n`);*/
  
  sb.push("\n");
  sb.push(`type NameOfCollectionWithViews = ${collectionsWithViews.map(c => wrapWithQuotes(c.collectionName)).join("|")}\n`);
  
  return sb.join('');
}
