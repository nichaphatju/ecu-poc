import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { executeGraphQL } from '@/api/graphqlClient';
import { useAsyncData } from '@/hooks/useAsyncData';
import { Button, Skeleton } from '@/components/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnswerChoice {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
  orderSequence: number;
}

interface Question {
  id: string;
  questionText: string;
  explanation: string;
  orderSequence: number;
  choices: AnswerChoice[];
}

interface LessonData {
  id: string;
  name: string;
  category: string;
  difficultyLevel: string;
  questions: Question[];
}

// ─── GraphQL Query Types ──────────────────────────────────────────────────────

interface LessonQueryResult {
  uiapi: {
    query: {
      Lesson__c: {
        edges: Array<{
          node: {
            Id: string;
            Name?: { value: string | null };
            Category__c?: { value: string | null };
            Difficulty_Level__c?: { value: string | null };
          };
        }>;
      };
    };
  };
}

interface QuestionsQueryResult {
  uiapi: {
    query: {
      Question__c: {
        edges: Array<{
          node: {
            Id: string;
            Question_Text__c?: { value: string | null };
            Explanation__c?: { value: string | null };
            Order_Sequence__c?: { value: number | null };
          };
        }>;
      };
    };
  };
}

interface ChoicesQueryResult {
  uiapi: {
    query: {
      Answer_Choice__c: {
        edges: Array<{
          node: {
            Id: string;
            Question__c?: { value: string | null };
            Choice_Text__c?: { value: string | null };
            Is_Correct__c?: { value: boolean | null };
            Order_Sequence__c?: { value: number | null };
          };
        }>;
      };
    };
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const LESSON_QUERY = `
  query GetLesson($lessonId: ID) {
    uiapi {
      query {
        Lesson__c(where: { Id: { eq: $lessonId } }) {
          edges {
            node {
              Id
              Name @optional { value }
              Category__c @optional { value }
              Difficulty_Level__c @optional { value }
            }
          }
        }
      }
    }
  }
`;

const QUESTIONS_QUERY = `
  query GetQuestions($lessonId: ID) {
    uiapi {
      query {
        Question__c(
          where: { Lesson__c: { eq: $lessonId } }
          orderBy: { Order_Sequence__c: { order: ASC } }
        ) {
          edges {
            node {
              Id
              Question_Text__c @optional { value }
              Explanation__c @optional { value }
              Order_Sequence__c @optional { value }
            }
          }
        }
      }
    }
  }
`;

const CHOICES_QUERY = `
  query GetChoices($questionIds: [ID]) {
    uiapi {
      query {
        Answer_Choice__c(
          where: { Question__c: { in: $questionIds } }
          orderBy: { Order_Sequence__c: { order: ASC } }
        ) {
          edges {
            node {
              Id
              Question__c @optional { value }
              Choice_Text__c @optional { value }
              Is_Correct__c @optional { value }
              Order_Sequence__c @optional { value }
            }
          }
        }
      }
    }
  }
`;

// ─── Difficulty styling ───────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, string> = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function LessonQuestions() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  // questionId → set of selected choiceIds
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  // questionIds that have been submitted (answer revealed)
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const { data: lesson, loading, error } = useAsyncData(async () => {
    if (!lessonId) throw new Error('No lesson ID provided');

    const [lessonResult, questionsResult] = await Promise.all([
      executeGraphQL<LessonQueryResult, { lessonId: string }>(LESSON_QUERY, { lessonId }),
      executeGraphQL<QuestionsQueryResult, { lessonId: string }>(QUESTIONS_QUERY, { lessonId }),
    ]);

    const lessonNode = lessonResult.uiapi.query.Lesson__c.edges[0]?.node;
    if (!lessonNode) throw new Error('Lesson not found');

    const questionEdges = questionsResult.uiapi.query.Question__c.edges;
    const questionIds = questionEdges.map(e => e.node.Id);

    let choicesByQuestion: Record<string, AnswerChoice[]> = {};

    if (questionIds.length > 0) {
      const choicesResult = await executeGraphQL<
        ChoicesQueryResult,
        { questionIds: string[] }
      >(CHOICES_QUERY, { questionIds });

      choicesResult.uiapi.query.Answer_Choice__c.edges.forEach(({ node }) => {
        const qId = node.Question__c?.value ?? '';
        if (!choicesByQuestion[qId]) choicesByQuestion[qId] = [];
        choicesByQuestion[qId].push({
          id: node.Id,
          questionId: qId,
          choiceText: node.Choice_Text__c?.value ?? '',
          isCorrect: node.Is_Correct__c?.value ?? false,
          orderSequence: node.Order_Sequence__c?.value ?? 0,
        });
      });
    }

    const questions: Question[] = questionEdges.map(({ node }) => ({
      id: node.Id,
      questionText: node.Question_Text__c?.value ?? '',
      explanation: node.Explanation__c?.value ?? '',
      orderSequence: node.Order_Sequence__c?.value ?? 0,
      choices: choicesByQuestion[node.Id] ?? [],
    }));

    const lessonData: LessonData = {
      id: lessonNode.Id,
      name: lessonNode.Name?.value ?? '',
      category: lessonNode.Category__c?.value ?? '',
      difficultyLevel: lessonNode.Difficulty_Level__c?.value ?? '',
      questions,
    };
    return lessonData;
  }, [lessonId]);

  if (loading) return <QuizSkeleton />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">Failed to load lesson: {error}</p>
        <Button variant="outline" onClick={() => navigate('/materials')}>
          Back to Materials
        </Button>
      </div>
    );
  }

  if (!lesson) return null;

  const { questions } = lesson;

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">This lesson has no questions yet.</p>
        <Button variant="outline" onClick={() => navigate('/materials')}>
          Back to Materials
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isSubmitted = submitted.has(currentQuestion.id);
  const isLastQuestion = currentIndex === questions.length - 1;
  const selectedChoices = selections[currentQuestion.id] ?? new Set<string>();

  function toggleChoice(choiceId: string) {
    if (isSubmitted) return;
    setSelections(prev => {
      const current = new Set(prev[currentQuestion.id] ?? []);
      if (current.has(choiceId)) {
        current.delete(choiceId);
      } else {
        current.add(choiceId);
      }
      return { ...prev, [currentQuestion.id]: current };
    });
  }

  function submitAnswer() {
    setSubmitted(prev => new Set(prev).add(currentQuestion.id));
  }

  function goNext() {
    if (!isLastQuestion) setCurrentIndex(i => i + 1);
    else navigate('/materials');
  }

  function goPrevious() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/materials')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to Materials
        </button>
        <Button variant="outline" size="sm" onClick={() => navigate('/materials')}>
          End Lesson
        </Button>
      </div>

      {/* Lesson title */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-gray-900">{lesson.name}</h1>
          {lesson.difficultyLevel && (
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${DIFFICULTY_STYLES[lesson.difficultyLevel] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {lesson.difficultyLevel}
            </span>
          )}
        </div>
        {lesson.category && (
          <p className="text-sm text-gray-500">{lesson.category}</p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <p className="text-lg font-medium text-gray-900 mb-6">
          {currentQuestion.questionText}
        </p>

        {currentQuestion.choices.length === 0 ? (
          <p className="text-sm text-gray-400">No answer choices available.</p>
        ) : (
          <div className="space-y-3">
            {currentQuestion.choices.map(choice => {
              const isSelected = selectedChoices.has(choice.id);
              const choiceStyle = isSubmitted
                ? choice.isCorrect
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : isSelected
                  ? 'border-red-400 bg-red-50 text-red-800'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
                : isSelected
                ? 'border-blue-500 bg-blue-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50';

              return (
                <label
                  key={choice.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${choiceStyle} ${isSubmitted ? 'cursor-default' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                    checked={isSelected}
                    onChange={() => toggleChoice(choice.id)}
                    disabled={isSubmitted}
                  />
                  <span className="text-sm leading-snug">{choice.choiceText}</span>
                  {isSubmitted && choice.isCorrect && (
                    <span className="ml-auto shrink-0 text-green-600 text-sm font-medium">
                      Correct
                    </span>
                  )}
                  {isSubmitted && !choice.isCorrect && isSelected && (
                    <span className="ml-auto shrink-0 text-red-500 text-sm font-medium">
                      Incorrect
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Explanation — revealed after submit */}
      {isSubmitted && currentQuestion.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Explanation
          </p>
          <p className="text-sm text-blue-900 leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={goPrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-3">
          {!isSubmitted && (
            <Button onClick={submitAnswer}>
              Submit Answer
            </Button>
          )}
          {isSubmitted && (
            <Button onClick={goNext}>
              {isLastQuestion ? 'Finish Lesson' : 'Next Question'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Skeleton className="h-6 w-40 mb-6" />
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="h-2 w-full mb-6 rounded-full" />
      <Skeleton className="h-64 w-full rounded-xl mb-6" />
      <div className="flex justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
