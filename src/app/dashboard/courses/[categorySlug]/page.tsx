'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  durationMinutes: number | null;
  lessonType: string;
  sortOrder: number;
  progress: { status: string }[];
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  sortOrder: number;
  lessons: Lesson[];
  stats: { total: number; completed: number; percent: number };
  category: { name: string; slug: string; color: string | null };
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'badge-green',
  IN_PROGRESS: 'badge-yellow',
  NOT_STARTED: 'badge-gray',
};
const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Finalizat',
  IN_PROGRESS: 'În progres',
  NOT_STARTED: 'Neînceput',
};

const LESSON_TYPE_ICON: Record<string, string> = {
  VIDEO: '🎬',
  PDF: '📄',
  PRESENTATION: '📊',
  QUIZ: '❓',
  TEXT: '📝',
};

export default function CategoryCoursesPage() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;

  const [modules, setModules] = useState<Module[]>([]);
  const [category, setCategory] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/modules?category=${categorySlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) setModules(data.data);
        if (data.category) setCategory(data.category);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aep-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/courses" className="text-gray-500 hover:text-aep-600">
          ← Categorii
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold text-gray-900">
          {category?.name || categorySlug}
        </h1>
      </div>

      {modules.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nu există module disponibile în această categorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">{mod.title}</h2>
                  {mod.description && (
                    <p className="text-gray-600 text-sm mt-1">{mod.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-gray-500">
                      {mod.stats.total} lecții
                    </span>
                    <span className="text-sm text-gray-500">
                      {mod.stats.completed} finalizate
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-aep-600">{mod.stats.percent}%</div>
                  <div className="text-xs text-gray-500">progres</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 mb-4">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${mod.stats.percent}%` }}
                  />
                </div>
              </div>

              {/* Lessons list */}
              <div className="space-y-2">
                {mod.lessons.map((lesson) => {
                  const status = lesson.progress[0]?.status || 'NOT_STARTED';
                  return (
                    <Link
                      key={lesson.id}
                      href={`/dashboard/courses/lesson/${lesson.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-aep-200 hover:bg-aep-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{LESSON_TYPE_ICON[lesson.lessonType] || '📄'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 group-hover:text-aep-700">
                            {lesson.title}
                          </p>
                          {lesson.durationMinutes && (
                            <p className="text-xs text-gray-500">{lesson.durationMinutes} min</p>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${STATUS_BADGE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
