import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const QuestionForm = () => {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>([]);
  const [answers, setAnswers] = useState<Record<string, { result: string; detail: string; source: string; source_entity: string }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const questionsPerPage = 10;

  const isFormValid = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every(q => {
      const answer = answers[q.id];
      return answer && answer.result && answer.detail && answer.source && answer.source_entity;
    });
  }, [answers, questions]);

  const completionPercentage = useMemo(() => {
    if (questions.length === 0) return 0;
    const completedQuestions = questions.filter(q => {
      const answer = answers[q.id];
      return answer && answer.result && answer.detail && answer.source && answer.source_entity;
    }).length;
    return Math.round((completedQuestions / questions.length) * 100);
  }, [answers, questions]);

  useEffect(() => {
    fetch('/projects.txt')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const formattedProjects = lines.map(line => {
          const id = line.trim();
          return { id, name: id };
        });
        setProjects(formattedProjects);
      });

    fetch('/questions.txt')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const formattedQuestions = lines.map((line, index) => ({
          id: `q${index}`,
          text: line,
        }));
        setQuestions(formattedQuestions);
      });
  }, []);

  useEffect(() => {
    const draftAnswers = localStorage.getItem('questionFormDraft');
    if (draftAnswers) {
      setAnswers(JSON.parse(draftAnswers));
    }
    const draftProject = localStorage.getItem('questionFormProject');
    if (draftProject) {
      setSelectedProject(draftProject);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('questionFormProject', selectedProject);
    }
  }, [selectedProject]);

  const handleAnswerChange = (questionId: string, field: string, value: string) => {
    const newAnswers = {
      ...answers,
      [questionId]: {
        ...answers[questionId],
        [field]: value,
      },
    };
    setAnswers(newAnswers);
    localStorage.setItem('questionFormDraft', JSON.stringify(newAnswers));
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      setSubmissionAttempted(true);
      alert('Please fill out all fields for every question before submitting.');
      return;
    }
    setIsSubmitting(true);

    const formattedAnswers = {
      questions_main: Object.keys(answers).map((key, index) => {
        const question = questions.find(q => q.id === key);
        return {
          project_id: selectedProject,
          q_id: index + 1,
          question: question ? question.text : '',
          result: parseInt(answers[key].result, 10),
          detail: answers[key].detail,
          source: answers[key].source,
          source_entity: answers[key].source_entity,
        };
      }),
    };

    console.log("Submitting JSON payload:", JSON.stringify(formattedAnswers, null, 2));
    try {
      const response = await fetch('https://data-research-team-1094890588015.us-central1.run.app/submit-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedAnswers, null, 2),
      });

      if (response.ok) {
        const responseData = await response.json().catch(() => ({})); // Handle cases with no JSON body
        console.log("API Response (Success):", responseData);
        alert('Form submitted successfully!');
        localStorage.removeItem('questionFormDraft');
        localStorage.removeItem('questionFormProject');
        setAnswers({});
        setSelectedProject('');
      } else {
        const errorData = await response.text();
        console.error("API Response (Error):", {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        });
        alert('Failed to submit the form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while submitting the form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestFill = () => {
    const newAnswers: Record<string, { result: string; detail: string; source: string; source_entity: string }> = {};
    questions.forEach(q => {
      newAnswers[q.id] = {
        result: Math.round(Math.random()).toString(),
        detail: 'Sample detail',
        source: 'Sample source',
        source_entity: 'Sample entity',
      };
    });
    setAnswers(newAnswers);
    setSelectedProject(projects[0]?.id || '');
  };

  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const paginatedQuestions = questions.slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Question Form</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Please select a project and answer the following questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <Label htmlFor="project-select">Project</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedProject
                        ? projects.find((project) => project.id === selectedProject)?.name
                        : "Select a project"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search project..." />
                      <CommandEmpty>No project found.</CommandEmpty>
                      <CommandGroup>
                        {projects.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={project.id}
                            onSelect={(currentValue) => {
                              setSelectedProject(currentValue === selectedProject ? "" : currentValue);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProject === project.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <fieldset disabled={!selectedProject}>
                {paginatedQuestions.map((q, index) => {
                  const isInvalid = submissionAttempted && (!answers[q.id] || !answers[q.id].result || !answers[q.id].detail || !answers[q.id].source || !answers[q.id].source_entity);
                  return (
                  <div key={q.id} className={cn("space-y-4 border-l-2 p-4 -ml-4 rounded-r-lg", isInvalid ? "border-red-500" : "border-transparent")}>
                    <p className="font-medium">{(currentPage - 1) * questionsPerPage + index + 1}. {q.text}</p>
                    <div className="pl-4">
                      <RadioGroup
                        value={answers[q.id]?.result}
                        onValueChange={(value) => handleAnswerChange(q.id, 'result', value)}
                        className="flex items-center space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id={`${q.id}-yes`} />
                          <Label htmlFor={`${q.id}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="0" id={`${q.id}-no`} />
                          <Label htmlFor={`${q.id}-no`}>No</Label>
                        </div>
                      </RadioGroup>
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label htmlFor={`${q.id}-detail`}>Detail</Label>
                          <Textarea
                            id={`${q.id}-detail`}
                            value={answers[q.id]?.detail || ''}
                            placeholder="Provide details..."
                            onChange={(e) => handleAnswerChange(q.id, 'detail', e.target.value)}
                            required={!!answers[q.id]?.result}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${q.id}-source`}>Source</Label>
                          <Input
                            id={`${q.id}-source`}
                            value={answers[q.id]?.source || ''}
                            placeholder="URL or report name..."
                            onChange={(e) => handleAnswerChange(q.id, 'source', e.target.value)}
                            required={!!answers[q.id]?.result}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${q.id}-source-entity`}>Source Entity</Label>
                            <Badge
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => handleAnswerChange(q.id, 'source_entity', 'GFI Research')}
                            >
                              GFI Research
                            </Badge>
                          </div>
                          <Input
                            id={`${q.id}-source-entity`}
                            value={answers[q.id]?.source_entity || ''}
                            placeholder="Entity name..."
                            onChange={(e) => handleAnswerChange(q.id, 'source_entity', e.target.value)}
                            required={!!answers[q.id]?.result}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </fieldset>
              <div className="flex justify-between items-center">
                <div>
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                  <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
                <Button onClick={handleTestFill} disabled>Test</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle>Form Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Completion</span>
                  <span className="text-sm font-bold">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;