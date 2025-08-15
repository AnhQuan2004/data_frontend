import { useState, useEffect } from "react";
import { getFiles, approveFile, rejectFile } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FileMetadata {
  proj_id: string;
  uploader: string;
  schema_version: string;
  feedback?: string;
}

interface FileItem {
  name: string;
  gcs_uri: string;
  size: number;
  updated: string;
  metadata: FileMetadata;
  status: string;
  feedback?: string;
}

const AllFiles = () => {
  const { userProfile } = useAuth();
  const [pendingFiles, setPendingFiles] = useState<FileItem[]>([]);
  const [approvedFiles, setApprovedFiles] = useState<FileItem[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<FileItem[]>([]);
  const [filteredPendingFiles, setFilteredPendingFiles] = useState<FileItem[]>([]);
  const [filteredApprovedFiles, setFilteredApprovedFiles] = useState<FileItem[]>([]);
  const [filteredRejectedFiles, setFilteredRejectedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState({ pending: true, approved: true, rejected: true });
  const [error, setError] = useState<{ pending: string | null, approved: string | null, rejected: string | null }>({ pending: null, approved: null, rejected: null });
  const [isRejecting, setIsRejecting] = useState(false);
  const [projIdFilter, setProjIdFilter] = useState("");
  const [uploaderFilter, setUploaderFilter] = useState("");
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        const [pendingData, approvedData, rejectedData] = await Promise.all([
          getFiles("pending"),
          getFiles("approved"),
          getFiles("rejected"),
        ]);
        setPendingFiles(pendingData.items || []);
        setApprovedFiles(approvedData.items || []);
        setRejectedFiles(rejectedData.items || []);
      } catch (err) {
        setError({ pending: "An error occurred", approved: "An error occurred", rejected: "An error occurred" });
      } finally {
        setLoading({ pending: false, approved: false, rejected: false });
      }
    };
    fetchAllFiles();

    const ws = new WebSocket(import.meta.env.VITE_API_URL.replace("https", "wss") + "/ws");
    ws.onmessage = () => {
      fetchAllFiles();
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const filterFiles = () => {
      const filterLogic = (file: FileItem) => {
        return (
          file.metadata.proj_id.toLowerCase().includes(projIdFilter.toLowerCase()) &&
          file.metadata.uploader.toLowerCase().includes(uploaderFilter.toLowerCase())
        );
      };
      setFilteredPendingFiles(pendingFiles.filter(filterLogic));
      setFilteredApprovedFiles(approvedFiles.filter(filterLogic));
      setFilteredRejectedFiles(rejectedFiles.filter(filterLogic));
    };
    filterFiles();
  }, [projIdFilter, uploaderFilter, pendingFiles, approvedFiles, rejectedFiles]);

  const handleApprove = async (objectName: string) => {
    try {
      await approveFile(objectName);
      const approvedFile = pendingFiles.find(f => f.name === objectName);
      if (approvedFile) {
        setPendingFiles(prev => prev.filter(f => f.name !== objectName));
        setApprovedFiles(prev => [...prev, { ...approvedFile, status: 'approved' }]);
      }
    } catch (err) { console.error(err); }
  };

  const handleReject = async () => {
    if (!currentFile || !feedback) return;
    try {
      await rejectFile(currentFile.name, feedback);
      const rejectedFile = pendingFiles.find(f => f.name === currentFile.name);
      if (rejectedFile) {
        setPendingFiles(prev => prev.filter(f => f.name !== currentFile.name));
        setRejectedFiles(prev => [...prev, { ...rejectedFile, status: 'rejected', metadata: {...rejectedFile.metadata, feedback} }]);
      }
    } catch (err) { console.error(err); }
    finally {
      setIsRejecting(false);
      setCurrentFile(null);
      setFeedback("");
    }
  };

  const renderTable = (files: FileItem[], isLoading: boolean, error: string | null, type: 'pending' | 'approved' | 'rejected') => {
    const columns = [
      { header: 'File Name', accessor: (file: FileItem) => <TableCell className="font-medium truncate" title={file.name.split('/').pop()}>{file.name.split('/').pop()}</TableCell> },
      { header: 'Project ID', accessor: (file: FileItem) => <TableCell><Badge variant="outline">{file.metadata.proj_id}</Badge></TableCell> },
      { header: 'Size', accessor: (file: FileItem) => <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell> },
      { header: 'Last Modified', accessor: (file: FileItem) => <TableCell>{new Date(file.updated).toLocaleString()}</TableCell> },
      { header: 'Uploader', accessor: (file: FileItem) => <TableCell>{file.metadata.uploader}</TableCell> },
    ];

    if (type === 'rejected') {
      columns.push({ header: 'Feedback', accessor: (file: FileItem) => <TableCell>{file.metadata.feedback}</TableCell> });
    }

    columns.push({
      header: 'Actions',
      accessor: (file: FileItem) => (
        <TableCell className="text-right space-x-2">
          {type === 'pending' && userProfile?.role === 'admin' && (
            <>
              <Button variant="outline" size="icon" onClick={() => handleApprove(file.name)} title="Approve">
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => { setCurrentFile(file); setIsRejecting(true); }} title="Reject">
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          <a href={`https://storage.googleapis.com/data_research/${file.name}`} download>
            <Button variant="ghost" size="icon" title="Download"><Download className="h-4 w-4" /></Button>
          </a>
        </TableCell>
      ),
    });

    return (
      <div className="bg-card border border-border/50 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => <TableHead key={col.header}>{col.header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-red-500">Error: {error}</TableCell>
              </TableRow>
            ) : files.length > 0 ? (
              files.map((file) => (
                <TableRow key={file.gcs_uri}>
                  {columns.map(col => col.accessor(file))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">No files found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">All Uploaded Files</h1>
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Filter by Project ID"
          value={projIdFilter}
          onChange={(e) => setProjIdFilter(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by Uploader"
          value={uploaderFilter}
          onChange={(e) => setUploaderFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {renderTable(filteredPendingFiles, loading.pending, error.pending, 'pending')}
        </TabsContent>
        <TabsContent value="approved">
          {renderTable(filteredApprovedFiles, loading.approved, error.approved, 'approved')}
        </TabsContent>
        <TabsContent value="rejected">
          {renderTable(filteredRejectedFiles, loading.rejected, error.rejected, 'rejected')}
        </TabsContent>
      </Tabs>
      <AlertDialog open={isRejecting} onOpenChange={setIsRejecting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject File</AlertDialogTitle>
            <AlertDialogDescription>Please provide a reason for rejecting the file: "{currentFile?.name.split('/').pop()}".</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="e.g., Missing required columns" />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeedback("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!feedback}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllFiles;