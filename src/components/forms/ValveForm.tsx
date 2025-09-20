import React from 'react';

// Define the type for the valve command
type ValveCommand = 'OPEN' | 'CLOSE';

// Define the props for the ValveForm component
type ValveFormProps = {
  wellId: string;
  onSubmit: (command: ValveCommand) => void;
};

const ValveForm: React.FC<ValveFormProps> = ({ wellId, onSubmit }) => {
  const handleCommand = (command: ValveCommand) => {
    onSubmit(command);
  };

  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-2">Valve Control</h3>
      <div className="flex items-center">
        <button
          onClick={() => handleCommand('OPEN')}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
        >
          Open Valve
        </button>
        <button
          onClick={() => handleCommand('CLOSE')}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Close Valve
        </button>
      </div>
    </div>
  );
};

export default ValveForm;