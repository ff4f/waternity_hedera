export const mockVerifications = [
  {
    id: 'v1',
    type: 'Milestone',
    entity: 'Well #123',
    status: 'Pending',
    submittedBy: 'Operator A',
    submissionDate: '2024-07-20',
    dueDate: '2024-07-27',
  },
  {
    id: 'v2',
    type: 'Sensor Data',
    entity: 'Well #124',
    status: 'Pending',
    submittedBy: 'Operator B',
    submissionDate: '2024-07-19',
    dueDate: '2024-07-26',
  },
  {
    id: 'v3',
    type: 'Payment Proof',
    entity: 'Investor X',
    status: 'Approved',
    submittedBy: 'Investor X',
    submissionDate: '2024-07-18',
    dueDate: '2024-07-25',
  },
  {
    id: 'v4',
    type: 'Milestone',
    entity: 'Well #125',
    status: 'Rejected',
    submittedBy: 'Operator C',
    submissionDate: '2024-07-17',
    dueDate: '2024-07-24',
  },
];

export const mockDisputes = [
  {
    id: 'd1',
    type: 'Payment Discrepancy',
    entity: 'Well #123',
    status: 'Open',
    raisedBy: 'Investor Y',
    raisedDate: '2024-07-15',
    description: 'Investor Y claims a discrepancy in the last yield payment for Well #123.',
  },
  {
    id: 'd2',
    type: 'Sensor Malfunction',
    entity: 'Well #126',
    status: 'Closed',
    raisedBy: 'Operator D',
    raisedDate: '2024-07-10',
    description: 'Operator D reported a faulty sensor reading for Well #126, now resolved.',
  },
];