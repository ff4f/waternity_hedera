import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CheckCircle, Copy, ExternalLink } from 'lucide-react';

const OnchainID = () => {
  const agentId = '0.0.123456';
  const reputationScore = 4.8;
  const completedTasks = 124;

  return (
    <Card>
      <CardHeader>
        <CardTitle>On-Chain Identity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Agent ID</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{agentId}</span>
            <Copy className="h-4 w-4 cursor-pointer" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Reputation Score</span>
          <Badge variant="outline">{reputationScore} / 5.0</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Completed Tasks</span>
          <span className="font-medium">{completedTasks}</span>
        </div>
        <Button variant="outline" className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Hedera Explorer
        </Button>
      </CardContent>
    </Card>
  );
};

export default OnchainID;