import { getCollection, isValidCollectionName } from "../vulcan-lib";
import PgCollection from "./PgCollection";

type FragmentEntry = {
  type: "field",
  name: string,
} | {
  type: "spread",
  fragmentName: string,
} | {
  type: "pick",
  name: string,
  entries: FragmentEntry[],
};

class Lexer {
  private lines: string[];
  private position = 0;

  constructor(fieldsText: string) {
    this.lines = fieldsText.split("\n");
  }

  next(): string | null {
    while (this.position < this.lines.length) {
      const line = this.lines[this.position++];
      const trimmedLine = line.match(/\s*([^#]*)(#.*)?/)?.[1]?.trimEnd();
      if (!trimmedLine) {
        continue;
      }
      return trimmedLine;
    }
    return null;
  }

  finished(): boolean {
    return this.position >= this.lines.length;
  }
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
    const lexer = new Lexer(fieldsText);
    this.entries = this.parseEntries(lexer);
    if (!lexer.finished()) {
      throw new Error(`Mismatched braces in fragment: "${this.name}"`);
    }
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

  private parseEntries(lexer: Lexer): FragmentEntry[] {
    const entries: FragmentEntry[] = [];
    let line: string | null;
    while (line = lexer.next()) {
      if (line === "}") {
        break;
      }

      let match = line.match(/^[a-zA-Z0-9-_]+$/);
      if (match?.[0]) {
        entries.push({
          type: "field",
          name: match[0],
        });
        continue;
      }

      match = line.match(/^\.\.\.([a-zA-Z0-9-_]+)$/)
      if (match?.[1]) {
        entries.push({
          type: "spread",
          fragmentName: match[1],
        });
        continue;
      }

      match = line.match(/^([a-zA-Z0-9-_]+)\s*{$/);
      if (match?.[1]) {
        entries.push({
          type: "pick",
          name: match[1],
          entries: this.parseEntries(lexer),
        });
        continue;
      }

      throw new Error(`Parse error in fragment "${this.name}": "${line}"`);
    }
    return entries;
  }
}

export default SqlFragment;
