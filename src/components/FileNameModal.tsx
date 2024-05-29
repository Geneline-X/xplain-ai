import React from 'react';
import { Button } from './ui/button'; // Adjust the import paths based on your project structure
import { Input } from './ui/input'; // Adjust the import paths based on your project structure

interface FileNameModalProps {
  onClose: () => void;
  onSave: () => void;
  fileName: string;
  setFileName: (name: string) => void;
}

const FileNameModal: React.FC<FileNameModalProps> = ({ onClose, onSave, fileName, setFileName }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-4 rounded shadow-md">
      <Input
        type="text"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="File name"
        className="mr-2 px-2 py-1 border rounded w-full"
      />
      <div className="flex justify-end mt-2">
        <Button
          onClick={onClose}
          className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Save
        </Button>
      </div>
    </div>
  </div>
);

export default FileNameModal;
