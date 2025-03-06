import './reactFactoryShim';
import '@/lib/vulcan-lib/allFragments'
import { routes } from '@/lib/routes';
import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ routes });
}
