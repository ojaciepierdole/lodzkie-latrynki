export function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Łódzkie Latrynki',
    description: 'Interaktywna mapa publicznych toalet w Łodzi. Znajdź najbliższą toaletę z informacją o godzinach otwarcia, cenie i dostępności.',
    url: 'https://lodzkie-latrynki.vercel.app',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PLN',
    },
    areaServed: {
      '@type': 'City',
      name: 'Łódź',
      '@id': 'https://www.wikidata.org/wiki/Q580',
    },
    inLanguage: ['pl', 'en', 'de', 'es', 'uk'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
