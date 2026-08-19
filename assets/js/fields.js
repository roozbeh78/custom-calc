const f = (n) => (isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—");

/** تعریف ورودی‌ها. suffix اگر تابع باشد، بعد از هر محاسبه دوباره ساخته می‌شود. */
export const FIELD_GROUPS = [
  {
    title: "ارز، ارزش و مقدار",
    peek: (s) => `${f(s.declRate)} × ${f(s.declValueFX)} · ${f(s.qty)} واحد`,
    fields: [
      { key: "declRate", label: "نرخ ارز اظهار", suffix: (s) => `${s.unit} به ازای هر واحد ارز` },
      { key: "declValueFX", label: "ارزش کل اظهار", suffix: "ارزی — مبنای هر سه رویه" },
      { key: "actualValueFX", label: "ارزش کل واقعی", suffix: "ارزی" },
      { key: "freeRate", label: "نرخ ارز آزاد" },
      { key: "govRate", label: "نرخ ارز دولتی", suffix: "صفر یعنی کل خرید با ارز آزاد" },
      { key: "qty", label: "تعداد یا مقدار", suffix: "واحد — مقسوم‌علیه بهای هر واحد" },
      { key: "containers", label: "تعداد کانتینر", decimals: 2, suffix: "ضریب ردیف‌های کانتینری" },
    ],
  },
  {
    title: "اجزای ارزش گمرکی — CIF",
    peek: (s) => `کرایه ${f(s.intlFreight)} · بیمه ${f(s.insurance)}`,
    fields: [
      { key: "intlFreight", label: "کرایه حمل بین‌المللی", suffix: "ترم CFR / CPT" },
      { key: "insurance", label: "بیمه" },
      { key: "policyAmount", label: "مبلغ بیمه‌نامه" },
      { key: "hasPolicy", label: "بیمه‌نامه دارد", type: "check" },
    ],
  },
  {
    title: "نرخ‌های رویه گمرکی",
    peek: (s, c) => `${s.rateTotal}٪ → ${c.rateDisc.toFixed(1)}٪`,
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
    peek: (s, c) => `${c.rateMel.toFixed(1)}٪ · ${s.isDomestic ? "تولید داخل" : "سایر"}`,
    fields: [
      { key: "melDutyShare", label: "سهم حقوق ورودی", decimals: 1, suffix: "درصدِ حقوق ورودی" },
      { key: "melDomesticShare", label: "سهم سود بازرگانی — تولید داخل دارد", decimals: 1, suffix: "درصد" },
      { key: "melOtherShare", label: "سهم سود بازرگانی — سایر کالاها", decimals: 1, suffix: "درصد" },
      { key: "melVatRate", label: "ارزش افزوده ملوانی", decimals: 1, suffix: "درصد" },
      { key: "isDomestic", label: "کالا تولید داخل دارد", type: "check" },
    ],
  },
  {
    title: "فروش و پسماند",
    peek: (s) => `فروش ${f(s.salePrice)}`,
    fields: [
      { key: "salePrice", label: "فروش هر واحد در بازار" },
      { key: "waste", label: "پسماند" },
    ],
  },
];

export const TAX_FIELDS = [
  { key: "assumedMargin", label: "سود مفروض سازمان مالیاتی", decimals: 1, suffix: "درصد" },
  { key: "corpTaxRate", label: "نرخ مالیات بر درآمد", decimals: 1, suffix: "درصد" },
];
