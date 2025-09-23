import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/middleware/rbac';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { id } = req.query;
    const settlement = await prisma.settlement.update({
      where: { id: String(id) },
      data: { status: 'EXECUTED' },
    });

    // In a real app, this would trigger a payout to the payee
    await prisma.payout.create({
      data: {
        settlementId: settlement.id,
        recipientAccount: '0.0.12345', // Placeholder
        assetType: 'HBAR', // Placeholder
        amount: settlement.grossRevenue,
        status: 'PENDING',
      },
    });

    res.status(200).json(settlement);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withRole(handler, ['OPERATOR', 'AGENT']);