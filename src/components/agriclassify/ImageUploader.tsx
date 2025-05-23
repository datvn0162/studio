'use client';

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, XCircle, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image'; // Renamed to avoid conflict with ImageIcon

export interface ImageFileWithPreview extends File {
  id: string;
  preview: string;
}

interface ImageUploaderProps {
  onFilesSelected: (files: ImageFileWithPreview[]) => void;
  onClearFiles: () => void;
  isProcessing: boolean;
  triggerClassification: () => void;
  selectedFileCount: number;
}

export default function ImageUploader({
  onFilesSelected,
  onClearFiles,
  isProcessing,
  triggerClassification,
  selectedFileCount
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<ImageFileWithPreview[]>([]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageFiles: ImageFileWithPreview[] = Array.from(files)
        .filter(file => file.type.startsWith('image/')) // Basic client-side validation
        .map(file => {
          const id = `${file.name}-${file.lastModified}-${file.size}`;
          return Object.assign(file, { id, preview: URL.createObjectURL(file) });
        });
      setCurrentFiles(prev => [...prev, ...newImageFiles]);
    }
  }, []);
  
  useEffect(() => {
    onFilesSelected(currentFiles);
    // Cleanup preview URLs
    return () => {
      currentFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFiles]); // onFilesSelected should be stable if defined in parent with useCallback

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const files = event.dataTransfer.files;
      const newImageFiles: ImageFileWithPreview[] = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => {
          const id = `${file.name}-${file.lastModified}-${file.size}`;
          return Object.assign(file, { id, preview: URL.createObjectURL(file) });
        });
      setCurrentFiles(prev => [...prev, ...newImageFiles]);
    }
  }, []);

  const handleDragEvent = (event: React.DragEvent<HTMLDivElement>, isActive: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(isActive);
  };

  const removeFile = (fileId: string) => {
    const fileToRemove = currentFiles.find(f => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setCurrentFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  };
  
  const clearAllFiles = () => {
    currentFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setCurrentFiles([]);
    onClearFiles(); // Notify parent
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="text-primary" /> Upload Produce Images
        </CardTitle>
        <CardDescription>
          Select one or more images (JPG, PNG) of agricultural products for classification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          onDragEnter={(e) => handleDragEvent(e, true)}
          onDragLeave={(e) => handleDragEvent(e, false)}
          onDragOver={(e) => handleDragEvent(e, true)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
        >
          <Input
            id="file-upload"
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <UploadCloud className={`h-12 w-12 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-muted-foreground">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
          </label>
        </div>

        {currentFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Selected Images ({currentFiles.length}):</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto p-2 rounded-md border">
              {currentFiles.map((file) => (
                <div key={file.id} className="relative group aspect-square">
                  <NextImage
                    src={file.preview}
                    alt={file.name}
                    width={150}
                    height={150}
                    className="rounded-md object-cover w-full h-full shadow-sm"
                    data-ai-hint="uploaded produce"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive"
                    onClick={() => removeFile(file.id)}
                    aria-label="Remove image"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b-md">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
             <Button variant="outline" onClick={clearAllFiles} disabled={isProcessing}>
              Clear All Images
            </Button>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            onClick={triggerClassification}
            disabled={selectedFileCount === 0 || isProcessing}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isProcessing ? 'Processing...' : `Classify ${selectedFileCount > 0 ? selectedFileCount : ''} Image${selectedFileCount !== 1 ? 's' : ''}`}
            {isProcessing && <UploadCloud className="ml-2 h-5 w-5 animate-pulse" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}