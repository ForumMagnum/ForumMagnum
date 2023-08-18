import process from 'process';

export function panic(message: string): never {
  //eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
}
