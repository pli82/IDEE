// src/types/index.ts — Tipuri globale AEP Instruire Online

export type Role = 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'REPORTING_ADMIN' | 'USER'

export interface SessionUser {
  id: string
  email: string
  roles: Role[]
  profileComplete: boolean
  name?: string
  judetCode?: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pages: number
}

export interface CategoryWithChildren {
  id: string
  title: string
  slug: string
  description?: string | null
  parentId?: string | null
  order: number
  published: boolean
  children: CategoryWithChildren[]
}

export interface ModuleWithLessons {
  id: string
  title: string
  description?: string | null
  order: number
  published: boolean
  categoryId: string
  lessons: LessonSummary[]
}

export interface LessonSummary {
  id: string
  title: string
  order: number
  published: boolean
  progress?: { watchedPercent: number; status: string } | null
}

export interface TestAttemptResult {
  id: string
  score: number
  maxScore: number
  passed: boolean
  answers: {
    question: string
    selectedOption: string
    correctOption?: string
    isCorrect: boolean
    explanation?: string | null
  }[]
}
