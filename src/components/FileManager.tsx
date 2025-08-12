import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Calendar,
  User,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import type { UploadedFile } from "@/pages/Index";

interface FileManagerProps {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  onFileDelete: (fileId: string) => void;
}

export const FileManager = ({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onFileDelete 
}: FileManagerProps) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (file: UploadedFile) => {
    if (file.qualityIssues > 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          {file.qualityIssues} issues
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs bg-success/10 text-success">
        Clean
      </Badge>
    );
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            File Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          File Manager
          <Badge variant="secondary" className="ml-auto text-xs">
            {files.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className={`border rounded-lg p-3 transition-all duration-200 cursor-pointer hover:shadow-medium ${
              selectedFile?.id === file.id
                ? 'border-primary bg-primary-soft shadow-medium'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onFileSelect(file)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.data.length} rows
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {getStatusIcon(file.status)}
                {getStatusBadge(file)}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {file.uploader}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(file.uploadDate)}
              </div>
            </div>

            {file.description && (
              <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {file.description}
              </div>
            )}

            {file.tags && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {file.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(file);
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  // In a real app, this would trigger a download
                  console.log('Download file:', file.name);
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDelete(file.id);
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};