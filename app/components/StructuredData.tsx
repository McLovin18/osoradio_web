/**
 * Componente para agregar estructuras de datos JSON-LD (Schema.org)
 * Esto ayuda a Google a entender mejor tu sitio
 */

export function StructuredData() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radiooso.ec";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Radio Oso - 98.5 FM",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Emisora de radio en Ecuador transmitiendo en 98.5 FM. Programas en vivo, la mejor música 24/7 y contenido de entretenimiento.",
    sameAs: [
      "https://www.instagram.com/radiooso_ec/",
      "https://www.facebook.com/radiooso_ec",
      "https://www.tiktok.com/@radiooso_ec",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "EC",
      addressLocality: "Ecuador",
      postalCode: "",
      streetAddress: "",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      telephone: "+593-968-514-889",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Radio Oso - 98.5 FM",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search-results?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const radioStationSchema = {
    "@context": "https://schema.org",
    "@type": "RadioStation",
    name: "Radio Oso - 98.5 FM",
    image: `${SITE_URL}/logo.png`,
    description:
      "Emisora de radio en Ecuador transmitiendo en 98.5 FM. Programas en vivo, la mejor música 24/7 y contenido de entretenimiento.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "EC",
      addressLocality: "Ecuador",
    },
    telephone: "+593-968-514-889",
    broadcastFrequency: "98.5 FM",
    areaServed: "EC",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(radioStationSchema),
        }}
      />
    </>
  );
}

