'use client';

import { useState, useEffect, useCallback } from 'react';
import ImageUploader, { type ImageFileWithPreview } from '@/components/agriclassify/ImageUploader';
import ResultsDisplay, { type ClassificationDisplayResult } from '@/components/agriclassify/ResultsDisplay';
import { classifyImageAction, summarizeResultsAction, type ClassificationResponse } from './actions';
import type { ClassificationResult as AIClassificationResult } from '@/ai/flows/summarize-classification-results';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Helper function to read file as Data URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export default function AgriClassifyPage() {
  const [selectedFiles, setSelectedFiles] = useState<ImageFileWithPreview[]>([]);
  const [classificationResults, setClassificationResults] = useState<ClassificationDisplayResult[]>([]);
  const [overallSummary, setOverallSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isProcessingAny, setIsProcessingAny] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const { toast } = useToast();

  // Effect to revokeObjectURLs on unmount or when selectedFiles change
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [selectedFiles]);

  const handleFilesSelected = useCallback((files: ImageFileWithPreview[]) => {
    // Revoke URLs for files that are no longer in the selection
    selectedFiles.forEach(existingFile => {
      if (!files.find(newFile => newFile.id === existingFile.id)) {
        URL.revokeObjectURL(existingFile.preview);
      }
    });
    
    setSelectedFiles(files);
    // Initialize/update classificationResults based on new selection
    setClassificationResults(files.map(file => ({
      id: file.id,
      previewUrl: file.preview,
      fileName: file.name,
      isLoading: false,
    })));
    setOverallSummary(null); // Clear previous summary
    setSummaryError(null);
  }, [selectedFiles]); // Include selectedFiles to properly manage URL revocation

  const handleClearFiles = useCallback(() => {
    selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setSelectedFiles([]);
    setClassificationResults([]);
    setOverallSummary(null);
    setSummaryError(null);
    setIsProcessingAny(false);
    setIsSummarizing(false);
  }, [selectedFiles]);


  const triggerClassification = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "No Images Selected", description: "Please select images to classify.", variant: "destructive" });
      return;
    }

    setIsProcessingAny(true);
    setOverallSummary(null);
    setSummaryError(null);

    // Set all to loading initially
    setClassificationResults(prevResults =>
      prevResults.map(r => ({ ...r, isLoading: true, error: undefined, productName: undefined, confidenceScore: undefined }))
    );
    
    const classificationPromises = selectedFiles.map(async (file) => {
      try {
        const photoDataUri = await readFileAsDataURL(file);
        const response: ClassificationResponse = await classifyImageAction({ photoDataUri, fileId: file.id });
        
        // Update specific result
        setClassificationResults(prev =>
          prev.map(r => r.id === response.fileId ? {
            ...r,
            productName: response.productName,
            confidenceScore: response.confidence,
            error: response.error,
            isLoading: false,
          } : r)
        );
        if (response.error) {
           toast({ title: `Error classifying ${file.name}`, description: response.error, variant: "destructive" });
        }
        return response; // Return for summary processing
      } catch (error: any) {
        const errorMessage = error.message || "Failed to read or process file.";
        setClassificationResults(prev =>
          prev.map(r => r.id === file.id ? { ...r, error: errorMessage, isLoading: false } : r)
        );
        toast({ title: `Error processing ${file.name}`, description: errorMessage, variant: "destructive" });
        return { fileId: file.id, error: errorMessage }; // Ensure it returns something for the summary part
      }
    });

    const individualResults = await Promise.all(classificationPromises);
    
    // Prepare data for summary
    const successfulClassifications: AIClassificationResult[] = individualResults
      .filter(res => !res.error && res.productName && res.confidence !== undefined)
      .map(res => ({
        productName: res.productName!,
        confidenceScore: res.confidence!,
      }));

    if (successfulClassifications.length > 1) {
      setIsSummarizing(true);
      try {
        const summaryResponse = await summarizeResultsAction(successfulClassifications);
        if (summaryResponse.summary) {
          setOverallSummary(summaryResponse.summary);
          toast({ title: "Batch Summary Generated", description: "Classification summary is available." });
        }
        if (summaryResponse.error) {
          setSummaryError(summaryResponse.error);
          toast({ title: "Summary Error", description: summaryResponse.error, variant: "destructive" });
        }
      } catch (error: any) {
        const summaryErr = error.message || "Failed to generate summary.";
        setSummaryError(summaryErr);
        toast({ title: "Summary Generation Failed", description: summaryErr, variant: "destructive" });
      } finally {
        setIsSummarizing(false);
      }
    } else if (selectedFiles.length > 1 && successfulClassifications.length <= 1) {
        setSummaryError("Not enough successful classifications to generate a meaningful batch summary.");
    }
    
    // Check if any are still processing (shouldn't be, but as a safeguard)
    const anyStillLoading = classificationResults.some(r => r.isLoading);
    if (!anyStillLoading) {
      setIsProcessingAny(false);
    }

    const allFailed = individualResults.every(res => res.error);
    if (selectedFiles.length > 0 && allFailed) {
        toast({ title: "All Classifications Failed", description: "Please check the images or try again later.", variant: "destructive" });
    } else if (selectedFiles.length > 0 && !allFailed && individualResults.some(res => !res.error)) {
        toast({ title: "Classification Complete", description: "Results are displayed below." });
    }


  }, [selectedFiles, toast]);


  return (
    <div className="space-y-8">
      <Alert className="bg-primary/10 border-primary/30 text-primary-foreground shadow">
        <Terminal className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Welcome to AgriClassify!</AlertTitle>
        <AlertDescription className="text-foreground/80">
          Leverage the power of AI to automatically classify your agricultural produce. 
          Simply upload images and let our system identify them for you. 
          This demo showcases integration with GenAI for intelligent image analysis.
        </AlertDescription>
      </Alert>

      <ImageUploader
        onFilesSelected={handleFilesSelected}
        onClearFiles={handleClearFiles}
        isProcessing={isProcessingAny}
        triggerClassification={triggerClassification}
        selectedFileCount={selectedFiles.length}
      />
      <ResultsDisplay 
        results={classificationResults} 
        summary={overallSummary}
        summaryError={summaryError}
        isSummarizing={isSummarizing}
      />
    </div>
  );
}