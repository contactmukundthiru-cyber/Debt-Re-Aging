'use strict';

import React from 'react';
import { LetterType } from '../../../lib/constants';

interface LetterEditorTabProps {
  selectedLetterType: LetterType;
  setSelectedLetterType: React.Dispatch<React.SetStateAction<LetterType>>;
  editableLetter: string;
  setEditableLetter: (text: string) => void;
  generatePDF: (content: string, filename: string) => void;
}

const LetterEditorTab: React.FC<LetterEditorTabProps> = ({
  selectedLetterType,
  setSelectedLetterType,
  editableLetter,
  setEditableLetter,
  generatePDF
}) => {
  const letterTypes: { id: LetterType; label: string }[] = [
    { id: 'bureau', label: 'Credit Bureau' },
    { id: 'validation', label: 'Debt Validation' },
    { id: 'furnisher', label: 'Direct Dispute' },
    { id: 'cease_desist', label: 'Cease & Desist' },
    { id: 'intent_to_sue', label: 'Intent to Sue' }
  ];

  return (
    <div className="fade-in space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {letterTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedLetterType(type.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              selectedLetterType === type.id 
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
      
      <div className="panel p-0 overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="bg-gray-50 dark:bg-gray-800/80 p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <span className="heading-sm text-[10px] dark:text-gray-400 uppercase tracking-widest">Interactive Dispute Editor</span>
          <div className="flex gap-2">
            <button 
              onClick={() => generatePDF(editableLetter, `dispute_${selectedLetterType}.pdf`)}
              className="text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:text-white"
            >
              Download PDF
            </button>
          </div>
        </div>
        <textarea
          className="w-full h-[600px] p-8 font-serif text-lg leading-relaxed bg-white dark:bg-gray-900 border-none focus:ring-0 resize-none outline-none dark:text-white"
          value={editableLetter}
          onChange={(e) => setEditableLetter(e.target.value)}
          spellCheck={false}
        />
      </div>
      <p className="body-sm text-gray-500 dark:text-gray-400 italic text-center">
        Tip: You can edit the text above directly before downloading your dispute letter.
      </p>
    </div>
  );
};

export default LetterEditorTab;
