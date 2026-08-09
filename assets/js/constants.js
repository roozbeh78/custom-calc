export const SCENARIOS = ["full", "disc", "mel"];

export const SCENARIO_NAMES = {
  full: "گمرکی بدون تخفیف",
  disc: "گمرکی با تخفیف",
  mel: "ملوانی",
};

export const DEFAULT_INPUT = {
  // ارز و ارزش
  declRate: 132000,
  declValueFX: 55000,
  freeRate: 188000,
  govRate: 0,
  actualValueFX: 87600,

  // اجزای ارزش گمرکی (CIF)
  intlFreight: 0,
  insurance: 10525667,
  hasPolicy: false,
  policyAmount: 50043532,

  // نرخ‌های رویه گمرکی
  rateTotal: 20,
  dutyRate: 4,
  discountPct: 20,
  vatRate: 10,
  warLevy: 12,
  prepaidTax: 2,

  // نرخ‌های رویه ملوانی
  melDutyShare: 80,
  melDomesticShare: 30,
  melOtherShare: 15,
  melVatRate: 5,
  isDomestic: true,
  lenjFreight: 0,

  // مقدار و فروش
  waste: 0,
  qty: 75000,
  containers: 0.25,
  salePrice: 400000,

  // مالیات
  assumedMargin: 10,
  corpTaxRate: 25,
};
