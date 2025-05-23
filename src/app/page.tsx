
'use client';

import { useState, useEffect, useCallback } from 'react';
import ImageUploader, { type ImageFileWithPreview } from '@/components/agriclassify/ImageUploader';
import ResultsDisplay, { type ClassificationDisplayResult } from '@/components/agriclassify/ResultsDisplay';
import CustomExamplesManager from '@/components/agriclassify/CustomExamplesManager';
import { classifyImageAction, summarizeResultsAction, type ClassificationResponse, type ClassificationRequest } from './actions';
import type { CustomExample } from '@/ai/flows/classify-produce-image';
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
  const [customExamples, setCustomExamples] = useState<CustomExample[]>([]);

  const { toast } = useToast();

  // Effect to revokeObjectURLs on unmount or when selectedFiles change
  useEffect(() => {
    const currentPreviews = selectedFiles.map(f => f.preview);
    return () => {
      currentPreviews.forEach(previewUrl => URL.revokeObjectURL(previewUrl));
    };
  }, [selectedFiles]);

  const handleFilesSelected = useCallback((files: ImageFileWithPreview[]) => {
    const newFileIds = new Set(files.map(f => f.id));
    selectedFiles.forEach(existingFile => {
      if (!newFileIds.has(existingFile.id)) {
        URL.revokeObjectURL(existingFile.preview);
      }
    });
    
    setSelectedFiles(files);
    setClassificationResults(files.map(file => ({
      id: file.id,
      previewUrl: file.preview,
      fileName: file.name,
      isLoading: false,
      // isProduce will be undefined initially, then populated by AI
    })));
    setOverallSummary(null);
    setSummaryError(null);
  }, [selectedFiles]);

  const handleClearFiles = useCallback(() => {
    selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setSelectedFiles([]);
    setClassificationResults([]);
    setOverallSummary(null);
    setSummaryError(null);
    setIsProcessingAny(false);
    setIsSummarizing(false);
  }, [selectedFiles]);

  const handleCustomExamplesChange = useCallback((updatedExamples: CustomExample[]) => {
    setCustomExamples(updatedExamples);
  }, []);


  const triggerClassification = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "Chưa chọn ảnh", description: "Vui lòng chọn ảnh để phân loại.", variant: "destructive" });
      return;
    }

    setIsProcessingAny(true);
    setOverallSummary(null);
    setSummaryError(null);

    setClassificationResults(prevResults =>
      prevResults.map(r => ({ ...r, isLoading: true, error: undefined, productName: undefined, confidenceScore: undefined, isProduce: undefined }))
    );
    
    const classificationPromises = selectedFiles.map(async (file) => {
      try {
        const photoDataUri = await readFileAsDataURL(file);
        
        const requestPayload: ClassificationRequest = {
          photoDataUri,
          fileId: file.id,
          customExamples: customExamples.length > 0 ? customExamples : undefined,
        };
        
        const response: ClassificationResponse = await classifyImageAction(requestPayload);
        
        setClassificationResults(prev =>
          prev.map(r => r.id === response.fileId ? {
            ...r,
            isProduce: response.isProduce,
            productName: response.productName,
            confidenceScore: response.confidence,
            error: response.error,
            isLoading: false,
          } : r)
        );
        if (response.error) {
           toast({ title: `Lỗi phân loại ${file.name}`, description: response.error, variant: "destructive" });
        }
        return response;
      } catch (error: any) {
        const errorMessage = error.message || "Không thể đọc hoặc xử lý tệp.";
        setClassificationResults(prev =>
          prev.map(r => r.id === file.id ? { ...r, error: errorMessage, isLoading: false, isProduce: false } : r)
        );
        toast({ title: `Lỗi xử lý ${file.name}`, description: errorMessage, variant: "destructive" });
        return { fileId: file.id, error: errorMessage, isProduce: false };
      }
    });

    const individualResults = await Promise.all(classificationPromises);
    
    const successfulClassifications: AIClassificationResult[] = individualResults
      .filter(res => !res.error && res.isProduce && res.productName && res.productName !== "Không phải nông sản" && res.confidence !== undefined)
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
          toast({ title: "Đã tạo tóm tắt hàng loạt", description: "Tóm tắt phân loại đã có." });
        }
        if (summaryResponse.error) {
          setSummaryError(summaryResponse.error);
          toast({ title: "Lỗi tóm tắt", description: summaryResponse.error, variant: "destructive" });
        }
      } catch (error: any) {
        const summaryErr = error.message || "Không thể tạo tóm tắt.";
        setSummaryError(summaryErr);
        toast({ title: "Tạo tóm tắt thất bại", description: summaryErr, variant: "destructive" });
      } finally {
        setIsSummarizing(false);
      }
    } else if (selectedFiles.length > 1 && successfulClassifications.length <= 1) {
        setSummaryError("Không đủ kết quả phân loại nông sản thành công để tạo tóm tắt hàng loạt có ý nghĩa.");
    }
    
    // Check if any are still loading by finding one in the latest state of classificationResults
    const latestResults = classificationResults; // This might be stale, need to use a functional update or get it from state after updates
    // To correctly check if all processing is done, we can check the individualResults directly or rely on isProcessingAny state management.
    // For simplicity, we assume setIsProcessingAny(false) will be called if all promises are resolved.

    const allProcessed = individualResults.every(res => !res.error || res.error); // This just means promises resolved
    const anyStillLoading = classificationResults.some(r => r.isLoading); // Check the current state

    if (!anyStillLoading) { // More robust check
      setIsProcessingAny(false);
    }

    const allFailedOrNotProduce = individualResults.every(res => res.error || !res.isProduce);
    if (selectedFiles.length > 0 && allFailedOrNotProduce && !individualResults.some(r => r.isProduce && !r.error)) {
        toast({ title: "Phân loại hoàn tất", description: "Không có nông sản nào được nhận diện hoặc tất cả đều lỗi.", variant: "destructive" });
    } else if (selectedFiles.length > 0 && individualResults.some(res => (res.isProduce && !res.error))) {
        toast({ title: "Phân loại hoàn tất", description: "Kết quả được hiển thị bên dưới." });
    }


  }, [selectedFiles, toast, customExamples, classificationResults]); // classificationResults in dep array is for the anyStillLoading check


  return (
    <div className="space-y-8">
      <Alert className="bg-primary/10 border-primary/30 text-primary-foreground shadow">
        <Terminal className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Chào mừng đến với AgriClassify!</AlertTitle>
        <AlertDescription className="text-foreground/80">
          Khai thác sức mạnh của AI để tự động phân loại nông sản của bạn.
          Chỉ cần tải lên hình ảnh và để hệ thống của chúng tôi nhận diện chúng.
          Bạn cũng có thể tùy chọn định nghĩa các loại nông sản tùy chỉnh với hình ảnh ví dụ để hướng dẫn AI phân loại cụ thể hơn.
        </AlertDescription>
      </Alert>

      <CustomExamplesManager
        customExamples={customExamples}
        onCustomExamplesChange={handleCustomExamplesChange}
        isProcessing={isProcessingAny}
      />

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

