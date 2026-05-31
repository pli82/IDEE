export default function HelpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ajutor & Contact AEP</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-semibold text-gray-900">Întrebări frecvente</h2>
        {[
          ['Cum accesez materialele de instruire?', 'Mergeți la secțiunea "Materiale de instruire" din meniul lateral și selectați categoria dorită.'],
          ['Cum susțin un test?', 'Deschideți o lecție, vizionați videoclipul și apăsați butonul "Testare" de sub player.'],
          ['Pot relua un test?', 'Da, testele pot fi reluate oricând. Istoricul tuturor încercărilor este salvat.'],
          ['Cum actualizez datele personale?', 'Mergeți la secțiunea "Profil" din meniu și editați informațiile.'],
          ['Ce înseamnă statusul CI expirat?', 'Dacă cartea de identitate este expirată, vă rugăm să contactați AEP conform instrucțiunilor afișate.'],
        ].map(([q, a]) => (
          <details key={q} className="group border border-gray-100 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 rounded-lg text-sm list-none flex justify-between">
              {q} <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-4 pb-3 pt-1 text-sm text-gray-600">{a}</p>
          </details>
        ))}
      </div>

      <div className="bg-aep-50 border border-aep-200 rounded-xl p-6">
        <h2 className="font-semibold text-aep-800 mb-3">Contact Autoritatea Electorală Permanentă</h2>
        <div className="space-y-2 text-sm text-aep-700">
          <p>🌐 Site web: <a href="https://www.roaep.ro" target="_blank" className="underline">www.roaep.ro</a></p>
          <p>📧 Email: <a href="mailto:contact@roaep.ro" className="underline">contact@roaep.ro</a></p>
          <p>📞 Telefon: 0371.307.503</p>
          <p>📍 Adresă: Str. Stavropoleos nr. 6, sector 3, București</p>
        </div>
      </div>
    </div>
  )
}
