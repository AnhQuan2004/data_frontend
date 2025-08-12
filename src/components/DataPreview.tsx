import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import type { UploadedFile, CSVData } from "@/pages/Index";

interface DataPreviewProps {
  file: UploadedFile;
}

type SortField = keyof CSVData;
type SortDirection = 'asc' | 'desc' | null;

export const DataPreview = ({ file }: DataPreviewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [projIdFilter, setProjIdFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get unique values for filters
  const uniqueProjIds = useMemo(() => {
    return [...new Set(file.data.map(row => row.proj_id).filter(Boolean))];
  }, [file.data]);

  const uniqueSources = useMemo(() => {
    return [...new Set(file.data.map(row => row.source).filter(Boolean))];
  }, [file.data]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = file.data;

    // Text search in question and output
    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.output.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Project ID filter
    if (projIdFilter) {
      filtered = filtered.filter(row => row.proj_id === projIdFilter);
    }

    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(row => row.source === sourceFilter);
    }

    // Sort data
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        // Special handling for dates
        if (sortField === 'updated') {
          const aDate = new Date(aVal).getTime();
          const bDate = new Date(bVal).getTime();
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }
        
        // String comparison
        const result = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? result : -result;
      });
    }

    return filtered;
  }, [file.data, searchTerm, projIdFilter, sourceFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 text-primary" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4 text-primary" />;
    return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
  };

  const getProjIdBadge = (projId: string) => {
    const color = projId.toLowerCase().includes('solana') 
      ? 'bg-solana text-solana-foreground'
      : projId.toLowerCase().includes('ethereum')
      ? 'bg-ethereum text-ethereum-foreground'
      : 'bg-primary text-primary-foreground';
    
    return <Badge className={`${color} text-xs`}>{projId}</Badge>;
  };

  const getSourceIcon = (source: string) => {
    // You could map different sources to different icons
    return <ExternalLink className="w-3 h-3 text-muted-foreground" />;
  };

  const hasDataQualityIssue = (row: CSVData) => {
    return !row.proj_id || !row.question || !row.output || !row.updated || !row.source ||
           row.question.length < 10 || row.question.trim() === '?' ||
           row.output.includes('?') || !isValidDate(row.updated);
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setProjIdFilter("");
    setSourceFilter("");
    setSortField(null);
    setSortDirection(null);
    setCurrentPage(1);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Data Preview
            <Badge variant="secondary" className="text-xs">
              {filteredData.length} of {file.data.length} rows
            </Badge>
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            {file.name}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search questions and outputs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          <Select value={projIdFilter} onValueChange={(value) => {
            setProjIdFilter(value === "all" ? "" : value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Project ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjIds.map(projId => (
                <SelectItem key={projId} value={projId}>{projId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sourceFilter} onValueChange={(value) => {
            setSourceFilter(value === "all" ? "" : value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {uniqueSources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>

        {/* Data Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[120px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('proj_id')}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Project ID
                      {getSortIcon('proj_id')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('question')}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Question
                      {getSortIcon('question')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('output')}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Output
                      {getSortIcon('output')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('updated')}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Updated
                      {getSortIcon('updated')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('source')}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Source
                      {getSortIcon('source')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => {
                  const hasIssue = hasDataQualityIssue(row);
                  
                  return (
                    <TableRow 
                      key={index}
                      className={`hover:bg-muted/50 ${hasIssue ? 'bg-destructive/5' : ''}`}
                    >
                      <TableCell className="align-top">
                        <div className="flex items-center gap-2">
                          {getProjIdBadge(row.proj_id)}
                          {hasIssue && <AlertTriangle className="w-3 h-3 text-destructive" />}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="max-w-xs">
                          <div className={`text-sm line-clamp-3 ${
                            row.question.length < 10 || row.question.trim() === '?' 
                              ? 'text-destructive' 
                              : ''
                          }`}>
                            {row.question || <span className="text-muted-foreground italic">Empty</span>}
                          </div>
                          {row.question.length > 100 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 mt-1 text-xs"
                              title="View full question"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="max-w-xs">
                          <div className={`text-sm line-clamp-3 ${
                            !row.output || row.output.includes('?') 
                              ? 'text-warning' 
                              : ''
                          }`}>
                            {row.output || <span className="text-muted-foreground italic">Empty</span>}
                          </div>
                          {row.output && row.output.includes('?') && (
                            <Badge variant="outline" className="text-xs mt-1 text-warning border-warning">
                              Needs Review
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className={`text-sm ${
                          !isValidDate(row.updated) ? 'text-destructive' : ''
                        }`}>
                          {row.updated ? formatDate(row.updated) : 
                            <span className="text-muted-foreground italic">Empty</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-1 text-sm">
                          {getSourceIcon(row.source)}
                          <span className={!row.source ? 'text-muted-foreground italic' : ''}>
                            {row.source || 'Empty'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="Add comment"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            title="Mark as approved"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} rows
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};