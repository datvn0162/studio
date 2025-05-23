
'use client';

import type React from 'react';
import { useState, useCallback, useRef } from 'react';
import type { CustomExample } from '@/ai/flows/classify-produce-image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, Image as ImageIcon, XCircle, AlertTriangle } from 'lucide-react';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '../ui/alert';

interface CustomExamplesManagerProps {
  customExamples: CustomExample[];
  onCustomExamplesChange: (examples: CustomExample[]) => void;
  isProcessing: boolean;
}

// Helper function to read file as Data URL (can be moved to utils if shared more)
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export default function CustomExamplesManager({
  customExamples,
  onCustomExamplesChange,
  isProcessing,
}: CustomExamplesManagerProps) {
  const { toast } = useToast();
  const [newLabel, setNewLabel] = useState('');
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      if (filesArray.length > 10) {
        toast({
          title: 'Too many images',
          description: 'You can select a maximum of 10 images per custom type.',
          variant: 'destructive',
        });
        setNewImageFiles(filesArray.slice(0, 10));
         if (fileInputRef.current) { // Reset to show only 10 if more were selected
            const dataTransfer = new DataTransfer();
            filesArray.slice(0, 10).forEach(file => dataTransfer.items.add(file));
            fileInputRef.current.files = dataTransfer.files;
        }
      } else {
        setNewImageFiles(filesArray);
      }
    }
  };

  const handleAddCustomType = async () => {
    if (!newLabel.trim()) {
      toast({ title: 'Label Required', description: 'Please enter a label for the custom type.', variant: 'destructive' });
      return;
    }
    if (newImageFiles.length === 0) {
      toast({ title: 'Images Required', description: 'Please select at least one image for the custom type.', variant: 'destructive' });
      return;
    }
    if (customExamples.some(ex => ex.label.toLowerCase() === newLabel.trim().toLowerCase())) {
      toast({ title: 'Label Exists', description: 'A custom type with this label already exists.', variant: 'destructive' });
      return;
    }

    try {
      const imageUris = await Promise.all(newImageFiles.map(file => readFileAsDataURL(file)));
      const newExample: CustomExample = {
        label: newLabel.trim(),
        exampleImageUris: imageUris,
      };
      onCustomExamplesChange([...customExamples, newExample]);
      toast({ title: 'Custom Type Added', description: `"${newExample.label}" has been added with ${newExample.exampleImageUris.length} image(s).` });
      setNewLabel('');
      setNewImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
    } catch (error) {
      console.error("Error adding custom type:", error);
      toast({ title: 'Error Adding Type', description: 'Could not process images. Please try again.', variant: 'destructive' });
    }
  };

  const handleRemoveCustomType = (labelToRemove: string) => {
    onCustomExamplesChange(customExamples.filter(ex => ex.label !== labelToRemove));
    toast({ title: 'Custom Type Removed', description: `"${labelToRemove}" has been removed.` });
  };

  const handleRemoveImageFromExample = (label: string, imageUriToRemove: string) => {
    const updatedExamples = customExamples
      .map(ex => {
        if (ex.label === label) {
          return {
            ...ex,
            exampleImageUris: ex.exampleImageUris.filter(uri => uri !== imageUriToRemove),
          };
        }
        return ex;
      })
      .filter(ex => ex.exampleImageUris.length > 0); // Remove type if it has no images left

    onCustomExamplesChange(updatedExamples);
    toast({ title: 'Image Removed', description: `An image has been removed from "${label}".` });
  };

  return (
    <Card className="w-full shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="text-primary" /> Define Custom Produce Types
        </CardTitle>
        <CardDescription>
          Optionally provide your own examples to help the AI classify specific produce types. 
          Each type needs a unique label and 1-10 example images (JPG, PNG).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
          <h3 className="text-lg font-medium">Add New Custom Type</h3>
          <div className="space-y-2">
            <label htmlFor="custom-type-label" className="block text-sm font-medium text-foreground">Produce Label</label>
            <Input
              id="custom-type-label"
              placeholder="e.g., Organic Fuji Apple, My Special Tomatoes"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              disabled={isProcessing}
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="custom-type-images" className="block text-sm font-medium text-foreground">
              Example Images ({newImageFiles.length} selected, max 10)
            </label>
            <Input
              id="custom-type-images"
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={isProcessing}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          {newImageFiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-2 max-h-40 overflow-y-auto border p-2 rounded-md">
              {newImageFiles.map((file, index) => (
                <div key={index} className="relative aspect-square group">
                  <NextImage
                    src={URL.createObjectURL(file)} // Create temporary URL for preview
                    alt={`Preview ${file.name}`}
                    fill
                    sizes="100px"
                    className="rounded-md object-cover shadow-sm"
                    onLoad={(e) => {
                      // Revoke object URL after image loads to free memory for previews,
                      // but be careful if this causes issues with re-renders.
                      // For a short-lived preview list, this might be okay.
                      // URL.revokeObjectURL((e.target as HTMLImageElement).src);
                    }}
                    data-ai-hint="custom example preview"
                  />
                </div>
              ))}
            </div>
          )}
          <Button onClick={handleAddCustomType} disabled={isProcessing || !newLabel.trim() || newImageFiles.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Type
          </Button>
        </div>

        {customExamples.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Currently Defined Custom Types ({customExamples.length})</h3>
            <div className="space-y-6">
              {customExamples.map((example) => (
                <Card key={example.label} className="bg-card shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl">{example.label}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCustomType(example.label)}
                      disabled={isProcessing}
                      aria-label={`Remove custom type ${example.label}`}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {example.exampleImageUris.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {example.exampleImageUris.map((uri, index) => (
                          <div key={index} className="relative group aspect-square">
                            <NextImage
                              src={uri}
                              alt={`${example.label} example ${index + 1}`}
                              fill
                              sizes="150px"
                              className="rounded-md object-cover border"
                              data-ai-hint="custom example"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive"
                              onClick={() => handleRemoveImageFromExample(example.label, uri)}
                              disabled={isProcessing}
                              aria-label="Remove image from custom type"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No images for this type (will be removed if not updated).</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
         {customExamples.length === 0 && (
            <Alert variant="default" className="border-primary/30 bg-primary/5">
              <ImageIcon className="h-5 w-5 text-primary" />
              {/* <AlertTitle>No Custom Types Defined</AlertTitle> */}
              <AlertDescription className="text-foreground/80">
                You haven't defined any custom produce types yet. Adding examples can help the AI better recognize specific varieties you work with.
              </AlertDescription>
            </Alert>
        )}
      </CardContent>
       {customExamples.length > 0 && (
         <CardFooter>
            <Alert variant="default" className="w-full border-accent/30 bg-accent/5 text-accent-foreground">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <AlertDescription className="text-foreground/80">
                Custom examples are used for the current session to guide classification. They are not permanently stored or used for retraining the base AI model.
              </AlertDescription>
            </Alert>
         </CardFooter>
       )}
    </Card>
  );
}
