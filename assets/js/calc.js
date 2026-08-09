/**
 * موتور محاسبه — بدون وابستگی به فریم‌ورک.
 *
 * قواعد کلیدی:
 *  • ارزش گمرکی (CIF) = نرخ ارز × ارزش اظهار + کرایه بین‌المللی + بیمه [+ بیمه‌نامه]
 *  • ماخذ گمرکی با تخفیف = حقوق ورودی + سود بازرگانی × (۱ − درصد تخفیف)
 *  • ماخذ ملوانی = حقوق ورودی × ۸۰٪ + سود بازرگانی × (۳۰٪ تولید داخل | ۱۵٪ سایر)
 *  • ارزش افزوده، عوارض جنگی و مالیات علی‌الحساب همگی روی پایه‌ی
 *    (ارزش گمرکی + حقوق ورودی) محاسبه می‌شوند.
 *  • تخفیف به‌جای کسر در انتها، از ابتدا با ماخذ پایین‌تر اجرا می‌شود تا
 *    کاهش پایه‌ی ارزش افزوده و عوارض هم لحاظ شود.
 *  • کرایه لنج در صورت رویه لنجی می‌آید ولی بیرون از ارزش گمرکی است؛
 *    ماخذ روی آن اخذ نمی‌شود و وارد مبنای مالیاتی هم نمی‌شود.
 */

/** یک رویه را با ماخذ و نرخ ارزش افزوده‌ی مشخص اجرا می‌کند. */
export function runProcedure({ rate, customsValue, vatRate, warLevy, prepaidTax, extra = 0 }) {
  const duty = customsValue * (rate / 100);
  const base = customsValue + duty;
  const vat = base * (vatRate / 100);
  const war = base * (warLevy / 1000);
  const tax2 = base * (prepaidTax / 100);
  const levies = duty + vat + war + tax2;
  return { rate, cv: customsValue, duty, base, vat, war, tax2, levies, lenj: extra, total: levies + extra };
}

/** جمع هزینه‌های ترخیص با اعمال ضریب کانتینر روی ردیف‌های کانتینری. */
export function sumClearance(rows, containers) {
  return rows.reduce((s, r) => s + r.amount * (r.perContainer ? containers : 1), 0);
}

/** محاسبه‌ی کامل. ورودی: DEFAULT_INPUT + { rows, scenario }. */
export function compute(input) {
  const {
    declRate, declValueFX, freeRate, govRate, actualValueFX,
    intlFreight, insurance, hasPolicy, policyAmount,
    rateTotal, dutyRate, discountPct, vatRate, warLevy, prepaidTax,
    melDutyShare, melDomesticShare, melOtherShare, melVatRate, isDomestic, lenjFreight,
    waste, qty, containers, salePrice,
    assumedMargin, corpTaxRate,
    rows, scenario,
  } = input;

  /* ---------- ماخذها ---------- */
  const commercial = rateTotal - dutyRate;
  const rateDisc = dutyRate + commercial * (1 - discountPct / 100);
  const melShare = isDomestic ? melDomesticShare : melOtherShare;
  const rateMel = dutyRate * (melDutyShare / 100) + commercial * (melShare / 100);

  /* ---------- ارزش گمرکی ---------- */
  const customsValue =
    declRate * declValueFX + intlFreight + insurance + (hasPolicy ? policyAmount : 0);

  const shared = { customsValue, warLevy, prepaidTax };
  const S = {
    full: runProcedure({ ...shared, rate: rateTotal, vatRate }),
    disc: runProcedure({ ...shared, rate: rateDisc, vatRate }),
    mel: runProcedure({ ...shared, rate: rateMel, vatRate: melVatRate, extra: lenjFreight }),
  };
  const active = S[scenario] ?? S.disc;
  const cheapest = Object.keys(S).reduce((a, b) => (S[a].total <= S[b].total ? a : b));

  /* ---------- خرید کالا ---------- */
  const govBuy = govRate * declValueFX;
  const freeBuy = freeRate * (actualValueFX - (govRate > 0 ? declValueFX : 0));
  const purchase = govBuy + freeBuy;

  /* ---------- بهای تمام‌شده ---------- */
  const clearance = sumClearance(rows, containers);
  const lenj = active.lenj;
  const landed = purchase + active.total + clearance + waste;
  const perUnit = qty > 0 ? landed / qty : NaN;
  const revenue = salePrice * qty;
  const profit = revenue - landed;
  const margin = qty > 0 && perUnit > 0 ? salePrice / perUnit - 1 : NaN;

  /* ---------- مالیات خارج از گمرک ---------- */
  const activeVatRate = scenario === "mel" ? melVatRate : vatRate;
  const taxBase = active.cv + active.levies; // کرایه لنج در مبنا نمی‌آید
  const assumedSales = taxBase * (1 + assumedMargin / 100);
  const vatOnSales = assumedSales * (activeVatRate / 100);
  const vatNet = vatOnSales - active.vat;
  const assumedProfit = taxBase * (assumedMargin / 100);
  const incomeTax = assumedProfit * (corpTaxRate / 100);
  const incomeNet = incomeTax - active.tax2;

  return {
    commercial, rateDisc, rateMel, melShare, customsValue,
    S, active, cheapest,
    govBuy, freeBuy, purchase,
    clearance, lenj, landed, perUnit, revenue, profit, margin,
    taxBase, assumedSales, vatOnSales, vatNet,
    assumedProfit, incomeTax, incomeNet, taxTotal: vatNet + incomeNet,
  };
}

/** هشدارهای منطقی — آرایه‌ای از { id, text } که UI رندر می‌کند. */
export function buildWarnings(input, c, names) {
  const w = [];
  const { hasPolicy, insurance, policyAmount, qty, actualValueFX, declValueFX, govRate, scenario } = input;

  if (hasPolicy && insurance > 0 && policyAmount > 0)
    w.push({ id: "insurance", text: `هم «بیمه» و هم «مبلغ بیمه‌نامه» در ارزش گمرکی وارد شده‌اند. اگر هر دو به یک بیمه اشاره دارند، ارزش گمرکی به اندازه‌ی مبلغ بیمه‌نامه بیش از واقع است.` });
  if (qty <= 0)
    w.push({ id: "qty", text: "تعداد یا مقدار صفر است — بهای هر واحد قابل محاسبه نیست." });
  if (actualValueFX < declValueFX && govRate > 0)
    w.push({ id: "fx", text: "ارزش واقعی از ارزش اظهار کمتر است؛ مابه‌التفاوت ارز آزاد منفی می‌شود." });
  if (isFinite(c.margin) && c.margin < 0)
    w.push({ id: "loss", text: "قیمت فروش پایین‌تر از بهای تمام‌شده هر واحد است." });
  if (c.cheapest !== scenario)
    w.push({ id: "cheaper", text: `رویه «${names[c.cheapest]}» در این شرایط ${(c.active.total - c.S[c.cheapest].total).toLocaleString("en-US", { maximumFractionDigits: 0 })} کم‌هزینه‌تر تمام می‌شود.` });

  return w;
}
