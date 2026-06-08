/**
 * Curated list of Egyptian governorate capitals, major cities, and famous
 * landmarks used for instant client-side search in the map component.
 * Coordinates are WGS-84 decimal degrees, accurate to ~100 m.
 */

export interface EgyptPlace {
  en: string;
  ar: string;
  lat: number;
  lng: number;
}

export const EGYPT_PLACES: EgyptPlace[] = [
  // ── Greater Cairo ──────────────────────────────────────────────────────────
  { en: 'Cairo',                  ar: 'القاهرة',             lat: 30.0444,  lng: 31.2357  },
  { en: 'Giza',                   ar: 'الجيزة',              lat: 30.0131,  lng: 31.2089  },
  { en: 'Pyramids of Giza',       ar: 'الأهرامات',           lat: 29.9792,  lng: 31.1342  },
  { en: 'Sphinx',                 ar: 'أبو الهول',           lat: 29.9753,  lng: 31.1376  },
  { en: 'Khan el-Khalili',        ar: 'خان الخليلي',         lat: 30.0477,  lng: 31.2625  },
  { en: 'Egyptian Museum',        ar: 'المتحف المصري',       lat: 30.0478,  lng: 31.2336  },
  { en: 'Heliopolis',             ar: 'مصر الجديدة',         lat: 30.0888,  lng: 31.3219  },
  { en: 'Maadi',                  ar: 'المعادي',             lat: 29.9602,  lng: 31.2569  },
  { en: 'New Cairo',              ar: 'القاهرة الجديدة',     lat: 30.0300,  lng: 31.4700  },
  { en: '6th of October City',    ar: 'مدينة السادس من أكتوبر', lat: 29.9400, lng: 30.9300 },

  // ── Alexandria & Mediterranean coast ───────────────────────────────────────
  { en: 'Alexandria',             ar: 'الإسكندرية',          lat: 31.2001,  lng: 29.9187  },
  { en: 'Bibliotheca Alexandrina', ar: 'مكتبة الإسكندرية',  lat: 31.2089,  lng: 29.9092  },
  { en: 'Marsa Matruh',           ar: 'مرسى مطروح',          lat: 31.3525,  lng: 27.2373  },
  { en: 'Siwa Oasis',             ar: 'سيوة',                lat: 29.2033,  lng: 25.5195  },
  { en: 'Sahel (North Coast)',    ar: 'الساحل الشمالي',      lat: 31.0500,  lng: 28.3000  },

  // ── Canal Zone ─────────────────────────────────────────────────────────────
  { en: 'Port Said',              ar: 'بورسعيد',             lat: 31.2653,  lng: 32.3019  },
  { en: 'Ismailia',               ar: 'الإسماعيلية',         lat: 30.5965,  lng: 32.2715  },
  { en: 'Suez',                   ar: 'السويس',              lat: 29.9668,  lng: 32.5498  },

  // ── Nile Delta ─────────────────────────────────────────────────────────────
  { en: 'Mansoura',               ar: 'المنصورة',            lat: 31.0364,  lng: 31.3807  },
  { en: 'Tanta',                  ar: 'طنطا',                lat: 30.7865,  lng: 31.0004  },
  { en: 'Zagazig',                ar: 'الزقازيق',            lat: 30.5877,  lng: 31.5021  },
  { en: 'Damanhour',              ar: 'دمنهور',              lat: 31.0364,  lng: 30.4682  },
  { en: 'Kafr El Sheikh',         ar: 'كفر الشيخ',           lat: 31.1107,  lng: 30.9388  },
  { en: 'Damietta',               ar: 'دمياط',               lat: 31.4165,  lng: 31.8133  },
  { en: 'Banha',                  ar: 'بنها',                lat: 30.4618,  lng: 31.1833  },
  { en: 'Shibin El Kom',          ar: 'شبين الكوم',          lat: 30.5569,  lng: 31.0107  },

  // ── Upper Egypt ────────────────────────────────────────────────────────────
  { en: 'Minya',                  ar: 'المنيا',              lat: 28.1099,  lng: 30.7503  },
  { en: 'Asyut',                  ar: 'أسيوط',               lat: 27.1837,  lng: 31.1837  },
  { en: 'Sohag',                  ar: 'سوهاج',               lat: 26.5569,  lng: 31.6948  },
  { en: 'Qena',                   ar: 'قنا',                 lat: 26.1551,  lng: 32.7160  },
  { en: 'Beni Suef',              ar: 'بني سويف',            lat: 29.0731,  lng: 31.0979  },
  { en: 'Faiyum',                 ar: 'الفيوم',              lat: 29.3084,  lng: 30.8428  },

  // ── Luxor & Aswan ──────────────────────────────────────────────────────────
  { en: 'Luxor',                  ar: 'الأقصر',              lat: 25.6872,  lng: 32.6396  },
  { en: 'Karnak Temple',          ar: 'الكرنك',              lat: 25.7188,  lng: 32.6573  },
  { en: 'Valley of the Kings',    ar: 'وادي الملوك',         lat: 25.7402,  lng: 32.6014  },
  { en: 'Aswan',                  ar: 'أسوان',               lat: 24.0889,  lng: 32.8998  },
  { en: 'Aswan High Dam',         ar: 'السد العالي',         lat: 23.9700,  lng: 32.8774  },
  { en: 'Abu Simbel',             ar: 'أبو سمبل',            lat: 22.3372,  lng: 31.6258  },
  { en: 'Philae Temple',          ar: 'معبد فيلة',           lat: 24.0256,  lng: 32.8848  },

  // ── Red Sea Riviera ────────────────────────────────────────────────────────
  { en: 'Hurghada',               ar: 'الغردقة',             lat: 27.2579,  lng: 33.8116  },
  { en: 'El Gouna',               ar: 'الجونة',              lat: 27.3956,  lng: 33.6781  },
  { en: 'Marsa Alam',             ar: 'مرسى علم',            lat: 25.0653,  lng: 34.8903  },
  { en: 'Safaga',                 ar: 'سفاجا',               lat: 26.7517,  lng: 33.9364  },

  // ── Sinai ──────────────────────────────────────────────────────────────────
  { en: 'Sharm El Sheikh',        ar: 'شرم الشيخ',           lat: 27.9158,  lng: 34.3300  },
  { en: 'Dahab',                  ar: 'دهب',                 lat: 28.4852,  lng: 34.5130  },
  { en: 'Nuweiba',                ar: 'نويبع',               lat: 29.0651,  lng: 34.6660  },
  { en: 'Taba',                   ar: 'طابا',                lat: 29.5001,  lng: 34.8978  },
  { en: 'Arish',                  ar: 'العريش',              lat: 31.1302,  lng: 33.7987  },
  { en: 'Mount Sinai',            ar: 'جبل سيناء',           lat: 28.5393,  lng: 33.9750  },
];
