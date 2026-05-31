# Ghid Administrator — AEP Instruire Online

## Acces panou admin

URL: `/admin` (accesibil doar pentru roluri SUPER_ADMIN, CONTENT_ADMIN, REPORTING_ADMIN)

## Crearea primului cont admin

```bash
npm run create-admin
```

Urmați instrucțiunile interactive pentru a seta email, nume și parolă.

## Dashboard

Pagina principală afișează:
- Statistici utilizatori (total, activi, neconfirmați, înregistrări recente)
- Statistici conținut (module, lecții)
- Rate de finalizare și promovare teste
- Top județe după numărul de utilizatori
- Distribuție pe calități

## Gestionare utilizatori

**Funcționalități:**
- Căutare după email sau nume
- Filtrare după status (Activ, În așteptare, Suspendat)
- Activare / Suspendare conturi
- Export CSV sau Excel

## Gestionare conținut

**Categorii:** Creați categorii principale și subcategorii pentru fiecare tip de alegeri.

**Module:** Grupuri de lecții în cadrul unei categorii. Setați ordinea de afișare.

**Lecții:** Fiecare lecție poate conține:
- Video (upload direct sau URL extern)
- Suport PDF
- Test asociat
- Procent minim vizionare pentru deblocarea testului

**Publicare:** Conținutul este vizibil utilizatorilor doar după publicare explicită.

## Gestionare teste

**Creare test:**
1. Selectați „+ Test nou"
2. Completați titlul, numărul de întrebări și pragul de promovare
3. Adăugați întrebări manual sau importați din CSV

**Format CSV import:**
```csv
text,optiune1,optiune2,optiune3,optiune4,corecta,explicatie
"Câte circumscripții electorale...",41,42,43,44,A,"Conform art. 5 din Legea 208/2015"
```

Utilizare: `npm run import-questions -- --file intrebari.csv --testId <ID>`

## Calendar evenimente

Adăugați instruiri cu:
- Titlu și descriere
- Județ (sau național pentru toate județele)
- Dată și oră (start + final)
- Locație fizică și/sau link online
- Public țintă
- Status publicat/nepublicat

## Rapoarte și exporturi

1. Navigați la **Admin → Rapoarte**
2. Selectați tipul de raport (Utilizatori sau Teste)
3. Setați intervalul de date
4. Alegeți formatul: **CSV** sau **Excel (.xlsx)**
5. Apăsați „Export"

Pentru grafice interactive, apăsați **„Reîncarcă grafice"** în tab-ul Grafice.

## Setări aplicație

| Setare | Cheie | Descriere |
|---|---|---|
| Numele aplicației | `app.name` | Afișat în header și emails |
| Text prezentare | `homepage.presentation` | Textul de pe homepage |
| URL logo | `app.logo_url` | URL logo AEP |
| Versiune GDPR | `gdpr.policy_version` | Versiunea curentă a politicii |
| Instrucțiuni CI | `ci.update_instructions` | Text afișat la CI expirată |

## Jurnal audit

Disponibil la `/api/admin/audit` — înregistrează toate acțiunile administrative cu:
- Utilizatorul care a efectuat acțiunea
- Acțiunea (CREATE, UPDATE, DELETE, etc.)
- Entitatea modificată
- Timestamp
- Adresa IP
