import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

type Role = 'INVESTOR' | 'OPERATOR' | 'AGENT';

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export const withRole = (
  handler: ApiHandler,
  roles: Role[]
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = (session.user as any).role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return handler(req, res);
  };
};