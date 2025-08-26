import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const QuestionForm = () => {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>([]);
  const [answers, setAnswers] = useState<Record<string, { result: string; detail: string; source: string; source_entity: string }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  useEffect(() => {
    fetch('/projects.txt')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const formattedProjects = lines.map(line => {
          const [id, name] = line.split(' – ');
          return { id, name };
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
    const draft = localStorage.getItem('questionFormDraft');
    if (draft) {
      setAnswers(JSON.parse(draft));
    }
  }, []);

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
    const isFormValid = paginatedQuestions.every(q => {
      const answer = answers[q.id];
      return answer && answer.result && answer.detail && answer.source && answer.source_entity;
    });

    if (!isFormValid) {
      alert('Please fill out all fields for the current page before submitting.');
      return;
    }

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

    try {
      const response = await fetch('https://data-research-team-1094890588015.us-central1.run.app/submit-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedAnswers, null, 2),
      });

      if (response.ok) {
        alert('Form submitted successfully!');
        alert('Form submitted successfully!');
        localStorage.removeItem('questionFormDraft');
        setAnswers({});
        setSelectedProject('');
      } else {
        alert('Failed to submit the form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while submitting the form.');
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
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Question Form</h1>
      <Card>
        <CardHeader>
          <CardTitle>Please select a project and answer the following questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label htmlFor="project-select">Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project-select">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <fieldset disabled={!selectedProject}>
            {paginatedQuestions.map((q, index) => (
              <div key={q.id} className="space-y-4">
                <p className="font-medium">{(currentPage - 1) * questionsPerPage + index + 1}. {q.text}</p>
                <div className="pl-4">
                  <RadioGroup
                    value={answers[q.id]?.result || ''}
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
                        placeholder="Provide details..."
                        value={answers[q.id]?.detail || ''}
                        onChange={(e) => handleAnswerChange(q.id, 'detail', e.target.value)}
                        required={!!answers[q.id]?.result}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${q.id}-source`}>Source</Label>
                      <Input
                        id={`${q.id}-source`}
                        placeholder="URL or report name..."
                        value={answers[q.id]?.source || ''}
                        onChange={(e) => handleAnswerChange(q.id, 'source', e.target.value)}
                        required={!!answers[q.id]?.result}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${q.id}-source-entity`}>Source Entity</Label>
                      <Input
                        id={`${q.id}-source-entity`}
                        placeholder="Entity name..."
                        value={answers[q.id]?.source_entity || ''}
                        onChange={(e) => handleAnswerChange(q.id, 'source_entity', e.target.value)}
                        required={!!answers[q.id]?.result}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </fieldset>
          <div className="flex justify-between items-center">
            <div>
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
            <Button onClick={handleTestFill}>Test</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionForm;