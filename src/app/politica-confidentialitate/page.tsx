export default function PoliticaConfidentialitate() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Politică de confidențialitate</h1>
        <div className="prose prose-sm text-gray-700 space-y-4">
          <p>AEP prelucrează datele cu caracter personal ale utilizatorilor platformei AEP Instruire Online în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația națională aplicabilă.</p>
          <h2 className="text-lg font-semibold mt-6">Date prelucrate</h2>
          <p>Platforma prelucrează: date de identificare (nume, prenume, email), date de contact (telefon, adresă), date demografice (data nașterii, sex, județ, studii), date de activitate (progres lecții, rezultate teste).</p>
          <h2 className="text-lg font-semibold mt-6">Scopul prelucrării</h2>
          <p>Datele sunt prelucrate exclusiv în scopul furnizării serviciului de instruire electorală și nu sunt transmise unor terțe părți fără consimțământul dvs.</p>
          <h2 className="text-lg font-semibold mt-6">Drepturile dvs.</h2>
          <p>Aveți dreptul de acces, rectificare, ștergere, restricționare a prelucrării și portabilitate a datelor. Puteți exercita aceste drepturi contactând AEP la <a href="mailto:contact@roaep.ro" className="text-aep-600 hover:underline">contact@roaep.ro</a>.</p>
          <h2 className="text-lg font-semibold mt-6">Contact DPO</h2>
          <p>Responsabilul cu protecția datelor poate fi contactat la: <a href="mailto:dpo@roaep.ro" className="text-aep-600 hover:underline">dpo@roaep.ro</a></p>
        </div>
      </div>
    </div>
  )
}
