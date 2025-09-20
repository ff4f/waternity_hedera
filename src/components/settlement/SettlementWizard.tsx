import React from 'react';

// Define the steps in the settlement wizard
type Step = 'request' | 'approve' | 'execute' | 'mint';

// Define the props for the SettlementWizard component
type SettlementWizardProps = {
  wellId: string;
};

const SettlementWizard: React.FC<SettlementWizardProps> = ({ wellId }) => {
  const [currentStep, setCurrentStep] = React.useState<Step>('request');

  const handleRequest = () => {
    // Logic to request settlement
    console.log('Settlement requested for well:', wellId);
    setCurrentStep('approve');
  };

  const handleApprove = () => {
    // Logic for simulated agent approval
    console.log('Settlement approved by agent for well:', wellId);
    setCurrentStep('execute');
  };

  const handleExecute = () => {
    // Logic to execute the settlement
    console.log('Settlement executed for well:', wellId);
    setCurrentStep('mint');
  };

  const handleMint = () => {
    // Logic for the Mint Token demo
    console.log('Mint Token demo for well:', wellId);
    // Reset or move to a final state
  };

  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-2">Settlement Wizard</h3>
      <div className="flex items-center space-x-2">
        {currentStep === 'request' && (
          <button
            onClick={handleRequest}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Request Settlement
          </button>
        )}
        {currentStep === 'approve' && (
          <button
            onClick={handleApprove}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Approve Settlement (Simulated)
          </button>
        )}
        {currentStep === 'execute' && (
          <button
            onClick={handleExecute}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Execute Settlement
          </button>
        )}
        {currentStep === 'mint' && (
          <button
            onClick={handleMint}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Mint Token (Demo)
          </button>
        )}
      </div>
    </div>
  );
};

export default SettlementWizard;