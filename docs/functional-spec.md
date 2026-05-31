# Specificație Funcțională — AEP Instruire Online

**Versiune:** 1.0  
**Data:** 2024  
**Autor:** Autoritatea Electorală Permanentă

---

## 1. Obiectiv

Platforma AEP Instruire Online asigură instruirea electronică a personalului implicat în procese electorale din România. Sistemul oferă acces la materiale digitale, lecții video, teste de evaluare și un calendar al evenimentelor de instruire.

## 2. Utilizatori și roluri

| Rol | Acces | Descriere |
|---|---|---|
| **USER** | Secțiune utilizator | Utilizator standard — materiale, teste, profil |
| **CONTENT_ADMIN** | Admin > Conținut | Gestionare categorii, module, lecții, fișiere |
| **REPORTING_ADMIN** | Admin > Rapoarte | Acces rapoarte și exporturi |
| **SUPER_ADMIN** | Admin complet | Acces la toate funcționalitățile |

## 3. Flux înregistrare și autentificare

1. Utilizatorul completează formularul de înregistrare (email + parolă)
2. Sistemul trimite un OTP de 6 cifre pe email (valabil 10 minute)
3. La confirmare, apare **modal obligatoriu** cu întrebarea „Ce calitate aveți?"
4. Utilizatorul completează formularul de date personale (câmpuri obligatorii)
5. Accesul la materiale este condiționat de completarea profilului

## 4. Structura materialelor de instruire

```
Categorie (ex: Alegeri pentru Camera Deputaților și Senat)
└── Modul (ex: Procedura de vot)
    ├── Lecție 1: video + PDF + test
    ├── Lecție 2: video + PDF + test
    └── ...
```

**Categorii obligatorii:**
- Alegeri pentru Camera Deputaților și Senat
- Alegeri pentru Președintele României  
- Alegeri pentru autoritățile locale (generale + parțiale)
- Alegeri pentru Parlamentul European
- Referendum (național + local)

## 5. Sistem de testare

- Fiecare test conține 10 întrebări extrase aleator din baza de întrebări
- Fiecare întrebare valorează 1 punct; prag promovare: 7 puncte
- La final se afișează răspunsurile corecte (verde) și greșite (roșu)
- Testele pot fi reluate; istoricul tuturor încercărilor este păstrat
- Adminul poate seta un procent minim de vizionare video înainte de test

## 6. Calendar instruiri

- Evenimentele sunt organizate pe județe (41 județe + București)
- Fiecare eveniment: titlu, județ, locație/link, dată, oră, public țintă, status
- Utilizatorii văd implicit județul din profil
- Badge de notificare pentru evenimente noi în județ

## 7. Rapoarte și exporturi

- Export CSV și Excel (.xlsx) pentru utilizatori și rezultate teste
- Filtrare după perioadă, județ, calitate, modul, status promovare
- Grafice: distribuție județe, calitate, rată promovare pe module
- Rapoarte de îmbunătățire: întrebări dificile, module cu abandon ridicat

## 8. Securitate și GDPR

- Parole hash bcrypt (cost 12)
- OTP cu expirare și limită încercări
- Rate limiting la autentificare
- Sesiuni JWT httpOnly
- Audit log complet pentru acțiuni admin
- Consimțământ GDPR cu timestamp și versiune politică
- Avertizare CI expirată sau aproape de expirare
