import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Calendar,
  MessageSquare
} from "lucide-react";
import type { UploadedFile, CSVData } from "@/pages/Index";

interface QualityCheckProps {
  file: UploadedFile;
}

interface QualityIssue {
  type: 'empty_cell' | 'invalid_date' | 'short_question' | 'missing_output' | 'questionmark_output';
  message: string;
  rowIndex: number;
  column: string;
}

export const QualityCheck = ({ file }: QualityCheckProps) => {
  const analyzeQuality = (data: CSVData[]): QualityIssue[] => {
    const issues: QualityIssue[] = [];
    
    data.forEach((row, index) => {
      // Check for empty cells
      Object.entries(row).forEach(([key, value]) => {
        if (!value || value.trim() === '') {
          issues.push({
            type: 'empty_cell',
            message: `Empty ${key} field`,
            rowIndex: index + 2, // +2 because CSV has header and is 1-indexed
            column: key
          });
        }
      });
      
      // Check for invalid dates
      if (row.updated && !isValidDate(row.updated)) {
        issues.push({
          type: 'invalid_date',
          message: `Invalid date format: ${row.updated}`,
          rowIndex: index + 2,
          column: 'updated'
        });
      }
      
      // Check for short questions
      if (row.question && row.question.length < 10) {
        issues.push({
          type: 'short_question',
          message: `Question too short (${row.question.length} chars)`,
          rowIndex: index + 2,
          column: 'question'
        });
      }
      
      // Check for questions that are only "?"
      if (row.question && row.question.trim() === '?') {
        issues.push({
          type: 'short_question',
          message: 'Question is only "?"',
          rowIndex: index + 2,
          column: 'question'
        });
      }
      
      // Check for missing output
      if (!row.output || row.output.trim() === '') {
        issues.push({
          type: 'missing_output',
          message: 'Missing output data',
          rowIndex: index + 2,
          column: 'output'
        });
      }
      
      // Check for output containing "?" keyword
      if (row.output && row.output.includes('?')) {
        issues.push({
          type: 'questionmark_output',
          message: 'Output contains "?" - may need review',
          rowIndex: index + 2,
          column: 'output'
        });
      }
    });
    
    return issues;
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const issues = analyzeQuality(file.data);
  const totalRows = file.data.length;
  const cleanRows = totalRows - issues.length;
  const qualityScore = totalRows > 0 ? Math.round((cleanRows / totalRows) * 100) : 100;

  const getIssueIcon = (type: QualityIssue['type']) => {
    switch (type) {
      case 'empty_cell':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'invalid_date':
        return <Calendar className="w-4 h-4 text-warning" />;
      case 'short_question':
        return <MessageSquare className="w-4 h-4 text-warning" />;
      case 'missing_output':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'questionmark_output':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getIssueTypeCount = (type: QualityIssue['type']) => {
    return issues.filter(issue => issue.type === type).length;
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-warning text-warning-foreground">Good</Badge>;
    if (score >= 50) return <Badge className="bg-warning text-warning-foreground">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Data Quality Report
          </div>
          {getQualityBadge(qualityScore)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quality Score</span>
            <span className={`text-2xl font-bold ${getQualityColor(qualityScore)}`}>
              {qualityScore}%
            </span>
          </div>
          <Progress value={qualityScore} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{cleanRows} clean rows</span>
            <span>{issues.length} issues found</span>
            <span>{totalRows} total rows</span>
          </div>
        </div>

        {/* Issue Summary */}
        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Issue Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              {getIssueTypeCount('empty_cell') > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-muted-foreground">Empty cells:</span>
                  <span className="font-medium">{getIssueTypeCount('empty_cell')}</span>
                </div>
              )}
              
              {getIssueTypeCount('invalid_date') > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">Invalid dates:</span>
                  <span className="font-medium">{getIssueTypeCount('invalid_date')}</span>
                </div>
              )}
              
              {getIssueTypeCount('short_question') > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">Short questions:</span>
                  <span className="font-medium">{getIssueTypeCount('short_question')}</span>
                </div>
              )}
              
              {getIssueTypeCount('missing_output') > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-muted-foreground">Missing output:</span>
                  <span className="font-medium">{getIssueTypeCount('missing_output')}</span>
                </div>
              )}
              
              {getIssueTypeCount('questionmark_output') > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">Output with "?":</span>
                  <span className="font-medium">{getIssueTypeCount('questionmark_output')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Issues */}
        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recent Issues</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {issues.slice(0, 10).map((issue, index) => (
                <div key={index} className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded border">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-muted-foreground">
                      Row {issue.rowIndex} • {issue.column}
                    </div>
                    <div className="font-medium">{issue.message}</div>
                  </div>
                </div>
              ))}
              {issues.length > 10 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  And {issues.length - 10} more issues...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {issues.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
            <h3 className="font-medium text-success mb-1">Data Quality Excellent!</h3>
            <p className="text-sm text-muted-foreground">
              All {totalRows} rows passed quality checks with no issues found.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};