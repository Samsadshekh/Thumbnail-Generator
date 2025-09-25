
import React, { useState, useRef } from 'react';
import type { ImageFile } from '../types';
import UploadIcon from './icons/UploadIcon';
import TrashIcon from './icons/TrashIcon';

interface ImageUploaderProps {
    label: string;
    onFileChange: (file: ImageFile | null) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};


const ImageUploader: React.FC<ImageUploaderProps> = ({ label, onFileChange }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }
            const base64 = await fileToBase64(file);
            const imageFile: ImageFile = {
                name: file.name,
                base64,
                mimeType: file.type,
            };
            onFileChange(imageFile);
            setImagePreview(URL.createObjectURL(file));
            setFileName(file.name);
        }
    };

    const handleRemoveImage = () => {
        onFileChange(null);
        setImagePreview(null);
        setFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleContainerClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <div
                onClick={handleContainerClick}
                className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-brand-dark-lighter hover:bg-gray-700 transition-colors"
            >
                {imagePreview ? (
                    <>
                        <img src={imagePreview} alt="Preview" className="object-contain h-full w-full rounded-lg p-1" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage();
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all"
                            aria-label="Remove image"
                        >
                           <TrashIcon />
                        </button>
                    </>
                ) : (
                    <div className="text-center text-gray-400">
                        <UploadIcon />
                        <p className="text-xs mt-1">Click to upload</p>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
            {fileName && (
                 <p className="text-xs text-gray-400 mt-1 truncate" title={fileName}>{fileName}</p>
            )}
        </div>
    );
};

export default ImageUploader;
