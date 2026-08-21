export const SCENARIOS = ["full", "disc", "mel"];

export const SCENARIO_NAMES = {
  full: "گمرکی بدون تخفیف",
  disc: "گمرکی با تخفیف",
  mel: "ملوانی",
};

export const DEFAULT_INPUT = {
  // ارز و ارزش
  declRate: 0,
  declValueFX: 0,
  freeRate: 0,
  govRate: 0,
  actualValueFX: 0,

  // اجزای ارزش گمرکی (CIF)
  intlFreight: 0,
  insurance: 0,
  hasPolicy: false,
  policyAmount: 0,

  // نرخ‌های رویه گمرکی
  rateTotal: 0,
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
  qty: 0,
  containers: 0,
  salePrice: 0,

  // مالیات
  assumedMargin: 10,
  corpTaxRate: 25,
};
