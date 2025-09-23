import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';
import { Badge } from '../../../components/ui/badge';
import { Shield, Gavel } from 'lucide-react';

const DisputeResolution = ({ disputes }) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-4">Dispute Resolution</h2>
      <Accordion type="single" collapsible className="w-full">
        {disputes?.map((dispute) => (
          <AccordionItem key={dispute.id} value={dispute.id}>
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {dispute.status === 'Open' ? (
                    <Gavel className="h-5 w-5 mr-3 text-yellow-500" />
                  ) : (
                    <Shield className="h-5 w-5 mr-3 text-green-500" />
                  )}
                  <div>
                    <span className="font-medium">{dispute.type}</span>
                    <p className="text-sm text-muted-foreground">{dispute.entity}</p>
                  </div>
                </div>
                <Badge variant={dispute.status === 'Open' ? 'destructive' : 'default'}>
                  {dispute.status}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{dispute.description}</p>
                <div className="text-xs mt-4">
                  <p><strong>Raised by:</strong> {dispute.raisedBy}</p>
                  <p><strong>Date:</strong> {dispute.raisedDate}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default DisputeResolution;