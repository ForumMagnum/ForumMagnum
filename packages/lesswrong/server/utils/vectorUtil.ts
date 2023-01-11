
export function vectorNorm(v: number[]) {
  let sumSq = 0;
  for (let i=0; i<v.length; i++)
    sumSq += v[i]*v[i];
  return Math.sqrt(sumSq);
}

export function normalizeVector(v: number[]) {
  return scaleVector(v, 1.0/vectorNorm(v));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  return vectorDotProduct(a,b) / (vectorNorm(a)*vectorNorm(b));
}

export function vectorSum(...vectors: number[][]): number[] {
  if (!vectors.length) return [];
  let vecSize = vectors[0].length;
  let result: number[] = vectors[0];
  for (let i=1; i<vectors.length; i++) {
    if (vectors[i].length !== vecSize)
      throw new Error("Mismatched vector sizes");
    for (let j=0; j<vecSize; j++)
      result[j] += vectors[i][j];
  }
  return result;
}

export function scaleVector(vec: number[], scale: number): number[] {
  let result: number[] = [];
  for (let i=0; i<vec.length; i++)
    result.push(vec[i]*scale);
  return result;
}

export function vectorDotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Mismatched vector sizes");
  let dotProduct=0;
  for (let i=0; i<a.length; i++)
    dotProduct += a[i]*b[i];
  return dotProduct;
}
