import md5 from "md5";

export const hashPostText = (text: string): string => md5(text);

const emptyTextHash = hashPostText("");

export const isEmbeddingOfEmptyText = (embedding: Pick<DbPostEmbedding, "postHash">): boolean =>
  embedding.postHash === emptyTextHash;
