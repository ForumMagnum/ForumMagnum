import { getCollection, isValidCollectionName } from "../vulcan-lib";
import PgCollection from "./PgCollection";

type FragmentEntry = {
  type: "field",
  name: string,
}

class SqlFragment<T extends DbObject> {
  private name: string;
  private collection: PgCollection<T>;
  private entries: FragmentEntry[];

  constructor(fragmentText: string) {
    const match = fragmentText.match(/\s*fragment\s+([a-zA-Z0-9-_]+)\s+on\s+([a-zA-Z0-9-_]+)\s*{(.*)}/s);
    if (match?.length !== 4) {
      throw new Error("Cannot parse fragment text");
    }

    this.name = match[1];

    const collectionName = match[2];
    if (!isValidCollectionName(collectionName)) {
      throw new Error(`Invalid collection name: ${collectionName}`);
    }

    this.collection = getCollection(collectionName) as unknown as PgCollection<T>;
    if (!this.collection.isPostgres()) {
      throw new Error("Collection is not a PgCollection");
    }

    const fieldsText = match[3];
    this.entries = this.parseEntries(fieldsText.split("\n"));
  }

  getName(): string {
    return this.name;
  }

  getCollection(): PgCollection<T> {
    return this.collection;
  }

  getEntries(): FragmentEntry[] {
    return this.entries;
  }

  private parseEntries(lines: string[]): FragmentEntry[] {
    const entries: FragmentEntry[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].match(/\s*([^#]*)(#.*)?/)?.[1]?.trimEnd();
      if (!line) {
        continue;
      }

      let match = line.match(/\s*([a-zA-Z0-9-_]+)\s*(#\s*)?/);
      if (match?.[1]) {
        entries.push({
          type: "field",
          name: match[1],
        });
        continue;
      }

      match = line.match(/\s*\.\.\.([a-zA-Z0-9-_]+)\s*/)
      if (match?.[1]) {
        // TODO
        console.log("spread");
        continue;
      }

      match = line.match(/\s*[a-zA-Z0-9-_]+\s*{\s*/);
      if (match?.[1]) {
        // TODO
        console.log("complex");
        continue;
      }
    }
    return entries;
  }
}

export default SqlFragment;
