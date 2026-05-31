export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact AEP</h1>
        <div className="space-y-4 text-gray-700">
          <div className="bg-aep-50 rounded-xl p-5">
            <h2 className="font-semibold text-aep-800 mb-3">Autoritatea Electorală Permanentă</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2"><dt className="text-gray-500 w-24">Adresă:</dt><dd>Str. Stavropoleos nr. 6, sector 3, București, 030084</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-24">Telefon:</dt><dd><a href="tel:0371307503" className="text-aep-600 hover:underline">0371.307.503</a></dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-24">Email:</dt><dd><a href="mailto:contact@roaep.ro" className="text-aep-600 hover:underline">contact@roaep.ro</a></dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-24">Web:</dt><dd><a href="https://www.roaep.ro" target="_blank" rel="noopener" className="text-aep-600 hover:underline">www.roaep.ro</a></dd></div>
            </dl>
          </div>
          <p className="text-sm text-gray-500">
            Pentru probleme tehnice legate de platformă, vă rugăm să menționați în email adresa de cont și descrierea problemei întâmpinate.
          </p>
        </div>
      </div>
    </div>
  )
}
