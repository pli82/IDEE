export default function TermeniUtilizare() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Termeni de utilizare</h1>
        <div className="prose prose-sm text-gray-700 space-y-4">
          <p>Prin utilizarea platformei AEP Instruire Online, acceptați termenii și condițiile de mai jos.</p>
          <h2 className="text-lg font-semibold mt-6">Utilizare permisă</h2>
          <p>Platforma este destinată exclusiv instruirii electorale a persoanelor implicate în procesele electorale din România. Utilizatorii se angajează să furnizeze informații corecte și să nu utilizeze platforma în scopuri frauduloase.</p>
          <h2 className="text-lg font-semibold mt-6">Proprietate intelectuală</h2>
          <p>Toate materialele de instruire (video, PDF, prezentări) sunt proprietatea Autorității Electorale Permanente și nu pot fi reproduse sau distribuite fără acordul scris al AEP.</p>
          <h2 className="text-lg font-semibold mt-6">Responsabilitate</h2>
          <p>AEP depune eforturi pentru menținerea disponibilității platformei, dar nu poate garanta funcționarea neîntreruptă. Rezultatele testelor au caracter informativ și nu constituie o certificare oficială.</p>
          <h2 className="text-lg font-semibold mt-6">Contact</h2>
          <p>Pentru întrebări: <a href="mailto:contact@roaep.ro" className="text-aep-600 hover:underline">contact@roaep.ro</a></p>
        </div>
      </div>
    </div>
  )
}
