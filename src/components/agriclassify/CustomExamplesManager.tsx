
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
          title: 'Quá nhiều ảnh',
          description: 'Bạn có thể chọn tối đa 10 ảnh cho mỗi loại tùy chỉnh.',
          variant: 'destructive',
        });
        setNewImageFiles(filesArray.slice(0, 10));
         if (fileInputRef.current) { 
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
      toast({ title: 'Yêu cầu nhãn', description: 'Vui lòng nhập nhãn cho loại tùy chỉnh.', variant: 'destructive' });
      return;
    }
    if (newImageFiles.length === 0) {
      toast({ title: 'Yêu cầu ảnh', description: 'Vui lòng chọn ít nhất một ảnh cho loại tùy chỉnh.', variant: 'destructive' });
      return;
    }
    if (customExamples.some(ex => ex.label.toLowerCase() === newLabel.trim().toLowerCase())) {
      toast({ title: 'Nhãn đã tồn tại', description: 'Một loại tùy chỉnh với nhãn này đã tồn tại.', variant: 'destructive' });
      return;
    }

    try {
      const imageUris = await Promise.all(newImageFiles.map(file => readFileAsDataURL(file)));
      const newExample: CustomExample = {
        label: newLabel.trim(),
        exampleImageUris: imageUris,
      };
      onCustomExamplesChange([...customExamples, newExample]);
      toast({ title: 'Đã thêm loại tùy chỉnh', description: `"${newExample.label}" đã được thêm với ${newExample.exampleImageUris.length} ảnh.` });
      setNewLabel('');
      setNewImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
      }
    } catch (error) {
      console.error("Lỗi khi thêm loại tùy chỉnh:", error);
      toast({ title: 'Lỗi thêm loại', description: 'Không thể xử lý ảnh. Vui lòng thử lại.', variant: 'destructive' });
    }
  };

  const handleRemoveCustomType = (labelToRemove: string) => {
    onCustomExamplesChange(customExamples.filter(ex => ex.label !== labelToRemove));
    toast({ title: 'Đã xóa loại tùy chỉnh', description: `"${labelToRemove}" đã được xóa.` });
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
      .filter(ex => ex.exampleImageUris.length > 0); 

    onCustomExamplesChange(updatedExamples);
    toast({ title: 'Đã xóa ảnh', description: `Một ảnh đã được xóa khỏi "${label}".` });
  };

  return (
    <Card className="w-full shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="text-primary" /> Định nghĩa các loại nông sản tùy chỉnh
        </CardTitle>
        <CardDescription>
          Tùy chọn cung cấp các ví dụ của riêng bạn để giúp AI phân loại các loại nông sản cụ thể.
          Mỗi loại cần một nhãn duy nhất và 1-10 ảnh ví dụ (JPG, PNG).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
          <h3 className="text-lg font-medium">Thêm loại tùy chỉnh mới</h3>
          <div className="space-y-2">
            <label htmlFor="custom-type-label" className="block text-sm font-medium text-foreground">Nhãn nông sản</label>
            <Input
              id="custom-type-label"
              placeholder="VD: Xoài Cát Chu loại 1, Cà chua đặc biệt"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              disabled={isProcessing}
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="custom-type-images" className="block text-sm font-medium text-foreground">
              Ảnh ví dụ ({newImageFiles.length} đã chọn, tối đa 10)
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
                    src={URL.createObjectURL(file)} 
                    alt={`Xem trước ${file.name}`}
                    fill
                    sizes="100px"
                    className="rounded-md object-cover shadow-sm"
                    data-ai-hint="custom example preview"
                  />
                </div>
              ))}
            </div>
          )}
          <Button onClick={handleAddCustomType} disabled={isProcessing || !newLabel.trim() || newImageFiles.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm loại tùy chỉnh
          </Button>
        </div>

        {customExamples.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Các loại tùy chỉnh hiện tại ({customExamples.length})</h3>
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
                      aria-label={`Xóa loại tùy chỉnh ${example.label}`}
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
                              alt={`${example.label} ví dụ ${index + 1}`}
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
                              aria-label="Xóa ảnh khỏi loại tùy chỉnh"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Không có ảnh cho loại này (sẽ bị xóa nếu không cập nhật).</p>
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
              <AlertDescription className="text-foreground/80">
                Bạn chưa định nghĩa loại nông sản tùy chỉnh nào. Việc thêm ví dụ có thể giúp AI nhận diện tốt hơn các giống cụ thể mà bạn làm việc.
              </AlertDescription>
            </Alert>
        )}
      </CardContent>
       {customExamples.length > 0 && (
         <CardFooter>
            <Alert variant="default" className="w-full border-accent/30 bg-accent/5 text-accent-foreground">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <AlertDescription className="text-foreground/80">
                Các ví dụ tùy chỉnh được sử dụng cho phiên làm việc hiện tại để hướng dẫn phân loại. Chúng không được lưu trữ vĩnh viễn hoặc dùng để huấn luyện lại mô hình AI cơ sở.
              </AlertDescription>
            </Alert>
         </CardFooter>
       )}
    </Card>
  );
}
