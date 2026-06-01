'use client'
import { useState, useEffect } from 'react'

interface Lesson { id: string; title: string; module: { title: string } }
interface Test {
  id: string; title: string; published: boolean; questionsPerAttempt: number
  passingScore: number; lessonId?: string; lesson?: { title: string }
  _count: { questions: number; attempts: number }
}
interface Question {
  id: string; text: string; type: string; active: boolean; explanation?: string
  options: { id: string; text: string; isCorrect: boolean; order: number }[]
}

const apiFetch = (url: string, options: RequestInit = {}) =>
  fetch(url, { ...options, credentials: 'include' })

const emptyQForm = () => ({
  text: '',
  type: 'SINGLE',
  explanation: '',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
})

export default function AdminTests() {
  const [tests, setTests] = useState<Test[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showTestForm, setShowTestForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editQuestion, setEditQuestion] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [testForm, setTestForm] = useState({
    title: '', questionsPerAttempt: 10, passingScore: 7, published: false, lessonId: '',
  })
  const [qForm, setQForm] = useState(emptyQForm())

  useEffect(() => {
    loadTests()
    loadLessons()
  }, [])

  const loadTests = async () => {
    const r = await apiFetch('/api/admin/tests?resource=tests')
    const d = await r.json()
    setTests(d.data || [])
  }

  const loadLessons = async () => {
    const r = await apiFetch('/api/admin/content?resource=lessons')
    const d = await r.json()
    setLessons(d.data || [])
  }

  const loadQuestions = async (testId: string) => {
    const r = await apiFetch(`/api/admin/tests?resource=questions&testId=${testId}`)
    const d = await r.json()
    setQuestions(d.data || [])
  }

  const selectTest = (test: Test) => {
    setSelectedTest(test)
    loadQuestions(test.id)
  }

  const createTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body: any = {
        title: testForm.title,
        questionsPerAttempt: testForm.questionsPerAttempt,
        passingScore: testForm.passingScore,
        published: testForm.published,
      }
      if (testForm.lessonId) body.lessonId = testForm.lessonId

      const r = await apiFetch('/api/admin/tests?resource=tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Eroare la salvare'); return }
      setShowTestForm(false)
      setTestForm({ title: '', questionsPerAttempt: 10, passingScore: 7, published: false, lessonId: '' })
      loadTests()
    } finally { setSaving(false) }
  }

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest) return
    setError('')

    // Validări
    const filledOptions = qForm.options.filter(o => o.text.trim())
    if (filledOptions.length < 2) { setError('Adaugă cel puțin 2 variante de răspuns'); return }
    const hasCorrect = qForm.options.some(o => o.isCorrect && o.text.trim())
    if (!hasCorrect) { setError('Selectează cel puțin un răspuns corect'); return }

    setSaving(true)
    try {
      const body = {
        testId: selectedTest.id,
        text: qForm.text,
        type: qForm.type,
        explanation: qForm.explanation || undefined,
        options: qForm.options.filter(o => o.text.trim()).map((o, i) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          order: i,
        })),
      }

      const url = editQuestion
        ? `/api/admin/tests?resource=questions&id=${editQuestion.id}`
        : '/api/admin/tests?resource=questions'
      const method = editQuestion ? 'PUT' : 'POST'

      const r = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Eroare la salvare'); return }

      setShowQuestionForm(false)
      setEditQuestion(null)
      setQForm(emptyQForm())
      loadQuestions(selectedTest.id)
    } finally { setSaving(false) }
  }

  const openAddQuestion = () => {
    setEditQuestion(null)
    setQForm(emptyQForm())
    setError('')
    setShowQuestionForm(true)
  }

  const openEditQuestion = (q: Question) => {
    setEditQuestion(q)
    setQForm({
      text: q.text,
      type: q.type,
      explanation: q.explanation || '',
      options: [
        ...q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
        // completează până la 4 dacă sunt mai puține
        ...Array(Math.max(0, 4 - q.options.length)).fill({ text: '', isCorrect: false }),
      ],
    })
    setError('')
    setShowQuestionForm(true)
  }

  const toggleQuestion = async (id: string, active: boolean) => {
    await apiFetch(`/api/admin/tests?resource=questions&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    if (selectedTest) loadQuestions(selectedTest.id)
  }

const deleteQuestion = async (id: string, permanent: boolean) => {
  if (permanent) {
    if (!confirm('Ștergi DEFINITIV această întrebare și toate răspunsurile din rapoarte? Acțiunea este ireversibilă.')) return
    await apiFetch(`/api/admin/tests?resource=questions&id=${id}&permanent=true`, { method: 'DELETE' })
  } else {
    if (!confirm('Dezactivezi această întrebare? Nu va mai apărea în teste noi, dar răspunsurile vechi rămân în rapoarte.')) return
    await apiFetch(`/api/admin/tests?resource=questions&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
  }
  if (selectedTest) loadQuestions(selectedTest.id)
}

  const toggleTestPublished = async (test: Test) => {
    await apiFetch(`/api/admin/tests?resource=tests&id=${test.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !test.published }),
    })
    loadTests()
  }

  // Opțiuni formular întrebare
  const addOption = () => setQForm(p => ({ ...p, options: [...p.options, { text: '', isCorrect: false }] }))

  const removeOption = (idx: number) => {
    if (qForm.options.length <= 2) return
    setQForm(p => ({ ...p, options: p.options.filter((_, i) => i !== idx) }))
  }

  const updateOption = (idx: number, field: 'text' | 'isCorrect', value: any) => {
    setQForm(p => {
      const opts = [...p.options]
      opts[idx] = { ...opts[idx], [field]: value }
      // Single: debifează celelalte când se bifează una
      if (field === 'isCorrect' && value && p.type === 'SINGLE') {
        opts.forEach((o, i) => { if (i !== idx) o.isCorrect = false })
      }
      return { ...p, options: opts }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestionare teste</h1>
        <button onClick={() => { setShowTestForm(true); setError('') }}
          className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm font-medium hover:bg-aep-700">
          + Test nou
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista teste */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-medium text-gray-700 text-sm">
            Teste ({tests.length})
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {tests.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">Niciun test creat</div>
            )}
            {tests.map(test => (
              <div key={test.id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedTest?.id === test.id ? 'bg-aep-50 border-l-2 border-aep-600' : ''}`}
                onClick={() => selectTest(test)}>
                <div className="font-medium text-sm text-gray-900">{test.title}</div>
                {test.lesson && (
                  <div className="text-xs text-aep-600 mt-0.5">📚 {test.lesson.title}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{test._count.questions} întrebări</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{test._count.attempts} încercări</span>
                  <button onClick={e => { e.stopPropagation(); toggleTestPublished(test) }}
  className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${test.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
  {test.published ? 'Activ' : 'Draft'}
</button>
<button onClick={async e => {
  e.stopPropagation()
  if (!confirm('Ștergi testul și toate întrebările lui?')) return
  await apiFetch(`/api/admin/tests?resource=tests&id=${test.id}`, { method: 'DELETE' })
  if (selectedTest?.id === test.id) setSelectedTest(null)
  loadTests()
}} className="text-xs px-1.5 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50">
  Șterge
</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Întrebări */}
        <div className="lg:col-span-2">
          {selectedTest ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{selectedTest.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Promovare: {selectedTest.passingScore}/{selectedTest.questionsPerAttempt} · {questions.length} întrebări în total
                  </div>
                </div>
                <button onClick={openAddQuestion}
                  className="px-3 py-1.5 bg-aep-600 text-white rounded-lg text-xs font-medium hover:bg-aep-700">
                  + Întrebare nouă
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  <p className="mb-3">Nicio întrebare adăugată</p>
                  <button onClick={openAddQuestion}
                    className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
                    + Adaugă prima întrebare
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                  {questions.map((q, i) => (
                    <div key={q.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm font-medium text-gray-900 flex-1">
                          <span className="text-gray-400 mr-2 font-normal">{i + 1}.</span>{q.text}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEditQuestion(q)}
                            className="text-xs px-2 py-0.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50">
                            Editează
                          </button>
                          <button onClick={() => toggleQuestion(q.id, q.active)}
                            className={`text-xs px-2 py-0.5 rounded-full ${q.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {q.active ? 'Activ' : 'Inactiv'}
                          </button>
<button onClick={() => deleteQuestion(q.id, false)}
  className="text-xs px-2 py-0.5 rounded border border-orange-200 text-orange-500 hover:bg-orange-50">
  Dezactivează
</button>
<button onClick={() => deleteQuestion(q.id, true)}
  className="text-xs px-2 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50">
  Șterge definitiv
</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ml-5">
                        {q.options.map(opt => (
                          <div key={opt.id}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${opt.isCorrect ? 'bg-green-50 text-green-700 font-medium border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                            <span>{opt.isCorrect ? '✓' : '○'}</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-2 ml-5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-64 text-gray-400 text-sm">
              Selectează un test din stânga pentru a gestiona întrebările
            </div>
          )}
        </div>
      </div>

      {/* ── Modal test nou ────────────────────────────────── */}
      {showTestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Test nou</h2>
            <form onSubmit={createTest} className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Titlu test *</label>
                <input type="text" placeholder="ex: Test Preziua votării" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={testForm.title} onChange={e => setTestForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Asociază cu lecția</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={testForm.lessonId}
                  onChange={e => setTestForm(p => ({ ...p, lessonId: e.target.value }))}>
                  <option value="">— Fără lecție asociată —</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.module?.title ? `${l.module.title} → ` : ''}{l.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Testul va apărea pe pagina lecției selectate</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Întrebări per test</label>
                  <input type="number" min={1} max={50}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={testForm.questionsPerAttempt}
                    onChange={e => setTestForm(p => ({ ...p, questionsPerAttempt: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Prag promovare (puncte)</label>
                  <input type="number" min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={testForm.passingScore}
                    onChange={e => setTestForm(p => ({ ...p, passingScore: +e.target.value }))} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={testForm.published}
                  onChange={e => setTestForm(p => ({ ...p, published: e.target.checked }))} />
                Publică imediat (vizibil utilizatorilor)
              </label>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowTestForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Anulează</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-aep-600 text-white rounded-lg hover:bg-aep-700 disabled:opacity-50">
                  {saving ? 'Se salvează...' : 'Creează testul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal întrebare ───────────────────────────────── */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editQuestion ? 'Editează întrebarea' : 'Întrebare nouă'}
            </h2>
            <form onSubmit={saveQuestion} className="space-y-4">

              <div>
                <label className="text-xs text-gray-600 block mb-1">Textul întrebării *</label>
                <textarea placeholder="Scrie întrebarea aici..." required rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={qForm.text} onChange={e => setQForm(p => ({ ...p, text: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Tip răspuns</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={qForm.type}
                  onChange={e => setQForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="SINGLE">Un singur răspuns corect</option>
                  <option value="MULTIPLE">Mai multe răspunsuri corecte</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-600">
                    Variante de răspuns *
                    <span className="text-gray-400 ml-1">
                      ({qForm.type === 'SINGLE' ? 'bifează cel corect' : 'bifează toate corecte'})
                    </span>
                  </label>
                  <button type="button" onClick={addOption}
                    className="text-xs text-aep-600 hover:underline">
                    + Adaugă variantă
                  </button>
                </div>

                <div className="space-y-2">
                  {qForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type={qForm.type === 'SINGLE' ? 'radio' : 'checkbox'}
                        name="correct-option"
                        checked={opt.isCorrect}
                        onChange={e => updateOption(i, 'isCorrect', e.target.checked)}
                        className="shrink-0 w-4 h-4 accent-green-600"
                        title="Răspuns corect"
                      />
                      <input type="text"
                        placeholder={`Variantă ${i + 1}`}
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm ${opt.isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                        value={opt.text}
                        onChange={e => updateOption(i, 'text', e.target.value)} />
                      {qForm.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  ◉ = răspuns corect (selectat) · Minim 2 variante
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Explicație (opțional)</label>
                <textarea placeholder="Explicație afișată după răspuns..." rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={qForm.explanation} onChange={e => setQForm(p => ({ ...p, explanation: e.target.value }))} />
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowQuestionForm(false); setEditQuestion(null); setError('') }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Anulează</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-aep-600 text-white rounded-lg hover:bg-aep-700 disabled:opacity-50">
                  {saving ? 'Se salvează...' : editQuestion ? 'Salvează modificările' : 'Adaugă întrebarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
