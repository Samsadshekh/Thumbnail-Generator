
import React from 'react';

interface SelectInputProps {
    label: string;
    value: string;
    options: readonly string[];
    onChange: (value: string) => void;
}

const SelectInput: React.FC<SelectInputProps> = ({ label, value, options, onChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-brand-dark-lighter border border-gray-600 rounded-md shadow-sm p-2 text-white focus:ring-brand-purple focus:border-brand-purple"
            >
                {options.map(option => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectInput;
