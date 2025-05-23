
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Leaf, AlertTriangle, CheckCircle2, ImageIcon, Loader2, HelpCircle } from 'lucide-react';

interface ClassificationResultCardProps {
  imagePreviewUrl: string;
  imageName: string;
  isProduce?: boolean;
  productName?: string;
  confidenceScore?: number;
  error?: string;
  isLoading: boolean;
}

export default function ClassificationResultCard({
  imagePreviewUrl,
  imageName,
  isProduce,
  productName,
  confidenceScore,
  error,
  isLoading,
}: ClassificationResultCardProps) {
  
  const displayConfidence = confidenceScore !== undefined ? Math.round(confidenceScore * 100) : 0;

  return (
    <Card className="w-full overflow-hidden shadow-lg transition-all hover:shadow-xl flex flex-col h-full">
      <CardHeader className="p-4">
        <div className="aspect-video relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {isLoading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-2" />
                <p className="text-sm text-foreground">Đang phân loại...</p>
              </div>
          ) : null}
          <Image
            src={imagePreviewUrl}
            alt={imageName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'}`}
            data-ai-hint="classified produce"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1 truncate" title={imageName}>
          {imageName}
        </CardTitle>
        
        {isLoading ? (
          null // Loader is primarily in the image overlay, content area shows nothing extra or a small text
        ) : error ? (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lỗi phân loại</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        ) : isProduce === false ? (
          <Alert variant="default" className="mt-2 bg-accent/10 border-accent/30 text-accent-foreground dark:bg-accent/20 dark:border-accent/40 dark:text-accent-foreground">
            <HelpCircle className="h-4 w-4 text-accent" />
            <AlertTitle>Không phải nông sản</AlertTitle>
            <AlertDescription className="text-xs">
              {productName || "Hình ảnh này không được xác định là một loại nông sản."}
            </AlertDescription>
          </Alert>
        ) : isProduce === true && productName ? (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              <p className="text-xl font-semibold text-foreground">{productName}</p>
            </div>
             {confidenceScore !== undefined && (
              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Độ tin cậy</span>
                  <span>{displayConfidence}%</span>
                </div>
                <Progress value={displayConfidence} aria-label={`Độ tin cậy: ${displayConfidence}%`} className="h-2 [&>div]:bg-primary" />
              </div>
            )}
          </div>
        ) : ( 
           <div className="text-center py-4 text-muted-foreground">
            <ImageIcon className="mx-auto h-8 w-8 mb-2" />
            <p>Chờ phân loại.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-muted/50">
        {isLoading ? (
          <Badge variant="outline" className="bg-transparent border-accent text-accent">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Đang xử lý
          </Badge>
        ) : error ? (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Thất bại
          </Badge>
        ) : isProduce === false ? (
          <Badge variant="outline" className="border-accent text-accent bg-accent/10">
            <HelpCircle className="mr-1 h-3 w-3" />
            Không phải nông sản
          </Badge>
        ) : isProduce === true && productName ? (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Đã phân loại
          </Badge>
        ) : (
           <Badge variant="outline">Đang chờ</Badge>
        )}
      </CardFooter>
    </Card>
  );
}

