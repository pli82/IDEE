'use client'
import { useState, useEffect } from 'react'

interface Test { id: string; title: string; published: boolean; questionsPerAttempt: number; passingScore: number; _count: { questions: number; attempts: number }; module?: { title: string } }
interface Question { id: string; text: string; type: string; active: boolean; options: { id: string; text: string; isCorrect: boolean }[] }

export default function AdminTests() {
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showTestForm, setShowTestForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [testForm, setTestForm] = useState({ title: '', questionsPerAttempt: 10, passingScore: 7, published: false })
  const [qForm, setQForm] = useState({ text: '', type: 'SINGLE', explanation: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] })

  useEffect(() => { loadTests() }, [])

  const loadTests = async () => {
    const r = await fetch('/api/admin/tests?resource=tests')
    const d = await r.json()
    setTests(d.data || [])
  }

  const loadQuestions = async (testId: string) => {
    const r = await fetch(`/api/admin/tests?resource=questions&testId=${testId}`)
    const d = await r.json()
    setQuestions(d.data || [])
  }

  const selectTest = (test: Test) => {
    setSelectedTest(test)
    loadQuestions(test.id)
  }

  const createTest = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = await fetch('/api/admin/tests?resource=tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testForm),
    })
    if (r.ok) { setShowTestForm(false); loadTests() }
  }

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest) return
    const r = await fetch('/api/admin/tests?resource=questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...qForm, testId: selectedTest.id }),
    })
    if (r.ok) { setShowQuestionForm(false); loadQuestions(selectedTest.id) }
  }

  const toggleQuestion = async (id: string, active: boolean) => {
    await fetch(`/api/admin/tests?resource=questions&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    if (selectedTest) loadQuestions(selectedTest.id)
  }

  const updateOption = (idx: number, field: string, value: any) => {
    setQForm(p => {
      const opts = [...p.options]
      opts[idx] = { ...opts[idx], [field]: value }
      // Single answer: uncheck others when checking one
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
        <button onClick={() => setShowTestForm(true)} className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm font-medium hover:bg-aep-700">
          + Test nou
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista teste */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-medium text-gray-700">Teste ({tests.length})</div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {tests.map(test => (
              <button key={test.id} onClick={() => selectTest(test)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedTest?.id === test.id ? 'bg-aep-50 border-l-2 border-aep-600' : ''}`}>
                <div className="font-medium text-sm text-gray-900">{test.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {test._count.questions} întrebări · {test._count.attempts} încercări
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${test.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {test.published ? 'Activ' : 'Draft'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Întrebări test selectat */}
        <div className="lg:col-span-2">
          {selectedTest ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{selectedTest.title}</div>
                  <div className="text-xs text-gray-500">Promovare la {selectedTest.passingScore}/{selectedTest.questionsPerAttempt} puncte</div>
                </div>
                <button onClick={() => setShowQuestionForm(true)} className="px-3 py-1.5 bg-aep-600 text-white rounded-lg text-xs font-medium hover:bg-aep-700">
                  + Întrebare
                </button>
              </div>
              <div className="divide-y divide-gray-100 max-h-[440px] overflow-y-auto">
                {questions.map((q, i) => (
                  <div key={q.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm text-gray-900 flex-1">
                        <span className="text-gray-400 mr-2">{i + 1}.</span>{q.text}
                      </div>
                      <button onClick={() => toggleQuestion(q.id, q.active)}
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${q.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {q.active ? 'Activ' : 'Inactiv'}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {q.options.map(opt => (
                        <div key={opt.id} className={`text-xs px-2 py-1 rounded ${opt.isCorrect ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                          {opt.isCorrect ? '✓' : '○'} {opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-64 text-gray-400">
              Selectați un test pentru a vedea și gestiona întrebările
            </div>
          )}
        </div>
      </div>

      {/* Modal test nou */}
      {showTestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Test nou</h2>
            <form onSubmit={createTest} className="space-y-4">
              <input type="text" placeholder="Titlu test" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={testForm.title} onChange={e => setTestForm(p => ({ ...p, title: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Întrebări per test</label>
                  <input type="number" min={1} max={50} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
                    value={testForm.questionsPerAttempt} onChange={e => setTestForm(p => ({ ...p, questionsPerAttempt: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Prag promovare</label>
                  <input type="number" min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
                    value={testForm.passingScore} onChange={e => setTestForm(p => ({ ...p, passingScore: +e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={testForm.published} onChange={e => setTestForm(p => ({ ...p, published: e.target.checked }))} />
                Publică imediat
              </label>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowTestForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">Anulează</button>
                <button type="submit" className="px-4 py-2 text-sm bg-aep-600 text-white rounded-lg hover:bg-aep-700">Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal întrebare nouă */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Întrebare nouă</h2>
            <form onSubmit={createQuestion} className="space-y-4">
              <textarea placeholder="Textul întrebării" required rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={qForm.text} onChange={e => setQForm(p => ({ ...p, text: e.target.value }))} />
              <div>
                <label className="text-xs text-gray-600 block mb-2">Variante de răspuns (bifați cea corectă):</label>
                {qForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input type="checkbox" checked={opt.isCorrect} onChange={e => updateOption(i, 'isCorrect', e.target.checked)}
                      className="flex-shrink-0" />
                    <input type="text" placeholder={`Variantă ${i + 1}`}
                      className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                      value={opt.text} onChange={e => updateOption(i, 'text', e.target.value)} />
                  </div>
                ))}
              </div>
              <textarea placeholder="Explicație (opțional)" rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={qForm.explanation} onChange={e => setQForm(p => ({ ...p, explanation: e.target.value }))} />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowQuestionForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">Anulează</button>
                <button type="submit" className="px-4 py-2 text-sm bg-aep-600 text-white rounded-lg hover:bg-aep-700">Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
