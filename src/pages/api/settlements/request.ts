import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/middleware/rbac';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { wellId, periodStart, periodEnd, kwhTotal, grossRevenue } = req.body;
    const settlement = await prisma.settlement.create({
      data: {
        wellId,
        periodStart,
        periodEnd,
        kwhTotal,
        grossRevenue,
        status: 'PENDING',
      },
    });
    res.status(201).json(settlement);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withRole(handler, ['OPERATOR', 'AGENT']);