'use client';

import ClassificationResultCard from './ClassificationResultCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertCircle, CheckSquare, Info, ListChecks } from 'lucide-react';

export interface ClassificationDisplayResult {
  id: string;
  previewUrl: string;
  fileName: string;
  productName?: string;
  confidenceScore?: number;
  error?: string;
  isLoading: boolean;
}

interface ResultsDisplayProps {
  results: ClassificationDisplayResult[];
  summary?: string | null;
  summaryError?: string | null;
  isSummarizing?: boolean;
}

export default function ResultsDisplay({ results, summary, summaryError, isSummarizing }: ResultsDisplayProps) {
  if (results.length === 0) {
    return (
      <Card className="mt-8 w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Info className="text-primary"/> Kết quả phân loại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Tải ảnh lên để xem kết quả phân loại tại đây.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasMultipleResults = results.length > 1;

  return (
    <div className="mt-8 space-y-6">
      {hasMultipleResults && (summary || summaryError || isSummarizing) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="text-primary" /> Tóm tắt hàng loạt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSummarizing && <p className="text-muted-foreground italic">Đang tạo tóm tắt...</p>}
            {summaryError && !isSummarizing && (
              <p className="text-destructive">
                <AlertCircle className="inline mr-2 h-4 w-4" /> 
                Lỗi tạo tóm tắt: {summaryError}
              </p>
            )}
            {summary && !isSummarizing && <p className="text-foreground whitespace-pre-wrap">{summary}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="text-primary"/> Phân loại từng ảnh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
              {results.map((result) => (
                <ClassificationResultCard
                  key={result.id}
                  imagePreviewUrl={result.previewUrl}
                  imageName={result.fileName}
                  productName={result.productName}
                  confidenceScore={result.confidenceScore}
                  error={result.error}
                  isLoading={result.isLoading}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
