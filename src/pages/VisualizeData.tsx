import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getResearchData } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Định nghĩa các mục đánh giá và q_id tương ứng
const evaluationCategories = {
  "Thị trường & Cơ hội": [1, 2, 3, 4, 5],
  "Sản phẩm & Công nghệ": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  "Đội ngũ & Lãnh đạo": [22, 23, 24, 25, 26, 27, 28, 29, 30],
  "Cộng đồng & Marketing": [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  "Partner & Backer": [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
  "Tokenomics": [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72],
  "Hiệu suất thị trường": [73, 74, 75, 76, 77, 78, 79],
};

// Interfaces cho dữ liệu API (mở rộng)
interface ApiDataItem {
  project_id: string;
  q_id: number;
  result: number;
  question: string;
  detail: string;
  source: string;
  source_entity: string;
}

interface ApiResponse {
  data: ApiDataItem[];
}

// Interface cho dữ liệu đã xử lý
interface CategoryData {
  score: number;
  rawItems: ApiDataItem[];
}
interface ProjectData {
  project_id: string;
  "Total Score": number;
  [key: string]: CategoryData | string | number;
}

// Interface cho dữ liệu trung gian
interface IntermediateProjectData {
  project_id: string;
  [key: string]: { sum: number; count: number; rawItems: ApiDataItem[] } | string;
}

// Function to get color based on score
const getScoreColor = (score: number): string => {
  if (score >= 80) return "bg-green-500 text-white";
  if (score >= 70) return "bg-green-600 text-white";
  if (score >= 60) return "bg-yellow-500 text-white";
  if (score >= 50) return "bg-yellow-600 text-white";
  if (score >= 40) return "bg-yellow-700 text-white";
  if (score >= 30) return "bg-red-500 text-white";
  return "bg-red-600 text-white";
};

const VisualizeData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: apiResponse, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["researchData"],
    queryFn: getResearchData,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Project Evaluation Dashboard</h1>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !apiResponse) {
    return <div className="container mx-auto p-4">Error fetching data. Please try again later.</div>;
  }

  // 1. Tổng hợp sum, count và rawItems
  const intermediateData = apiResponse.data.reduce((acc, item) => {
    const { project_id, q_id, result } = item;

    const category = Object.keys(evaluationCategories).find(cat => 
      (evaluationCategories as any)[cat].includes(q_id)
    );

    if (!acc[project_id]) {
      acc[project_id] = { project_id: project_id };
      Object.keys(evaluationCategories).forEach(cat => {
        acc[project_id][cat] = { sum: 0, count: 0, rawItems: [] };
      });
    }

    if (category) {
      const catData = acc[project_id][category] as { sum: number; count: number; rawItems: ApiDataItem[] };
      const numericResult = Number(result) || 0;
      catData.sum += numericResult;
      catData.count += 1;
      catData.rawItems.push(item);
    }

    return acc;
  }, {} as { [key: string]: IntermediateProjectData });

  // 2. Tính điểm cuối cùng
  const finalData = Object.values(intermediateData).map(project => {
    const finalProject: ProjectData = {
      project_id: project.project_id as string,
      "Total Score": 0,
    };

    let totalCategoryScoreSum = 0;
    let categoriesWithData = 0;

    Object.keys(evaluationCategories).forEach(cat => {
      const catData = project[cat] as { sum: number; count: number; rawItems: ApiDataItem[] };
      let scaledScore = 0;
      if (catData.count > 0) {
        scaledScore = (catData.sum / catData.count) * 100;
        totalCategoryScoreSum += scaledScore;
        categoriesWithData++;
      }
      finalProject[cat] = {
        score: Math.round(scaledScore),
        rawItems: catData.rawItems,
      };
    });

    if (categoriesWithData > 0) {
      finalProject["Total Score"] = Math.round(totalCategoryScoreSum / categoriesWithData);
    }

    return finalProject;
  });

  const headers = ["Project ID", ...Object.keys(evaluationCategories), "Total Score"];

  // Lọc dữ liệu dựa trên searchTerm
  const filteredData = finalData.filter(project =>
    project.project_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Project Evaluation Dashboard</h1>
          <Input
            placeholder="Search by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="font-bold">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.project_id} className="hover:bg-gray-50 dark:hover:bg-gray-900/10">
                  {headers.map((header) => {
                    if (header === "Project ID") {
                      return (
                        <TableCell key={`${row.project_id}-${header}`}>
                          <div className="flex items-center gap-3 font-medium">
                            <img
                              src={`/${row.project_id}.png`}
                              alt={row.project_id as string}
                              className="h-6 w-6 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            <span>{row.project_id}</span>
                          </div>
                        </TableCell>
                      );
                    }
                    if (header === "Total Score") {
                      const score = row["Total Score"] as number;
                      return (
                        <TableCell key={`${row.project_id}-${header}`} className="text-center">
                          <div className="flex justify-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full font-medium inline-block min-w-[60px] text-center",
                              getScoreColor(score)
                            )}>
                              {score}%
                            </span>
                          </div>
                        </TableCell>
                      );
                    }

                    const cellData = row[header] as CategoryData;
                    return (
                      <TableCell key={`${row.project_id}-${header}`} className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full font-medium inline-block min-w-[60px] text-center",
                            getScoreColor(cellData.score)
                          )}>
                            {cellData.score}%
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-full bg-gray-100 dark:bg-gray-800 w-5 h-5 flex items-center justify-center cursor-pointer">
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-lg p-4 bg-background border shadow-lg rounded-lg z-50">
                              <h4 className="font-bold mb-2">{header} - Details</h4>
                              <div className="max-h-60 overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Question</TableHead>
                                      <TableHead className="text-center">Result</TableHead>
                                      <TableHead>Detail</TableHead>
                                      <TableHead>Source</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cellData.rawItems.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="text-xs">{item.question}</TableCell>
                                        <TableCell className="text-center">{item.result}</TableCell>
                                        <TableCell className="text-xs">{item.detail}</TableCell>
                                        <TableCell className="text-xs">
                                          {item.source && (item.source.startsWith('http://') || item.source.startsWith('https://')) ? (
                                            <a
                                              href={item.source}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-500 hover:underline"
                                            >
                                              {item.source_entity || 'Source Link'}
                                            </a>
                                          ) : (
                                            <span>{`${item.source_entity}: ${item.source}`}</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default VisualizeData;