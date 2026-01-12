'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selectedValues,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all shadow-sm ${
          selectedValues.length > 0
            ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
        }`}
      >
        <span className="truncate mr-2">
          {selectedValues.length > 0 ? `${label}: ${selectedValues.length}` : label}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chon {label}
            </span>
            {selectedValues.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline"
              >
                Bo chon
              </button>
            )}
          </div>
          <div className="p-1">
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center px-3 py-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                onClick={() => toggleOption(option)}
              >
                <div className={`w-4 h-4 mr-3 rounded border flex items-center justify-center transition-colors ${
                  selectedValues.includes(option) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'
                }`}>
                  {selectedValues.includes(option) && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-sm ${selectedValues.includes(option) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                  {option}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
