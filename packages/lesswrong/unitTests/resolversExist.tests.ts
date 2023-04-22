import '../server.ts'
import { assertAllServerFieldsExtended } from '../server/utils/serverSchemaUtils';

describe('schemas', () => {
  it('has a server-side-only component defined for every field with hasServerSide=true', () => {
    assertAllServerFieldsExtended();
  });
});
