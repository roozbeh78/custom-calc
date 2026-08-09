/** کمک‌کننده‌های کوچک DOM — جایگزین فریم‌ورک. */

export const $ = (sel, root = document) => root.querySelector(sel);

/** ساخت المان با ویژگی‌ها و فرزندان. */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const ch of children.flat()) {
    if (ch === null || ch === undefined || ch === false) continue;
    node.append(ch instanceof Node ? ch : document.createTextNode(String(ch)));
  }
  return node;
}

/** پاک کردن و پر کردن دوباره‌ی یک ظرف. */
export function fill(container, ...children) {
  container.replaceChildren(...children.flat().filter(Boolean));
  return container;
}

/** سلول عددی با فونت مونو و جهت چپ‌به‌راست. */
export const numCell = (text, cls = "n") => el("td", { class: cls }, text);

/** برچسب کوچک کنار عنوان ردیف. */
export const pill = (text) => el("span", { class: "pill" }, text);
