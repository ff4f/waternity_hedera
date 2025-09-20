import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';

const AgentPerformance = () => {
  const performanceData = {
    verificationAccuracy: 98.5,
    averageResponseTime: '4.2 hours',
    disputesResolved: 12,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Verification Accuracy</span>
            <span className="font-medium">{performanceData.verificationAccuracy}%</span>
          </div>
          <Progress value={performanceData.verificationAccuracy} />
        </div>
        <div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average Response Time</span>
            <span className="font-medium">{performanceData.averageResponseTime}</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Disputes Resolved</span>
            <span className="font-medium">{performanceData.disputesResolved}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentPerformance;