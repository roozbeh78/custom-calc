/** تعریف ورودی‌ها. suffix اگر تابع باشد، بعد از هر محاسبه دوباره ساخته می‌شود. */
export const FIELD_GROUPS = [
  {
    title: "ارز و ارزش",
    fields: [
      { key: "declRate", label: "نرخ ارز اظهار", suffix: (s) => `${s.unit} به ازای هر واحد ارز` },
      { key: "declValueFX", label: "ارزش کل اظهار", suffix: "ارزی — مبنای هر سه رویه" },
      { key: "actualValueFX", label: "ارزش کل واقعی", suffix: "ارزی" },
      { key: "freeRate", label: "نرخ ارز آزاد" },
      { key: "govRate", label: "نرخ ارز دولتی", suffix: "صفر یعنی کل خرید با ارز آزاد" },
    ],
  },
  {
    title: "اجزای ارزش گمرکی — CIF",
    fields: [
      { key: "intlFreight", label: "کرایه حمل بین‌المللی", suffix: "ترم CFR / CPT" },
      { key: "insurance", label: "بیمه" },
      { key: "policyAmount", label: "مبلغ بیمه‌نامه" },
      { key: "hasPolicy", label: "بیمه‌نامه دارد", type: "check" },
    ],
  },
  {
    title: "نرخ‌های رویه گمرکی",
    fields: [
      { key: "rateTotal", label: "ماخذ کل", decimals: 1, suffix: (s, c) => `سود بازرگانی: ${c.commercial.toFixed(1)}٪` },
      { key: "dutyRate", label: "حقوق ورودی", decimals: 1, suffix: "درصد" },
      { key: "discountPct", label: "تخفیف سود بازرگانی", decimals: 1, suffix: (s, c) => `ماخذ با تخفیف: ${c.rateDisc.toFixed(1)}٪` },
      { key: "vatRate", label: "ارزش افزوده", decimals: 1, suffix: "درصد" },
      { key: "warLevy", label: "عوارض جنگی", decimals: 1, suffix: "در هزار" },
      { key: "prepaidTax", label: "مالیات علی‌الحساب", decimals: 1, suffix: "درصد" },
    ],
  },
  {
    title: "نرخ‌های رویه ملوانی",
    fields: [
      { key: "melDutyShare", label: "سهم حقوق ورودی", decimals: 1, suffix: "درصدِ حقوق ورودی" },
      { key: "melDomesticShare", label: "سهم سود بازرگانی — تولید داخل دارد", decimals: 1, suffix: "درصد" },
      { key: "melOtherShare", label: "سهم سود بازرگانی — سایر کالاها", decimals: 1, suffix: "درصد" },
      { key: "melVatRate", label: "ارزش افزوده ملوانی", decimals: 1, suffix: "درصد" },
      { key: "lenjFreight", label: "کرایه لنج", suffix: "در صورت رویه لنجی، بدون ماخذ" },
      { key: "isDomestic", label: "کالا تولید داخل دارد", type: "check" },
    ],
  },
  {
    title: "مقدار و فروش",
    fields: [
      { key: "waste", label: "پسماند" },
      { key: "qty", label: "تعداد یا مقدار", suffix: "واحد" },
      { key: "containers", label: "تعداد کانتینر", decimals: 2 },
      { key: "salePrice", label: "فروش هر واحد در بازار" },
    ],
  },
];

export const TAX_FIELDS = [
  { key: "assumedMargin", label: "سود مفروض سازمان مالیاتی", decimals: 1, suffix: "درصد" },
  { key: "corpTaxRate", label: "نرخ مالیات بر درآمد", decimals: 1, suffix: "درصد" },
];
