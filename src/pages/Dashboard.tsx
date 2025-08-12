import { useState } from "react";
import { FileUp, Inbox } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { DataPreview } from "@/components/DataPreview";
import { FileManager } from "@/components/FileManager";
import { QualityCheck } from "@/components/QualityCheck";

export interface CSVData {
  proj_id: string;
  question: string;
  output: string;
  updated: string;
  source: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  uploader: string;
  description?: string;
  tags?: string[];
  data: CSVData[];
  status: 'processing' | 'success' | 'error';
  qualityIssues: number;
  rawFile?: File;
}

const Dashboard = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  const handleFileUpload = (file: UploadedFile, rawFile: File) => {
    const newFile = { ...file, rawFile };
    setUploadedFiles(prev => [...prev, newFile]);
    setSelectedFile(newFile);
  };

  const handleFileSelect = (file: UploadedFile) => {
    setSelectedFile(file);
  };

  const handleFileDelete = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedFile.rawFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile.rawFile);
    formData.append("proj_id", "solana");
    formData.append("uploader", "jason");

    try {
      const response = await fetch("https://data-research-team-1094890588015.us-central1.run.app/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("API upload failed");
      }

      // Handle successful upload
      alert("File uploaded successfully!");

    } catch (error) {
      console.error("API upload error:", error);
      alert("File upload failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Upload & File Management */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <FileUpload onFileUpload={handleFileUpload} />
            <FileManager
              files={uploadedFiles}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {selectedFile && (
              <>
                <QualityCheck file={selectedFile} />
                <DataPreview file={selectedFile} />
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSubmit}>Submit</Button>
                </div>
              </>
            )}
            
            {!selectedFile && uploadedFiles.length === 0 && (
              <div className="bg-card border border-border/50 rounded-lg p-12 text-center animate-fade-in">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 bg-primary-soft rounded-full flex items-center justify-center animate-pulse-soft">
                    <Inbox className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-card-foreground mb-2">
                    Your Data Hub is Empty
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Upload your first CSV file to begin analyzing, transforming, and collaborating on your data.
                  </p>
                  <div className="text-xs text-muted-foreground/80">
                    Supported columns: proj_id, question, output, updated, source
                  </div>
                </div>
              </div>
            )}

            {!selectedFile && uploadedFiles.length > 0 && (
              <div className="bg-card border border-border/50 rounded-lg p-8 text-center animate-fade-in">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  Select a file to preview
                </h3>
                <p className="text-muted-foreground">
                  Choose a file from the sidebar to view its data and quality metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;