# Business Requirements Document (BRD)
# Łódzkie Latrynki — Mapa Toalet Miejskich w Łodzi

**Wersja:** 1.0
**Data:** 2026-03-26
**Autor:** Tomek
**Status:** Draft

---

## 1. Kontekst biznesowy

### Problem
Łódź posiada ponad 50 publicznych toalet miejskich, jednak mieszkańcy i turyści nie wiedzą o ich istnieniu ani lokalizacji. Brakuje centralnego, mobilnego narzędzia, które w prosty sposób pokazałoby najbliższą dostępną toaletę wraz z informacjami o godzinach otwarcia, cenie i dostępności.

### Inicjatywa
W marcu 2026 radny Marcin Hencz (KO) złożył interpelację do Prezydent Łodzi w sprawie wdrożenia cyfrowej mapy toalet — wzorem Warszawy, która od lutego 2026 udostępnia aplikację "Mapa WC" z 350 tabliczkami QR w terenie. Projekt "Łódzkie Latrynki" realizuje tę ideę jako niezależna, open-source aplikacja webowa.

### Inspiracja — Warszawa "Mapa WC"
Warszawa wdrożyła system obejmujący: interaktywną mapę z GPS, dane o godzinach/cenach/dostępności, tablice QR w 350 lokalizacjach, wsparcie wielojęzyczne. Łódź może osiągnąć podobny efekt mniejszym kosztem dzięki aplikacji webowej parseującej istniejące dane UML.

### Powiązane inicjatywy
- **"Przyjazne Miasto"** — aplikacja Uniwersytetu Łódzkiego i SWPS z mapą toalet w Śródmieściu (grant z Budżetu Obywatelskiego 2025)
- **Tech-Mate.PL** — ogólnopolska mapa darmowych toalet publicznych

---

## 2. Cele projektu

| # | Cel | Metryka sukcesu |
|---|-----|-----------------|
| C1 | Ułatwienie znalezienia najbliższej toalety | Czas do znalezienia < 10s od otwarcia app |
| C2 | Automatyczna aktualność danych | Dane parsowane z UML 1x dziennie, delta < 24h |
| C3 | Dostępność dla turystów | 5 wersji językowych (PL, EN, DE, ES, UA) |
| C4 | Możliwość rozbudowy przez społeczność | Crowdsourcing: użytkownicy zgłaszają nowe lokalizacje |
| C5 | Niski koszt utrzymania | Hosting na Vercel Free/Pro, brak backendu |

---

## 3. Zakres funkcjonalny

### 3.1 MVP (v1.0)

**Mapa interaktywna**
- Wyświetlanie pinów toalet na mapie (Mapbox/Leaflet)
- Geolokalizacja użytkownika ("pokaż najbliższe")
- Klaster pinów przy oddaleniu
- Filtrowanie: darmowe/płatne, dostępne dla niepełnosprawnych, otwarte teraz

**Karta toalety (popup/panel)**
- Adres i nazwa lokalizacji
- Godziny otwarcia (z oznaczeniem "otwarte teraz")
- Typ: darmowa / płatna (kwota)
- Dostępność dla osób z niepełnosprawnościami
- Nawigacja (link do Google Maps / Apple Maps)
- Opis (typ kabin, liczba)

**Parsowanie danych UML**
- Automatyczne pobieranie danych z https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/
- Geocoding adresów na współrzędne GPS
- Cron job 1x dziennie (Vercel Cron)
- Cache wyników w JSON/KV store

**Wielojęzyczność**
- PL (domyślny), EN, DE, ES, UA
- Tłumaczenie UI + dynamicznych danych (typy, statusy)
- Automatyczny wybór języka na podstawie przeglądarki

### 3.2 v1.1 — Crowdsourcing

**Zgłaszanie lokalizacji**
- Formularz: adres, typ, godziny, zdjęcie (opcjonalnie)
- Oznaczenie "zgłoszone przez społeczność" vs "oficjalne (UML)"
- System moderacji (prosta kolejka admin)

**Panel admina (prosty)**
- Lista zgłoszeń do zatwierdzenia
- Edycja/usuwanie lokalizacji
- Dashboard: ile toalet, ile zgłoszeń

### 3.3 v2.0 — Rozszerzenia (przyszłość)

- QR kody do druku (generowane per lokalizacja)
- PWA z powiadomieniami offline
- Integracja z API "Przyjazne Miasto"
- Oceny i komentarze użytkowników
- Statystyki odwiedzin

---

## 4. Użytkownicy i kontekst użycia

### Persony

**Anna, 32 — Mieszkanka Łodzi z dzieckiem**
- Kontekst: spacer po Piotrkowskiej z 3-latkiem, pilna potrzeba
- Potrzeba: szybko znaleźć najbliższą DARMOWĄ toaletę z przewijakiem
- Urządzenie: iPhone, Safari

**Klaus, 58 — Turysta z Niemiec**
- Kontekst: weekend w Łodzi, nie zna miasta, nie mówi po polsku
- Potrzeba: mapa po niemiecku, nawigacja do najbliższej toalety
- Urządzenie: Android, Chrome

**Oksana, 24 — Studentka z Ukrainy**
- Kontekst: nowa w Łodzi, szuka darmowych toalet w okolicy kampusu
- Potrzeba: ukraińska wersja, filtr "darmowe"
- Urządzenie: Android, Chrome

**Bartek, 45 — Przewodnik PTTK**
- Kontekst: prowadzi grupę 20 osób po Łodzi
- Potrzeba: planowanie trasy z uwzględnieniem toalet, informacja o pojemności
- Urządzenie: telefon + tablet

### Konteksty użycia (kiedy ktoś tego potrzebuje)

1. **Pilna potrzeba** — "gdzie jest najbliższa toaleta?" (geolokalizacja → najbliższy pin)
2. **Planowanie trasy** — "jakie toalety są po drodze?" (widok mapy z filtrami)
3. **Nocna potrzeba** — "co jest otwarte o 23:00?" (filtr godzinowy)
4. **Oszczędność** — "gdzie jest darmowa toaleta?" (filtr bezpłatne)
5. **Dostępność** — "toaleta dla osoby na wózku" (filtr niepełnosprawni)
6. **Turysta** — skan QR kodu → mapa w jego języku

---

## 5. Wymagania niefunkcjonalne

| Wymaganie | Wartość docelowa |
|-----------|-----------------|
| Czas ładowania (LCP) | < 2.5s na 3G |
| Rozmiar bundla JS | < 200KB gzipped |
| Dostępność (WCAG) | Poziom AA |
| SEO | Core Web Vitals zielone |
| Uptime | 99.9% (Vercel SLA) |
| Responsywność | Mobile-first, 320px+ |
| Offline | Service worker z cache mapy |

---

## 6. Źródło danych

### Strona UML
- URL: `https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/`
- Format: HTML rejestr z paginacją (`tx_edgeregisters_showregister[currentPage]`)
- Pola: lokalizacja, opis, godziny, typ (płatna/bezpłatna), dostępność
- ~50 wpisów, paginacja po ~20
- Brak publicznego API — wymagany scraping HTML

### Geocoding
- Adresy z UML → współrzędne GPS via Nominatim (OpenStreetMap) lub Google Geocoding API
- Cache wyników geocodingu (adresy się rzadko zmieniają)

---

## 7. Ograniczenia i ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| UML zmieni strukturę HTML | Średnie | Wysoki | Monitoring scraper + alerty |
| UML zablokuje scraping | Niskie | Krytyczny | Kontakt z UML, rate limiting, cache |
| Geocoding niedokładny | Średnie | Średni | Manual override, weryfikacja GPS |
| Spam w crowdsourcingu | Wysokie | Średni | Moderacja, rate limit, captcha |
| RODO przy crowdsourcingu | Niskie | Średni | Anonimowe zgłoszenia, brak kont |

---

## 8. Interesariusze

| Rola | Osoba/Organizacja |
|------|-------------------|
| Product Owner | Tomek |
| Design | ux-ui-pro-max (plugin) |
| Rozwój | Tomek + społeczność |
| Dane źródłowe | UML Łódź |
| Hosting | Vercel |
| Inspiracja | Radny Marcin Hencz (KO) |
