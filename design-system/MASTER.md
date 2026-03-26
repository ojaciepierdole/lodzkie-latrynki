# Design System — Łódzkie Latrynki

## Brand DNA

**Ton:** Lekki z charakterem. Humor w nazwie — wykorzystujemy go. Serwis "trzyma istotne instrumenty w dłoni" — łączy pilną potrzebę społeczną z obywatelskim zaangażowaniem w sprawy "nie cierpiące zwłoki". Microcopy jest z jajem, ale nigdy nie kosztem użyteczności.

**Misja designu:** Pokazać Urzędowi Miasta, że można zrobić coś szybko, ładnie i bez przetargów trwających miesiące. Civic-tech z ludzką twarzą.

**Tożsamość:** Łódzka. Cegła, fabryki, Manufaktura, Piotrkowska. Nie korporacyjny błękit — ciepło industrialnego miasta, które się odradza.

---

## Visual Style: Soft UI / Modern Card

Delikatne cienie, zaokrąglone karty, lekki depth. Ciepły feel inspirowany Apple Maps, ale z łódzkim charakterem. Karty unoszą się nad mapą z subtelnymi cieniami. Interfejs jest czysty, ale nie sterylny.

### Kluczowe cechy
- `border-radius: 16px` na kartach, `12px` na przyciskach, `9999px` na chipach/badge'ach
- Subtelne cienie: `0 2px 8px rgba(0,0,0,0.08)`, elevated: `0 8px 24px rgba(0,0,0,0.12)`
- Tło kart: białe (light) / slate-800 (dark) — z minimalnym border `1px solid`
- Brak gradientów w UI (wyjątek: hero/branding)
- Ikony: Lucide React (stroke-width: 1.75, nie 2.0 — delikatniejsze)

---

## Color System

### Inspiracja
Łódzka paleta: cegła kamienic + industrialny szary + zieleń parków + złoto herbu.

### Tokeny

```
--color-primary:        #9A3412    // Terracotta/cegła — tożsamość Łodzi
--color-primary-hover:  #7C2D12    // Ciemniejsza cegła
--color-primary-light:  #FDBA74    // Jasny amber (hover bg, tła)

--color-accent-free:    #059669    // Zielony — toalety darmowe
--color-accent-paid:    #2563EB    // Niebieski — toalety płatne
--color-accent-accessible: #7C3AED // Fioletowy — dostępność

--color-cta:            #EA580C    // Pomarańcz — CTA, "Nawiguj"
--color-cta-hover:      #C2410C

--color-bg:             #FFFBF5    // Ciepły off-white (nie zimny #F8FAFC)
--color-card:           #FFFFFF
--color-surface:        #FEF7ED    // Subtelnie ciepły tło sekcji

--color-text:           #292524    // Warm stone-900
--color-text-secondary: #78716C    // Warm stone-500
--color-text-muted:     #A8A29E    // Stone-400

--color-border:         #E7E5E4    // Stone-200
--color-border-strong:  #D6D3D1    // Stone-300

--color-success:        #059669
--color-warning:        #D97706
--color-error:          #DC2626

--color-map-bg-dark:    #1C1917    // Stone-900 — dark mode mapa
```

### Dark Mode

```
--color-bg:             #1C1917    // Stone-900
--color-card:           #292524    // Stone-800
--color-surface:        #1C1917
--color-text:           #FAFAF9    // Stone-50
--color-text-secondary: #A8A29E    // Stone-400
--color-border:         #44403C    // Stone-700
--color-primary:        #FB923C    // Jaśniejszy amber (lepszy kontrast na ciemnym)
--color-primary-light:  #431407    // Ciemny amber bg
```

### Kolory markerów mapy

| Typ | Kolor tła | Ikona | Border |
|-----|-----------|-------|--------|
| Darmowa | `#059669` (emerald) | Biała SVG | `2px solid white` |
| Płatna | `#2563EB` (blue) | Biała SVG | `2px solid white` |
| Dostępna | Jak wyżej + ring `#7C3AED` | + ikona ♿ | Double ring |
| Zamknięta | `#A8A29E` (stone-400) | Szara SVG | `2px solid white` |
| Użytkownik | `#EA580C` (orange) | Pulsująca kropka | Glow ring |

---

## Typography

### Font: Plus Jakarta Sans

Ciepły, przyjazny, nowoczesny geometric sans. Doskonałe polskie diakrytyki. Jedna rodzina — prostota.

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
```

### Skala typograficzna

| Rola | Rozmiar | Weight | Line-height | Tracking |
|------|---------|--------|-------------|----------|
| Display (hero) | 32px | 800 (ExtraBold) | 1.1 | -0.02em |
| H1 (tytuł strony) | 24px | 700 (Bold) | 1.2 | -0.01em |
| H2 (sekcja) | 20px | 700 | 1.3 | 0 |
| H3 (karta) | 16px | 600 (SemiBold) | 1.4 | 0 |
| Body | 16px | 400 (Regular) | 1.5 | 0 |
| Body small | 14px | 400 | 1.5 | 0 |
| Caption | 12px | 500 (Medium) | 1.4 | 0.01em |
| Badge/chip | 12px | 600 | 1.0 | 0.02em |
| Button | 14px | 600 | 1.0 | 0.01em |

### Tailwind config

```js
fontFamily: {
  sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
}
```

---

## Ikony: Lucide React

```bash
npm install lucide-react
```

### Mapowanie ikon

| Koncept | Ikona Lucide | Uwagi |
|---------|-------------|-------|
| Toaleta | Custom SVG | Dedykowana ikona (nie emoji 🚽) |
| Darmowa | `CircleDollarSign` (przekreślony) lub badge | Zielony |
| Płatna | `Coins` | Niebieski |
| Dostępna | `Accessibility` | Fioletowy |
| Nawiguj | `Navigation` | CTA orange |
| Godziny | `Clock` | |
| Otwarte | `DoorOpen` | Zielony |
| Zamknięte | `DoorClosed` | Czerwony |
| Filtr | `SlidersHorizontal` | |
| Lokalizacja | `MapPin` | |
| Moja lokalizacja | `LocateFixed` | |
| Język | `Globe` | |
| Zgłoś | `MessageSquarePlus` | |
| Recenzja | `Star` / `ThumbsUp` | |
| Info | `Info` | |

### Custom SVG marker — toaleta

Dedykowana ikona toalety zamiast emoji. Styl: outline, stroke-width 1.75, zaokrąglone końcówki (round line-cap). Spójna z Lucide. Rozmiar markera: 36x36px na mapie.

---

## Komponenty

### Bottom Sheet (ToiletCard)

Mobilny standard — slide-up z dołu. Na desktop: side panel (360px).

```
┌──────────────────────────────────┐
│  ━━━ (drag handle)               │
│                                  │
│  🏛️ Park Piłsudskiego           │  ← H3, 16px/600
│  ul. Piłsudskiego, Łódź         │  ← Body small, secondary
│                                  │
│  [Bezpłatna] [♿ Dostępna]       │  ← Badge chips
│                                  │
│  🕐 8:00–20:00 · Otwarte        │  ← Status z ikoną
│  📝 2 kabiny + 2 dla osób z...  │  ← Opis
│                                  │
│  ★★★★☆ (4.2) · 12 opinii        │  ← Recenzje (v1.1)
│                                  │
│  ┌─────────────────────────────┐ │
│  │   🧭 Nawiguj (2 min pieszo) │ │  ← CTA primary, orange
│  └─────────────────────────────┘ │
│                                  │
│  [Dodaj opinię]  [Zgłoś problem] │  ← Secondary actions
└──────────────────────────────────┘
```

### FilterBar

Sticky pod headerem. Scrollowalny horyzontalnie na mobile.

```
[ 🕐 Otwarte teraz ] [ 🆓 Za darmo ] [ ♿ Dostępne ] [ 📍 Najbliższe ]
```

Aktywny chip: `bg-primary text-white`, nieaktywny: `bg-surface text-secondary border`.

### Header

```
┌────────────────────────────────────────┐
│  [logo] Łódzkie Latrynki    [🌐 PL ▾] │
│         „Pilne sprawy miasta"          │  ← tagline, caption
└────────────────────────────────────────┘
```

Logo: custom SVG — stylizowana toaleta/pin w kształcie nawiązującym do łódki (herb Łodzi). Kolor: terracotta.

---

## Microcopy — Ton i charakter

### Zasady
1. **Pilność + humor** — "nie cierpiące zwłoki" jest dosłowne i metaforyczne
2. **Nigdy wulgarnie** — dowcip jest inteligentny, nie toaletowy
3. **Użyteczność > żartu** — jeśli żart zaciemnia informację, wyrzucamy żart
4. **Łódzki patriotyzm** — dumni z miasta, nie sarkastyczni

### Przykłady microcopy

| Kontekst | Zamiast | Lepiej |
|----------|---------|--------|
| Ładowanie mapy | "Ładowanie..." | "Szukamy najbliższej przystani..." |
| Brak wyników filtra | "Brak wyników" | "Żadna latrynka nie spełnia kryteriów. Poluzuj filtry!" |
| Geolokalizacja | "Pokaż moją lokalizację" | "Gdzie jestem? (i gdzie najbliższa?)" |
| Toaleta otwarta | "Otwarte" | "Otwarte — zapraszamy!" |
| Toaleta zamknięta | "Zamknięte" | "Zamknięte — trzeba poszukać dalej" |
| Nawiguj | "Nawiguj" | "Prowadź mnie!" |
| Zgłoś toaletę | "Zgłoś" | "Znasz latrynkę? Podziel się!" |
| Sukces zgłoszenia | "Dziękujemy" | "Dzięki! Łódź Ci nie zapomni." |
| Błąd | "Coś poszło nie tak" | "Ups — coś się zacięło. Spróbuj jeszcze raz." |
| 24h | "Czynne 24h" | "Non-stop. Dzień i noc." |
| Darmowa | "Bezpłatna" | "Za darmo!" |
| Footer | "Dane: UML" | "Dane z Urzędu Miasta Łodzi. Robimy to szybciej niż przetarg." |

---

## Spacing System

Bazowy: 4px. Skala: 4, 8, 12, 16, 20, 24, 32, 48, 64.

| Token | Wartość | Użycie |
|-------|---------|--------|
| `space-1` | 4px | Wewnętrzny padding ikon |
| `space-2` | 8px | Gap między elementami inline |
| `space-3` | 12px | Padding chipów, badge'ów |
| `space-4` | 16px | Padding kart, sekcji |
| `space-5` | 20px | Gap między sekcjami karty |
| `space-6` | 24px | Margines sekcji |
| `space-8` | 32px | Duży separator |
| `space-12` | 48px | Hero spacing |

---

## Animation

| Typ | Duration | Easing | Trigger |
|-----|----------|--------|---------|
| Chip toggle | 150ms | ease-out | Click |
| Bottom sheet open | 300ms | cubic-bezier(0.32, 0.72, 0, 1) | Marker click |
| Bottom sheet drag | real-time | spring | Touch drag |
| Marker pop-in | 200ms | ease-out + scale 0→1 | Data load |
| Card hover (desktop) | 200ms | ease | Hover |
| Toast appear | 200ms | ease-out | Event |
| Toast dismiss | 150ms | ease-in | Auto 4s |
| Lokalizacja pulse | 2s loop | ease-in-out | Continuous |

### `prefers-reduced-motion`
Wyłącz: marker pop-in, pulse, bottom sheet spring. Zachowaj: instant state changes.

---

## Responsive Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| `mobile` | < 640px | Full-width mapa, bottom sheet, stack |
| `tablet` | 640–1024px | Mapa + bottom sheet szerszy |
| `desktop` | > 1024px | Mapa + side panel 360px po prawej |

---

## Accessibility (WCAG AA)

- Kontrast tekstu: min 4.5:1 (body), 3:1 (large text, ikony)
- Touch targets: min 44x44px
- Wszystkie ikony z `aria-label`
- Focus ring: `2px solid var(--color-primary)`, offset 2px
- Skip-to-content link
- Badge'e statusu: kolor + ikona + tekst (nigdy sam kolor)
- `prefers-reduced-motion` respected
- Semantic HTML: `<main>`, `<nav>`, `<header>`, landmarks

---

## Anti-patterns (UNIKAJ)

- Emoji jako ikony strukturalne (🚽 ♿ 🕐) — używaj SVG
- Generyczny Tailwind blue (#3B82F6) bez kontekstu
- Zimne szarości (slate) — projekt jest ciepły (stone)
- Żart kosztem czytelności
- Gradient backgrounds
- Glassmorphism bez celu (blur kosztuje performance)
- Placeholder-only labels w formularzach
- Horizontal scroll na filtrach bez wskaźnika overflow
