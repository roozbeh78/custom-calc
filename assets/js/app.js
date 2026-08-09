import { fmt, pct, parse } from "./format.js";
import { DEFAULT_INPUT, SCENARIOS, SCENARIO_NAMES } from "./constants.js";
import { DEFAULT_CLEARANCE_ROWS } from "./clearanceRows.js";
import { compute, buildWarnings } from "./calc.js";
import { FIELD_GROUPS, TAX_FIELDS } from "./fields.js";
import { $, el, fill, pill } from "./dom.js";

/* ------------------------------------------------------------------ */
/*  وضعیت                                                              */
/* ------------------------------------------------------------------ */

const state = {
  ...DEFAULT_INPUT,
  rows: DEFAULT_CLEARANCE_ROWS.map((r) => ({ ...r })),
  scenario: "disc",
  unit: "تومان",
};

const SEG_COLORS = {
  purchase: "#6FA6B2",
  duty: "#C9A227",
  vat: "#E0C36B",
  war: "#B08968",
  tax2: "#8C6D4F",
  lenj: "#3F8A7E",
  clearance: "#4E7C87",
};

/** ورودی‌هایی که suffix پویا دارند، برای به‌روزرسانی بعد از هر محاسبه. */
const dynamicSuffixes = [];

/* ------------------------------------------------------------------ */
/*  ساخت یک‌باره‌ی ورودی‌ها                                             */
/*  ورودی‌ها فقط یک بار ساخته می‌شوند تا موقع تایپ فوکوس از دست نرود.   */
/* ------------------------------------------------------------------ */

function numberField(field) {
  const input = el("input", {
    type: "text",
    inputmode: "decimal",
    value: fmt(state[field.key], field.decimals ?? 0),
    "aria-label": field.label,
  });

  input.addEventListener("input", () => {
    state[field.key] = parse(input.value);
    render();
  });
  // فرمت‌کردن فقط موقع خروج از فیلد، تا مکان‌نما وسط تایپ نپرد
  input.addEventListener("blur", () => {
    input.value = fmt(state[field.key], field.decimals ?? 0);
  });

  const suffix = el("span", { class: "suf" });
  if (typeof field.suffix === "function") {
    dynamicSuffixes.push({ node: suffix, fn: field.suffix });
  } else if (field.suffix) {
    suffix.textContent = field.suffix;
  }

  return el("div", { class: "f" }, el("label", {}, field.label), input, suffix);
}

function checkField(field) {
  const id = "chk-" + field.key;
  const input = el("input", { type: "checkbox", id });
  input.checked = Boolean(state[field.key]);
  input.addEventListener("change", () => {
    state[field.key] = input.checked;
    render();
  });
  return el("div", { class: "chk" }, input, el("label", { for: id }, field.label));
}

const buildField = (f) => (f.type === "check" ? checkField(f) : numberField(f));

function buildInputs() {
  const grid = $("#inputs-grid");
  const nodes = [];
  for (const group of FIELD_GROUPS) {
    nodes.push(el("div", { class: "fgroup" }, group.title));
    for (const f of group.fields) nodes.push(buildField(f));
  }
  fill(grid, nodes);
  fill($("#tax-inputs"), TAX_FIELDS.map(buildField));
}

function buildToggles() {
  fill(
    $("#unitbar"),
    ["تومان", "ریال"].map((u) =>
      el("button", {
        class: "ubtn" + (state.unit === u ? " on" : ""),
        "data-unit": u,
        onclick: () => {
          state.unit = u;
          buildToggles();
          render();
        },
      }, u)
    )
  );

  fill(
    $("#pickbar"),
    SCENARIOS.map((k) =>
      el("button", {
        class: "ubtn" + (state.scenario === k ? " on" : ""),
        onclick: () => {
          state.scenario = k;
          buildToggles();
          render();
        },
      }, SCENARIO_NAMES[k])
    )
  );
}

/* ------------------------------------------------------------------ */
/*  جدول مراحل ترخیص                                                   */
/* ------------------------------------------------------------------ */

function clearanceRow(row) {
  const effCell = el("td", { class: "eff" });

  const label = el("input", { class: "lbl", type: "text", value: row.label, "aria-label": "شرح ردیف" });
  label.addEventListener("input", () => { row.label = label.value; });

  const amount = el("input", { type: "text", inputmode: "decimal", value: fmt(row.amount), "aria-label": "مبلغ" });
  amount.addEventListener("input", () => {
    row.amount = parse(amount.value);
    render();
  });
  amount.addEventListener("blur", () => { amount.value = fmt(row.amount); });

  const per = el("input", { type: "checkbox", "aria-label": "کانتینری" });
  per.checked = row.perContainer;
  per.addEventListener("change", () => {
    row.perContainer = per.checked;
    render();
  });

  const del = el("button", {
    class: "del",
    "aria-label": "حذف ردیف",
    onclick: () => {
      state.rows = state.rows.filter((r) => r.id !== row.id);
      buildClearance();
      render();
    },
  }, "×");

  const tr = el("tr", {},
    el("td", {}, label),
    el("td", {}, amount),
    el("td", { class: "c" }, per),
    effCell,
    el("td", {}, del)
  );
  tr._eff = effCell;
  tr._row = row;
  return tr;
}

function buildClearance() {
  fill($("#clearance-body"), state.rows.map(clearanceRow));
}

/* ------------------------------------------------------------------ */
/*  رندر خروجی‌ها                                                      */
/* ------------------------------------------------------------------ */

function bigFig(label, value, unit, cls = "", alt = true) {
  return el("div", { class: "bigfig" + (alt ? " alt" : "") },
    el("div", { class: "lbl" }, label),
    el("div", { class: "val " + cls }, value, unit ? el("span", { class: "unit" }, unit) : null)
  );
}

function renderHero(c) {
  fill($("#hero-figs"),
    bigFig(`بهای تمام‌شده هر واحد — ${SCENARIO_NAMES[state.scenario]}`, fmt(c.perUnit), state.unit, "", false),
    bigFig("حاشیه سود", pct(c.margin), "", c.margin >= 0 ? "gain" : "loss"),
    bigFig("سود کل محموله", fmt(c.profit), state.unit, c.profit >= 0 ? "gain" : "loss"),
    bigFig("ماخذ اعمال‌شده", c.active.rate.toFixed(1), "درصد")
  );

  const segments = [
    { key: "خرید کالا", v: c.purchase, color: SEG_COLORS.purchase },
    { key: "حقوق ورودی", v: c.active.duty, color: SEG_COLORS.duty },
    { key: "ارزش افزوده", v: c.active.vat, color: SEG_COLORS.vat },
    { key: "عوارض جنگی", v: c.active.war, color: SEG_COLORS.war },
    { key: "مالیات علی‌الحساب", v: c.active.tax2, color: SEG_COLORS.tax2 },
    { key: "کرایه لنج", v: c.lenj, color: SEG_COLORS.lenj },
    { key: "ترخیص و حمل زمینی", v: c.clearance + state.waste, color: SEG_COLORS.clearance },
  ].filter((s) => s.v > 0);

  const axisMax = Math.max(c.landed, c.revenue, 1);

  $("#cost-total").textContent = `${fmt(c.landed)} ${state.unit}`;
  $("#rev-total").textContent = `${fmt(c.revenue)} ${state.unit}`;

  fill($("#bar-cost"), segments.map((s) => {
    const w = (s.v / axisMax) * 100;
    return el("div", {
      class: "seg",
      style: { width: w + "%", background: s.color },
      title: `${s.key} — ${fmt(s.v)} ${state.unit}`,
    }, w > 11 ? el("span", { class: "seg-in" }, pct(s.v / c.landed)) : null);
  }));

  fill($("#bar-rev"),
    el("div", { class: "seg", style: { width: (Math.min(c.landed, c.revenue) / axisMax) * 100 + "%", background: "#2A5A66" } }),
    el("div", {
      class: "seg",
      style: { width: (Math.max(0, c.revenue - c.landed) / axisMax) * 100 + "%", background: c.profit >= 0 ? "#6FD3AC" : "#F09A8C" },
      title: `سود — ${fmt(c.profit)} ${state.unit}`,
    })
  );

  fill($("#legend"), segments.map((s) =>
    el("span", { class: "lg" },
      el("span", { class: "sw", style: { background: s.color } }),
      s.key + " ",
      el("b", { class: "num" }, fmt(s.v))
    )
  ));
}

function matrixRow(label, pickFn, c, opts = {}) {
  const key = el("td", { class: "k" }, label, opts.pill ? pill(opts.pill) : null);
  const cells = SCENARIOS.map((k) => el("td", { class: "n" }, pickFn(c.S[k])));
  return el("tr", { class: opts.class || null }, key, ...cells);
}

function renderMatrix(c) {
  fill($("#mtx-cols"),
    el("col"),
    SCENARIOS.map((k) => el("col", { class: state.scenario === k ? "act" : null }))
  );

  fill($("#mtx-head"),
    el("tr", {},
      el("th", {}, "عنوان"),
      ...SCENARIOS.map((k) =>
        el("th", { class: "n" + (state.scenario === k ? " sel" : "") },
          SCENARIO_NAMES[k],
          el("span", { class: "sub" }, c.S[k].rate.toFixed(1) + "%")
        )
      )
    )
  );

  const per = (v) => (state.qty > 0 ? v / state.qty : NaN);
  const clearancePerUnit = per(c.clearance + state.waste);
  const divisor = "÷ " + fmt(state.qty);

  fill($("#mtx-body"),
    matrixRow("ارزش گمرکی", (s) => fmt(s.cv), c),
    matrixRow("حقوق ورودی", (s) => fmt(s.duty), c),
    matrixRow("ارزش افزوده", (s) => fmt(s.vat), c, { pill: `${state.vatRate}٪ / ${state.melVatRate}٪` }),
    matrixRow("عوارض جنگی", (s) => fmt(s.war), c, { pill: `${(state.warLevy / 10).toFixed(1)}٪` }),
    matrixRow("مالیات علی‌الحساب", (s) => fmt(s.tax2), c, { pill: `${state.prepaidTax}٪` }),
    matrixRow("جمع حقوق و عوارض", (s) => fmt(s.levies), c),
    matrixRow("کرایه لنج", (s) => (s.lenj > 0 ? fmt(s.lenj) : "—"), c, { pill: "بدون ماخذ" }),
    matrixRow("جمع صورت رویه", (s) => fmt(s.total), c, { class: "tot" }),
    matrixRow("حقوق و عوارض هر واحد", (s) => fmt(per(s.levies)), c, { class: "perunit", pill: divisor }),
    matrixRow("هزینه ترخیص هر واحد", () => fmt(clearancePerUnit), c, { pill: divisor })
  );

  $("#mel-note").replaceChildren(
    el("span", { html:
      `ماخذ ملوانی = <code>${state.dutyRate}% × ${state.melDutyShare}% + ${c.commercial.toFixed(1)}% × ${c.melShare}%</code> = ` +
      `<b class="num">${c.rateMel.toFixed(1)}%</b> — چون کالا ${state.isDomestic ? "دارای تولید داخل" : "بدون تولید داخل"} است. ` +
      `هر سه رویه روی یک ارزش گمرکی مشترک حساب می‌شوند، پس اختلاف ستون‌ها فقط از ماخذ و نرخ ارزش افزوده می‌آید.`
    })
  );
}

const row = (label, value, opts = {}) =>
  el("tr", { class: opts.class || null },
    el("td", { class: "k" + (opts.sub ? " sub" : "") }, label, opts.pill ? pill(opts.pill) : null),
    el("td", { class: "v num", style: opts.color ? { color: opts.color } : null }, value)
  );

const table = (...rows) => el("table", { class: "rows" }, el("tbody", {}, rows.flat().filter(Boolean)));

function renderPurchase(c) {
  const per = (v) => (state.qty > 0 ? v / state.qty : NaN);
  const good = "var(--gain)", bad = "var(--loss)";

  fill($("#purchase-out"),
    table(
      row("خرید با ارز دولتی", fmt(c.govBuy), { pill: `${fmt(state.govRate)} × ${fmt(state.declValueFX)}` }),
      row("مابه‌التفاوت با ارز آزاد", fmt(c.freeBuy)),
      row("جمع خرید کالا", fmt(c.purchase), { class: "tot" })
    ),
    el("div", { style: { height: "18px" } }),
    table(
      row("هزینه خرید هر واحد", fmt(per(c.purchase))),
      row("حقوق و عوارض هر واحد", fmt(per(c.active.levies))),
      c.lenj > 0 ? row("کرایه لنج هر واحد", fmt(per(c.lenj))) : null,
      row("هزینه ترخیص هر واحد", fmt(per(c.clearance + state.waste))),
      row("بهای تمام‌شده هر واحد", fmt(c.perUnit), { class: "tot" })
    ),
    el("div", { style: { height: "14px" } }),
    table(
      row("فروش هر واحد", fmt(state.salePrice)),
      row("سود هر واحد", fmt(state.salePrice - c.perUnit), { color: c.profit >= 0 ? good : bad }),
      row("حاشیه سود", pct(c.margin), { color: c.margin >= 0 ? good : bad })
    ),
    el("div", { class: "note info", style: { marginTop: "14px" } },
      el("span", { html:
        `معادل ارزی به نرخ آزاد: بهای تمام‌شده <b class="num">${fmt(state.freeRate > 0 ? c.perUnit / state.freeRate : NaN, 2)}</b>` +
        ` · فروش <b class="num">${fmt(state.freeRate > 0 ? state.salePrice / state.freeRate : NaN, 2)}</b>`
      })
    )
  );
}

function renderTax(c) {
  fill($("#tax-out"),
    table(
      row("مبنای اظهاری", fmt(c.taxBase)),
      row("فروش مفروض", fmt(c.assumedSales), { pill: `+${state.assumedMargin}٪` }),
      row("ارزش افزوده فروش", fmt(c.vatOnSales)),
      row("− بستانکاری گمرک", fmt(c.active.vat), { sub: true }),
      row("بدهی ارزش افزوده", fmt(c.vatNet)),
      row("مالیات بر درآمد", fmt(c.incomeTax), { pill: `${state.corpTaxRate}٪` }),
      row("− مالیات علی‌الحساب گمرک", fmt(c.active.tax2), { sub: true }),
      row("بدهی مالیات بر درآمد", fmt(c.incomeNet)),
      row("کل پرداختی به سازمان مالیاتی", fmt(c.taxTotal), { class: "tot" })
    )
  );
}

function renderClearance(c) {
  for (const tr of $("#clearance-body").children) {
    const r = tr._row;
    tr._eff.textContent = fmt(r.amount * (r.perContainer ? state.containers : 1));
  }
  $("#clearance-total").textContent = fmt(c.clearance);
  $("#cont-echo").textContent = fmt(state.containers, 2);
}

function renderWarnings(c) {
  const items = buildWarnings(state, c, SCENARIO_NAMES);
  $("#warn-panel").hidden = items.length === 0;
  fill($("#warnings"), items.map((w) =>
    el("div", { class: "note warn" }, el("span", {}, w.text))
  ));
}

function renderFoot() {
  $("#foot").replaceChildren(el("span", { html:
    `ماخذ ملوانی <code>${state.melDutyShare}%</code> حقوق ورودی + <code>${state.melDomesticShare}%</code> یا ` +
    `<code>${state.melOtherShare}%</code> سود بازرگانی · تخفیف روی کل زنجیره اعمال می‌شود · ` +
    `حاشیه سود <code>فروش ÷ بهای تمام‌شده − ۱</code>`
  }));
}

/* ------------------------------------------------------------------ */
/*  چرخه‌ی رندر                                                        */
/* ------------------------------------------------------------------ */

function render() {
  const c = compute(state);

  for (const d of dynamicSuffixes) d.node.textContent = d.fn(state, c);

  renderHero(c);
  renderMatrix(c);
  renderPurchase(c);
  renderTax(c);
  renderClearance(c);
  renderWarnings(c);
  renderFoot();
}

/* ------------------------------------------------------------------ */
/*  راه‌اندازی                                                         */
/* ------------------------------------------------------------------ */

buildToggles();
buildInputs();
buildClearance();

$("#add-row").addEventListener("click", () => {
  state.rows.push({ id: Date.now(), label: "ردیف جدید", amount: 0, perContainer: false });
  buildClearance();
  render();
});

render();
