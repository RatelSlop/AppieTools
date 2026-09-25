# 🛒 AppieTools

> **Albert Heijn Vervangend Productlabel Printer & EAN Barcode Generator**  
> Live op: [appietools.hooijmaijers.me](https://appietools.hooijmaijers.me)

AppieTools is een moderne webapplicatie ontworpen om snel en accuraat vervangende productlabels af te drukken voor Albert Heijn artikelen waarvan het label of de streepjescode beschadigd of verdwenen is. Daarnaast bevat de app een volwaardige GS1 EAN-13 en EAN-8 barcode generator.

---

## ✨ Functionaliteiten

### 🏷️ 1. AH Vervangend Productlabel Printer
- **Live Albert Heijn Assortiment Doorzoeken**: Zoek elk artikel op naam, merk of artikelnummer via de officiële AH catalogus.
- **Automatische EAN/GTIN Ophalen**: Haalt direct de officiële streepjescode (GTIN-13) van het product op.
- **Printwachtrij**: Voeg meerdere verschillende producten toe en stel per product het gewenst aantal af te drukken exemplaren in (`+` / `-`).
- **Productfoto op het label**: Schakel met 1 klik in of de officiële productfoto op het label geprint moet worden (strak linksboven naast de titel).
- **Handmatig Aanpassen**: Bewerk producttitel, formaat/gewicht, artikelnummer, barcode of afbeelding-URL met live GS1-validatie.
- **A4 Stickervel Ondersteuning**:
  - **Standaard stickervel (70 × 37 mm)**: 24 labels per vel (3 kolommen × 8 rijen, bijv. Avery 3474 / Herma 4459).
  - **Breed stickervel (105 × 37 mm)**: 16 labels per vel (2 kolommen × 8 rijen).
  - **Aangepast formaat**: Eigen kolommen, rijen en marges instelbaar.
- **Kniplijnen voor blanco papier**: Schakel subtiele stippellijnen in om labels op standaard A4-papier met een schaar of papiersnijder uit te knippen.
- **Startpositie overslaan**: Sla reeds gebruikte stickers op een aangebroken stickervel over.
- **Geoptimaliseerde Printoutput**: CSS `@page { size: A4 portrait; margin: 0; }` met 100% zwart/wit contrast voor optimale barcodescanners.

### 🔢 2. EAN Barcode Generator
- **EAN-13 & EAN-8 Ondersteuning**: Genereer geldige retail barcodes.
- **Realtime Check-Digit Validatie**:
  - Bereken automatisch het 13e of 8e controlegetal volgens het GS1-algoritme.
  - Detecteer foutieve check-digits en herstel met 1 klik.
- **Willekeurige barcode generator**: Genereer met 1 klik een geldige GS1 barcode met Nederlandse landcode `87`.
- **Exportmogelijkheden**:
  - Download als **PNG** (hoge resolutie)
  - Download als **SVG** (vector)
  - Kopieer barcodecijfers naar het klembord
  - **"Naar Printwachtrij"**: Stuur de aangemaakte barcode direct door naar de A4-vellenmaker.

---

## 🛠️ Technologieën

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) met Dark Mode en Print media queries
- **Barcode Rendering**: [JsBarcode](https://lindell.me/JsBarcode/) (GS1-conforme EAN rendering)
- **Iconen**: [Lucide React](https://lucide.dev/)
- **Hosting & Serverless Proxy**: [Cloudflare Pages](https://pages.cloudflare.com/) + [Pages Functions](https://developers.cloudflare.com/pages/platform/functions/) (`/functions/api/search.ts` en `/functions/api/product/[id].ts`)

---



## ⚖️ Disclaimer

AppieTools is een onafhankelijk open-source project en is **niet** gelieerd aan, gesponsord door of goedgekeurd door Koninklijke Ahold Delhaize N.V. of Albert Heijn B.V. Alle productnamen, logo's en merken zijn eigendom van hun respectievelijke eigenaren.
