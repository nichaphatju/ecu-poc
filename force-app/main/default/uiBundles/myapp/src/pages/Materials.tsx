import { useState } from 'react';
import { useNavigate } from 'react-router';
import { executeGraphQL } from '@/api/graphqlClient';
import { useAsyncData } from '@/hooks/useAsyncData';
import { Button, Input, Skeleton, Tabs, TabsList, TabsTrigger } from '@/components/ui';

const CATEGORIES = ['All', 'English', 'Math', 'IT', 'Architect'] as const;
type Category = (typeof CATEGORIES)[number];

const DIFFICULTY_STYLES: Record<string, string> = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
};

const CATEGORY_STYLES: Record<string, string> = {
  English: 'bg-blue-100 text-blue-700',
  Math: 'bg-purple-100 text-purple-700',
  IT: 'bg-cyan-100 text-cyan-700',
  Architect: 'bg-orange-100 text-orange-700',
};

interface LessonsQueryResult {
  uiapi: {
    query: {
      Lesson__c: {
        edges: Array<{
          node: {
            Id: string;
            Name?: { value: string | null };
            Category__c?: { value: string | null };
            Description__c?: { value: string | null };
            Active__c?: { value: boolean | null };
            Difficulty_Level__c?: { value: string | null };
            Thumbnail__c?: { value: string | null };
          };
        }>;
      };
    };
  };
}

interface Lesson {
  id: string;
  name: string;
  category: string;
  description: string;
  difficultyLevel: string;
  thumbnail: string;
}

// The UI API GraphQL does not support checkbox fields in `where` clauses, and
// `orderBy` only accepts a single field — both Active__c filtering and
// multi-field sorting are handled in JS after the fetch.
const LESSONS_QUERY = `
  query GetLessons {
    uiapi {
      query {
        Lesson__c(
          orderBy: { Name: { order: ASC } }
        ) {
          edges {
            node {
              Id
              Name @optional { value }
              Category__c @optional { value }
              Description__c @optional { value }
              Active__c @optional { value }
              Difficulty_Level__c @optional { value }
              Thumbnail__c @optional { value }
            }
          }
        }
      }
    }
  }
`;

export default function Materials() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const { data: lessons, loading, error } = useAsyncData(async () => {
    const result = await executeGraphQL<LessonsQueryResult, void>(LESSONS_QUERY);
    return result.uiapi.query.Lesson__c.edges
      .filter(({ node }) => node.Active__c?.value === true)
      .map(({ node }) => ({
        id: node.Id,
        name: node.Name?.value ?? '',
        category: node.Category__c?.value ?? '',
        description: node.Description__c?.value ?? '',
        difficultyLevel: node.Difficulty_Level__c?.value ?? '',
        thumbnail: node.Thumbnail__c?.value ?? '',
      }))
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      );
  }, []);

  const filtered = (lessons ?? []).filter(lesson => {
    const matchesSearch = lesson.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || lesson.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Materials</h1>

      <Input
        placeholder="Search lessons..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm mb-6"
      />

      <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as Category)}>
        <TabsList className="mb-6">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {error && (
          <p className="text-red-600 text-sm mb-4">Failed to load lessons: {error}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 mt-4">No lessons found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(lesson => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onStart={() => navigate(`/materials/${lesson.id}`)}
              />
            ))}
          </div>
        )}
      </Tabs>
    </div>
  );
}

function LessonCard({ lesson, onStart }: { lesson: Lesson; onStart: () => void }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col bg-white">
      {lesson.thumbnail ? (
        <img
          src={lesson.thumbnail}
          alt={lesson.name}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-2 mb-3">
          {lesson.category && (
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CATEGORY_STYLES[lesson.category] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {lesson.category}
            </span>
          )}
          {lesson.difficultyLevel && (
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${DIFFICULTY_STYLES[lesson.difficultyLevel] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {lesson.difficultyLevel}
            </span>
          )}
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
          {lesson.name}
        </h2>

        {lesson.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
            {lesson.description}
          </p>
        )}

        <Button onClick={onStart} className="mt-auto w-full">
          Start Lesson
        </Button>
      </div>
    </div>
  );
}
