export type ActiveTab = 'label-printer' | 'barcode-generator';

export interface AhProductImage {
  width: number;
  height: number;
  url: string;
}

export interface AhDiscountLabel {
  code: string;
  defaultDescription: string;
  price?: number | null;
}

export interface AhProductCard {
  webshopId: number;
  hqId?: number;
  title: string;
  salesUnitSize?: string;
  unitPriceDescription?: string;
  images: AhProductImage[];
  currentPrice?: number | null;
  priceBeforeBonus?: number | null;
  bonusMechanism?: string;
  bonusEndDate?: string;
  isBonus?: boolean;
  mainCategory?: string;
  subCategory?: string;
  brand?: string;
}

export interface AhSearchResult {
  products?: AhProductCard[];
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface PrintLabelItem {
  id: string; // unique item uuid
  productId?: number; // AH webshopId
  title: string;
  salesUnitSize: string;
  articleNumber: string;
  barcode: string; // EAN-13 or EAN-8
  price?: number | null;
  quantity: number;
  imageUrl?: string;
}

export interface SheetTemplate {
  id: string;
  name: string;
  description: string;
  columns: number;
  rows: number;
  labelsPerPage: number;
  labelWidthMm: number;
  labelHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
  showCutLines: boolean;
}

export type BarcodeType = 'EAN13' | 'EAN8';
