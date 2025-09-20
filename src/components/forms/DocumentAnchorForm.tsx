import React from 'react';

// Define the props for the DocumentAnchorForm component
type DocumentAnchorFormProps = {
  wellId: string;
  onSubmit: (file: File) => void;
};

const DocumentAnchorForm: React.FC<DocumentAnchorFormProps> = ({ wellId, onSubmit }) => {
  const [file, setFile] = React.useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit(file);
      setFile(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h3 className="text-xl font-bold mb-2">Anchor Document</h3>
      <div className="flex items-center">
        <input
          type="file"
          onChange={handleFileChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <button
          type="submit"
          disabled={!file}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2 disabled:bg-gray-400"
        >
          Anchor
        </button>
      </div>
    </form>
  );
};

export default DocumentAnchorForm;