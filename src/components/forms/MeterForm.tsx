import React from 'react';

// Define the props for the MeterForm component
type MeterFormProps = {
  wellId: string;
  onSubmit: (reading: number) => void;
};

const MeterForm: React.FC<MeterFormProps> = ({ wellId, onSubmit }) => {
  const [reading, setReading] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const readingValue = parseFloat(reading);
    if (!isNaN(readingValue)) {
      onSubmit(readingValue);
      setReading('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h3 className="text-xl font-bold mb-2">Submit Meter Reading</h3>
      <div className="flex items-center">
        <input
          type="number"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder="Enter meter reading"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default MeterForm;