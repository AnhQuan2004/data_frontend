import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UploadedFile, CSVData } from "@/pages/Dashboard";

interface FileUploadProps {
  onFileUpload: (file: UploadedFile, rawFile: File) => void;
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = (content: string): CSVData[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: CSVData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 5) {
        data.push({
          proj_id: values[headers.indexOf('proj_id')] || values[0] || '',
          question: values[headers.indexOf('question')] || values[1] || '',
          output: values[headers.indexOf('output')] || values[2] || '',
          updated: values[headers.indexOf('updated')] || values[3] || '',
          source: values[headers.indexOf('source')] || values[4] || '',
        });
      }
    }
    
    return data;
  };

  const checkDataQuality = (data: CSVData[]): number => {
    let issues = 0;
    
    data.forEach(row => {
      // Check for empty cells
      if (!row.proj_id || !row.question || !row.output || !row.updated || !row.source) {
        issues++;
      }
      
      // Check for questions that are too short or only contain "?"
      if (row.question.length < 10 || row.question.trim() === '?') {
        issues++;
      }
      
      // Check for missing output or contains "?" keyword
      if (!row.output || row.output.includes('?')) {
        issues++;
      }
      
      // Check date format (basic check)
      if (row.updated && !isValidDate(row.updated)) {
        issues++;
      }
    });
    
    return issues;
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const content = await file.text();
      const data = parseCSV(content);
      
      if (data.length === 0) {
        toast({
          title: "Invalid CSV format",
          description: "The CSV file appears to be empty or incorrectly formatted.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const qualityIssues = checkDataQuality(data);
      
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        uploader: "jason", // In a real app, this would come from auth
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()) : undefined,
        data,
        status: qualityIssues > 0 ? 'error' : 'success',
        qualityIssues,
      };

      onFileUpload(uploadedFile, file);
      setIsProcessing(false);
      setDescription("");
      setTags("");
      
      toast({
        title: "File uploaded successfully",
        description: `Processed ${data.length} rows with ${qualityIssues} quality issues.`,
        variant: qualityIssues > 0 ? "destructive" : "default",
      });

    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Upload failed",
        description: "Failed to process the CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
            isDragging
              ? 'border-primary bg-primary-soft'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isProcessing ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <div className="text-sm font-medium">Processing file...</div>
              <div className="text-xs text-muted-foreground">
                Analyzing data quality and structure
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
              <div className="text-sm font-medium">
                Drag and drop your CSV file here
              </div>
              <div className="text-xs text-muted-foreground">
                Supports proj_id, question, output, updated, source columns
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                Browse Files
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        {/* Additional Information */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="e.g., Q3 Research Data, User Feedback Analysis..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 h-20"
              disabled={isProcessing}
            />
          </div>
          
          <div>
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags (Optional)
            </Label>
            <Input
              id="tags"
              placeholder="e.g., research, blockchain, Q3-2024"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1"
              disabled={isProcessing}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Separate tags with commas
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};