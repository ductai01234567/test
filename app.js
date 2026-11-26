/* ===== CẤU HÌNH: đổi tài khoản admin ở đây ===== */
const ADMIN = { user: "admin", pass: "123456" };
/* =============================================== */

const COLORS = { 6: "#0f5c7a", 7: "#2f8f6b", 8: "#c9791a", 9: "#8a3f6b" };
const mkLessons = () => [{ title: "Bài 1: Tên bài học", slides: "", video: "" }];
const DEF = {
  site: { name: "Kho học liệu số", logo: "", intro: "Nơi các em xem bài giảng, video thực hành và thông tin của trường. Chọn một mục bên dưới để bắt đầu." },
  teachers: [{ name: "Thầy/Cô Nguyễn Văn A", photo: "", desc: "Giáo viên bộ môn. Hãy cập nhật đoạn giới thiệu ngắn ở trang Quản trị." }],
  place: { desc: "Giới thiệu ngắn về địa điểm của trường.", address: "Hà Nội, Việt Nam", map: "" },
  grades: Object.fromEntries([6, 7, 8, 9].map(g => [g, { desc: `Bài giảng dành cho học sinh lớp ${g}.`, cover: "", lessons: mkLessons() }]))
};

let D = JSON.parse(JSON.stringify(DEF));
let isAdmin = sessionStorage.getItem("adm") === "1";
let atab = "site", lessonTab = "ly-thuyet";
/* Dán link Web app của Google Apps Script vào giữa hai dấu ngoặc kép */
const API = "https://script.google.com/macros/s/AKfycbwTTfhe4_hWyrph3KqzoFK-In0JTW3xq5eVRa-YZqBsL7yYAP1SuLzqTAagvXXirVqmUQ/exec";
let who = JSON.parse(sessionStorage.getItem("who") || "null"), after = null;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const idOf = u => (u.match(/\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/) || [])[1];

function imgUrl(u) {
  if (!u) return "";
  if (u.includes("drive.google.com") && idOf(u)) return `https://drive.google.com/thumbnail?id=${idOf(u)}&sz=w1000`;
  return u;
}
function embed(u) {
  if (!u) return "";
  u = u.trim();
  const m = u.match(/<iframe[^>]+src="([^"]+)"/); if (m) return m[1];
  const id = idOf(u);
  if (u.includes("docs.google.com/presentation") && id) return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`;
  if (u.includes("drive.google.com") && id) return `https://drive.google.com/file/d/${id}/preview`;
  if (/\.pptx?(\?|$)/i.test(u)) return "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(u);
  return u;
}
function mapSrc(p) {
  const e = embed(p.map || "");
  if (e) return e;
  return p.address ? `https://maps.google.com/maps?q=${encodeURIComponent(p.address)}&output=embed` : "";
}
const frame = (u, t) => u ? `<div class="frame"><iframe src="${esc(embed(u))}" title="${esc(t)}" allowfullscreen loading="lazy"></iframe></div>` : `<div class="empty">Chưa có nội dung.</div>`;
const logoHtml = () => D.site.logo ? `<img class="logo" src="${esc(imgUrl(D.site.logo))}" alt="Logo">` : `<span class="logo">${esc(D.site.name[0] || "K")}</span>`;

/* ===== Trang cho học sinh ===== */
const views = {
  home() {
    const t = D.teachers[0];
    return `<section class="hero"><h1>${esc(D.site.name)}</h1><p>${esc(D.site.intro)}</p></section>
    <nav class="menu">
      <a href="#/bai-giang">Bài giảng <span>Lớp 6, 7, 8, 9</span></a>
      <a href="#/bai-tap">Bài tập <span>Nộp bài, xem điểm</span></a>
      <a href="#/giao-vien">Giáo viên <span>${D.teachers.length} giáo viên</span></a>
      <a href="#/dia-diem">Địa điểm <span>Xem bản đồ</span></a>
    </nav>
    ${t ? `<section class="sec"><h2>Giáo viên</h2><div class="row"><img class="ava" src="${esc(imgUrl(t.photo))}" alt="" onerror="this.style.visibility='hidden'"><div><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p></div></div><a href="#/giao-vien">Xem tất cả</a></section>` : ""}
    <section class="sec"><h2>Địa điểm</h2><p>${esc(D.place.desc)}</p><a href="#/dia-diem">Xem bản đồ</a></section>`;
  },
  grades() {
    return `<h1>Bài giảng</h1><p>Chọn khối lớp để xem danh sách bài học.</p><div class="grades">${[6, 7, 8, 9].map(g => {
      const c = D.grades[g].cover;
      return `<a class="g" href="#/bai-giang/${g}"><div class="cv" style="--c:${COLORS[g]};${c ? `background-image:url('${esc(imgUrl(c))}')` : ""}">${c ? "" : "Lớp " + g}</div><b>Lớp ${g}</b></a>`;
    }).join("")}</div>`;
  },
  grade(g) {
    const G = D.grades[g]; if (!G) return views.grades();
    return `<a class="crumb" href="#/bai-giang">‹ Bài giảng</a><h1>Lớp ${g}</h1><p>${esc(G.desc)}</p>
    <ul class="lessons">${G.lessons.map((l, i) => `<li><a href="#/bai-giang/${g}/${i}">${esc(l.title)}</a></li>`).join("") || '<li class="empty">Chưa có bài học.</li>'}</ul>`;
  },
  lesson(g, i) {
    const l = (D.grades[g] || {}).lessons?.[i]; if (!l) return views.grade(g);
    const ly = lessonTab === "ly-thuyet";
    return `<a class="crumb" href="#/bai-giang/${g}">‹ Lớp ${g}</a><h1>${esc(l.title)}</h1>
    <div class="seg"><button data-tab="ly-thuyet" class="${ly ? "on" : ""}">Lý thuyết</button><button data-tab="thuc-hanh" class="${ly ? "" : "on"}">Thực hành</button></div>
    ${ly ? frame(l.slides, "Bản trình chiếu") : frame(l.video, "Video thực hành")}
    ${(ly ? l.slides : l.video) ? `<p class="note" style="margin-top:10px"><a href="${esc((ly ? l.slides : l.video))}" target="_blank" rel="noopener">Mở trong tab mới</a> nếu không xem được.</p>` : ""}`;
  },
  teachers() {
    return `<h1>Giáo viên</h1>${D.teachers.map(t => `<section class="sec"><div class="row"><img class="ava" src="${esc(imgUrl(t.photo))}" alt="" onerror="this.style.visibility='hidden'"><h3>${esc(t.name)}</h3></div><p>${esc(t.desc)}</p></section>`).join("")}`;
  },
  place() {
    const s = mapSrc(D.place);
    return `<h1>Địa điểm</h1><p>${esc(D.place.desc)}</p>${D.place.address ? `<p><b>Địa chỉ:</b> ${esc(D.place.address)}</p>` : ""}
    ${s ? `<div class="map"><iframe src="${esc(s)}" title="Bản đồ" loading="lazy" allowfullscreen></iframe></div>` : '<div class="empty">Chưa có bản đồ.</div>'}
    ${D.place.address ? `<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(D.place.address)}">Mở Google Maps</a>` : ""}`;
  },
  account() {
    if (who || isAdmin) return `<h1>Tài khoản</h1><div id="ax"></div>`;
    return `<h1>Đăng nhập</h1><div class="sec"><p>Học sinh và giáo viên đăng nhập bằng tài khoản do giáo viên cấp.</p><label for="u">Tên đăng nhập</label><input id="u" autocomplete="username"><label for="p">Mật khẩu</label><input id="p" type="password" autocomplete="current-password"><div class="bar"><button class="btn" data-act="login">Đăng nhập</button></div></div>
    <div class="sec"><p class="note">Chưa có tài khoản vẫn xem được bài giảng.</p><a class="btn sec2" href="#/bai-giang">Xem bài giảng</a></div>`;
  }
};

/* ===== Trang quản trị ===== */
const fld = (label, path, val, type = "text") => `<label>${label}</label>` + (type === "area" ? `<textarea data-p="${path}">${esc(val)}</textarea>` : `<input data-p="${path}" value="${esc(val)}">`);
const imgFld = (label, path, val) => `<label>${label} (dán link hoặc chọn ảnh)</label><input data-p="${path}" value="${esc(val && val.startsWith("data:") ? "(ảnh đã tải lên)" : val)}"><input type="file" accept="image/*" data-img="${path}" style="margin-top:6px">`;

function adminView() {
  if (!isAdmin) return `<div class="empty">Bạn cần đăng nhập quản trị. <a href="#/tai-khoan">Đăng nhập</a></div>`;
  const tabs = [["site", "Chung"], ["teachers", "Giáo viên"], ["place", "Địa điểm"], [6, "Lớp 6"], [7, "Lớp 7"], [8, "Lớp 8"], [9, "Lớp 9"], ["hs", "Học sinh"], ["bt", "Bài tập"], ["cd", "Chấm điểm"], ["bd", "Bảng điểm"]];
  let body = "";
  if (atab === "site") body = fld("Tên trang", "site.name", D.site.name) + imgFld("Logo", "site.logo", D.site.logo) + fld("Giới thiệu", "site.intro", D.site.intro, "area");
  else if (atab === "teachers") body = D.teachers.map((t, i) => `<div class="sec"><h3>Giáo viên ${i + 1}</h3>${fld("Họ tên", `teachers.${i}.name`, t.name)}${imgFld("Ảnh", `teachers.${i}.photo`, t.photo)}${fld("Mô tả ngắn", `teachers.${i}.desc`, t.desc, "area")}<div class="bar"><button class="btn del sm" data-act="del-t" data-i="${i}">Xóa</button></div></div>`).join("") + `<button class="btn" data-act="add-t">+ Thêm giáo viên</button>`;
  else if (atab === "place") body = fld("Mô tả ngắn", "place.desc", D.place.desc, "area") + fld("Địa chỉ", "place.address", D.place.address) + fld("Mã nhúng Google Maps (không bắt buộc)", "place.map", D.place.map, "area") + `<p class="note">Nếu để trống, trang sẽ tự hiển thị bản đồ theo địa chỉ. Muốn chính xác hơn: Google Maps → Chia sẻ → Nhúng bản đồ → sao chép HTML rồi dán vào đây.</p>`;
  else if (["hs", "bt", "cd", "bd"].includes(atab)) { body = '<div id="ax"></div>'; after = adminAsync; }
  else { const g = atab, G = D.grades[g];
    body = fld("Mô tả lớp", `grades.${g}.desc`, G.desc, "area") + imgFld("Ảnh bìa sách giáo khoa", `grades.${g}.cover`, G.cover) +
      G.lessons.map((l, i) => `<div class="sec"><h3>Bài ${i + 1}</h3>${fld("Tên bài", `grades.${g}.lessons.${i}.title`, l.title)}${fld("Link bản trình chiếu (Google Drive / Google Slides)", `grades.${g}.lessons.${i}.slides`, l.slides)}${fld("Link video thực hành (Google Drive)", `grades.${g}.lessons.${i}.video`, l.video)}<div class="bar"><button class="btn del sm" data-act="del-l" data-i="${i}">Xóa bài</button></div></div>`).join("") + `<button class="btn" data-act="add-l">+ Thêm bài học</button>`; }
  return `<h1>Quản trị</h1>
  <div class="sec"><b>Cách đăng nội dung lên web:</b><p class="note">1) Sửa nội dung bên dưới → 2) bấm "Tải data.json" → 3) tải file đó lên GitHub (thay file data.json cũ). Học sinh sẽ thấy nội dung mới sau ít phút.</p>
  <div class="bar"><button class="btn" data-act="export">Tải data.json</button><button class="btn sec2" data-act="logout">Đăng xuất</button></div></div>
  <div class="atabs">${tabs.map(([k, n]) => `<button data-at="${k}" class="${String(atab) === String(k) ? "on" : ""}">${n}</button>`).join("")}</div>${body}`;
}

/* ===== Router ===== */
function render() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  const [r, a, b] = h;
  const key = r || "";
  document.querySelectorAll("#nav a").forEach(x => x.classList.toggle("on", x.dataset.r === (key === "admin" ? "tai-khoan" : key)));
  $("#brand").innerHTML = logoHtml() + `<span>${esc(D.site.name)}</span>`;
  document.title = D.site.name;
  after = null;
  let html;
  if (key === "bai-giang") html = !a ? views.grades() : b === undefined ? views.grade(a) : views.lesson(a, +b);
  else if (key === "bai-tap") { html = '<div id="ax"></div>'; after = () => pageTasks(a); }
  else if (key === "giao-vien") html = views.teachers();
  else if (key === "dia-diem") html = views.place();
  else if (key === "tai-khoan") { html = views.account(); if (who || isAdmin) after = pageAccount; }
  else if (key === "admin") html = adminView();
  else html = views.home();
  $("#app").innerHTML = html;
  if (after) after();
  window.scrollTo(0, 0);
}

/* ===== Lưu & tiện ích ===== */
const toast = m => { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2200); };
const draft = () => { try { localStorage.setItem("khlsDraft", JSON.stringify(D)); } catch (e) { toast("Bộ nhớ đầy, hãy dùng link ảnh thay vì tải ảnh."); } };
function setPath(p, v) { const k = p.split("."); let o = D; k.slice(0, -1).forEach(x => o = o[x]); o[k.at(-1)] = v; }
function shrink(file, cb) {
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 700 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL("image/jpeg", .75)); }; im.src = r.result; };
  r.readAsDataURL(file);
}

document.addEventListener("input", e => { const p = e.target.dataset.p; if (p) { setPath(p, e.target.value); draft(); } });
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.img) shrink(t.files[0], d => { setPath(t.dataset.img, d); draft(); render(); toast("Đã tải ảnh"); });
  if ("import" in t.dataset) { const r = new FileReader(); r.onload = () => { try { D = JSON.parse(r.result); draft(); render(); toast("Đã mở file"); } catch { toast("File không hợp lệ"); } }; r.readAsText(t.files[0]); }
});
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act],[data-tab],[data-at]"); if (!t) return;
  const { act, tab, at, i } = t.dataset;
  if (tab) { lessonTab = tab; render(); return; }
  if (at) { atab = at; render(); return; }
  if (act === "login") login();
  if (act === "logout") doLogout();
  if (act === "add-t") { D.teachers.push({ name: "Họ tên", photo: "", desc: "" }); draft(); render(); }
  if (act === "del-t" && confirm("Xóa giáo viên này?")) { D.teachers.splice(i, 1); draft(); render(); }
  if (act === "add-l") { D.grades[atab].lessons.push({ title: "Bài mới", slides: "", video: "" }); draft(); render(); }
  if (act === "del-l" && confirm("Xóa bài học này?")) { D.grades[atab].lessons.splice(i, 1); draft(); render(); }
  if (act === "export") exportHtml();
});


/* ===== Tài khoản, bài tập, chấm điểm (cần Google Apps Script) ===== */
const wait = '<p class="note">Đang tải…</p>', safe = u => /^https?:\/\//i.test(u) ? esc(u) : "#";
const go = x => location.hash === x ? render() : (location.hash = x);
const isStu = () => who && who.role === "student";
const bad = (box, r) => { box.innerHTML = `<div class="empty">${esc(r.error)}</div>`; };
async function api(action, p = {}) {
  if (!API) return { ok: false, error: "Chức năng này chưa được kết nối máy chủ. Giáo viên cần dán link Google Apps Script vào file index.html." };
  try {
    const r = await (await fetch(API, { method: "POST", body: JSON.stringify({ action, token: sessionStorage.getItem("tok"), ...p }) })).json();
    if (r.expired) doLogout(true);
    return r;
  } catch { return { ok: false, error: "Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại." }; }
}
function doLogout(silent) {
  ["tok", "who", "adm"].forEach(k => sessionStorage.removeItem(k));
  isAdmin = false; who = null;
  loadData().then(() => { if (!silent) go("#/"); else go("#/tai-khoan"); });
}
async function login() {
  const u = $("#u").value.trim(), p = $("#p").value;
  if (!API) {
    if (u === ADMIN.user && p === ADMIN.pass) { isAdmin = true; sessionStorage.setItem("adm", "1"); who = { role: "admin", name: "Giáo viên" }; await loadData(); go("#/admin"); }
    else toast("Sai tên đăng nhập hoặc mật khẩu");
    return;
  }
  const r = await api("login", { user: u, pass: p });
  if (!r.ok) return toast(r.error);
  sessionStorage.setItem("tok", r.token); sessionStorage.setItem("who", JSON.stringify(r.who)); who = r.who;
  if (who.role === "admin") { isAdmin = true; sessionStorage.setItem("adm", "1"); await loadData(); go("#/admin"); }
  else go("#/bai-tap");
}
async function pageAccount() {
  const box = $("#ax");
  if (!isStu()) { box.innerHTML = `<div class="sec"><p>Xin chào ${esc(who?.name || "giáo viên")}.</p><a class="btn" href="#/admin">Vào trang quản trị</a> <button class="btn sec2" data-act="logout">Đăng xuất</button></div>`; return; }
  box.innerHTML = wait; const r = await api("profile"); if (!r.ok) return bad(box, r);
  const p = r.profile;
  box.innerHTML = `<div class="sec"><h2>Thông tin cá nhân</h2><p class="note">Tên đăng nhập: <b>${esc(p.user)}</b> · Khối ${esc(p.grade)}</p>
  <label>Họ tên</label><input id="f-name" value="${esc(p.name)}"><label>Lớp</label><input id="f-class" value="${esc(p.class)}"><label>Ngày sinh</label><input id="f-dob" placeholder="vd: 15/03/2012" value="${esc(p.dob)}"><label>Số điện thoại</label><input id="f-phone" inputmode="tel" value="${esc(p.phone)}"><div class="bar"><button class="btn" data-act="save-prof">Lưu thông tin</button></div></div>
  <div class="sec"><h2>Đổi mật khẩu</h2><label>Mật khẩu cũ</label><input id="f-old" type="password"><label>Mật khẩu mới</label><input id="f-new" type="password"><div class="bar"><button class="btn" data-act="change-pass">Đổi mật khẩu</button></div></div>
  <div class="bar"><a class="btn" href="#/bai-tap">Bài tập của tôi</a><button class="btn sec2" data-act="logout">Đăng xuất</button></div>`;
}
async function pageTasks(id) {
  const box = $("#ax");
  if (!who) { box.innerHTML = `<h1>Bài tập</h1><div class="empty">Bạn cần <a href="#/tai-khoan">đăng nhập</a> để xem và nộp bài tập.</div>`; return; }
  if (!isStu()) { box.innerHTML = `<h1>Bài tập</h1><div class="empty">Giáo viên giao và chấm bài ở <a href="#/admin">trang Quản trị</a>.</div>`; return; }
  box.innerHTML = wait; const r = await api("assignments"); if (!r.ok) return bad(box, r);
  if (id) {
    const a = r.list.find(x => x.id === id); if (!a) return go("#/bai-tap");
    const m = a.mine, done = m && m.score !== "", dis = done ? "disabled" : "";
    box.innerHTML = `<a class="crumb" href="#/bai-tap">‹ Bài tập</a><h1>${esc(a.title)}</h1><p class="note">Hạn nộp: ${esc(a.deadline || "không có")}</p><p>${esc(a.desc)}</p>
    ${done ? `<div class="sec"><h3>Điểm: ${esc(m.score)}</h3><p>${esc(m.comment)}</p></div>` : ""}
    <div class="sec"><h2>Bài làm của em</h2>${m ? `<p class="note">Đã nộp lúc ${esc(m.time)}</p>` : ""}<label>Nội dung bài làm</label><textarea id="s-content" ${dis}>${esc(m?.content)}</textarea><label>Link bài làm (Google Drive, nếu có)</label><input id="s-link" value="${esc(m?.link)}" ${dis}>${done ? "" : `<div class="bar"><button class="btn" data-act="submit" data-id="${esc(a.id)}">${m ? "Nộp lại" : "Nộp bài"}</button></div>`}</div>`;
    return;
  }
  box.innerHTML = `<h1>Bài tập</h1>` + (r.list.length ? `<ul class="lessons">${r.list.map(a => `<li><a href="#/bai-tap/${esc(a.id)}"><b>${esc(a.title)}</b><br><span class="note">Hạn: ${esc(a.deadline || "—")} · ${a.mine ? (a.mine.score !== "" ? "Điểm " + esc(a.mine.score) : "Đã nộp") : "Chưa nộp"}</span></a></li>`).join("")}</ul>` : `<div class="empty">Chưa có bài tập nào.</div>`);
}
const S = {};
async function adminAsync() {
  const box = $("#ax"); if (!box) return; box.innerHTML = wait;
  if (atab === "hs") {
    const r = await api("students"); if (!r.ok) return bad(box, r);
    box.innerHTML = `<div class="sec"><h3>Thêm học sinh</h3><p class="note">Mỗi dòng một học sinh, cách nhau bằng dấu phẩy:<br>tên đăng nhập, mật khẩu, họ tên, khối, lớp<br>Ví dụ: hs6a01, 123456, Nguyễn Văn B, 6, 6A</p><textarea id="bulk"></textarea><div class="bar"><button class="btn" data-act="add-hs">Thêm học sinh</button></div></div>
    <div class="sec"><h3>Danh sách (${r.list.length})</h3>${r.list.map(s => `<div class="row"><div style="flex:1"><b>${esc(s.name)}</b><br><span class="note">${esc(s.user)} · Khối ${esc(s.grade)} · ${esc(s.class)}</span></div><button class="btn sec2 sm" data-act="reset-pw" data-u="${esc(s.user)}">Đặt lại MK</button><button class="btn del sm" data-act="del-hs" data-u="${esc(s.user)}">Xóa</button></div>`).join("") || '<div class="empty">Chưa có học sinh.</div>'}</div>`;
  } else if (atab === "bt") {
    const r = await api("assignments"); if (!r.ok) return bad(box, r); S.as = r.list;
    box.innerHTML = `<div class="sec"><h3>Giao bài tập</h3><input id="b-id" type="hidden"><label>Tên bài tập</label><input id="b-title"><label>Yêu cầu</label><textarea id="b-desc"></textarea><label>Khối</label><select id="b-grade">${[6, 7, 8, 9].map(g => `<option>${g}</option>`).join("")}</select><label>Hạn nộp</label><input id="b-dl" type="date"><div class="bar"><button class="btn" data-act="save-bt">Lưu bài tập</button></div></div>
    <div class="sec"><h3>Danh sách bài tập</h3>${r.list.map(a => `<div class="row"><div style="flex:1"><b>${esc(a.title)}</b><br><span class="note">Khối ${esc(a.grade)} · Hạn: ${esc(a.deadline || "—")}</span></div><button class="btn sec2 sm" data-act="edit-bt" data-id="${esc(a.id)}">Sửa</button><button class="btn del sm" data-act="del-bt" data-id="${esc(a.id)}">Xóa</button></div>`).join("") || '<div class="empty">Chưa có bài tập.</div>'}</div>`;
  } else if (atab === "cd") {
    const r = await api("assignments"); if (!r.ok) return bad(box, r);
    box.innerHTML = `<label>Chọn bài tập để chấm</label><select data-sel="subs"><option value="">— chọn bài tập —</option>${r.list.map(a => `<option value="${esc(a.id)}">Khối ${esc(a.grade)}: ${esc(a.title)}</option>`).join("")}</select><div id="sl" style="margin-top:12px"></div>`;
  } else {
    box.innerHTML = `<label>Chọn khối</label><select data-sel="book"><option value="">— chọn khối —</option>${[6, 7, 8, 9].map(g => `<option>${g}</option>`).join("")}</select><div id="bk" style="margin-top:12px"></div>`;
  }
}
async function loadSubs(aid) {
  const box = $("#sl"); if (!aid) { box.innerHTML = ""; return; } box.innerHTML = wait;
  const r = await api("subs", { aid }); if (!r.ok) return bad(box, r);
  box.innerHTML = r.list.map(x => { const s = x.sub; return `<div class="sec"><h3>${esc(x.name)} <span class="note">${esc(x.class)}</span></h3>` + (s ? `<p class="note">Nộp lúc ${esc(s.time)}</p><p>${esc(s.content)}</p>${s.link ? `<p><a href="${safe(s.link)}" target="_blank" rel="noopener">Mở link bài làm</a></p>` : ""}<label>Điểm</label><input id="sc-${s.id}" inputmode="decimal" value="${esc(s.score)}"><label>Nhận xét</label><input id="cm-${s.id}" value="${esc(s.comment)}"><div class="bar"><button class="btn sm" data-act="grade" data-id="${s.id}">Lưu điểm</button></div>` : `<p class="note">Chưa nộp bài.</p>`) + `</div>`; }).join("") || '<div class="empty">Chưa có học sinh ở khối này.</div>';
}
async function loadBook(g) {
  const box = $("#bk"); if (!g) { box.innerHTML = ""; return; } box.innerHTML = wait;
  const r = await api("book", { grade: g }); if (!r.ok) return bad(box, r);
  const sc = (u, a) => { const s = r.subs.find(x => x.user === u && x.aid === a); return s && s.score !== "" ? s.score : "–"; };
  box.innerHTML = `<div class="tbl"><table><tr><th>Họ tên</th>${r.assigns.map(a => `<th>${esc(a.title)}</th>`).join("")}<th>TB</th></tr>${r.students.map(s => { const v = r.assigns.map(a => sc(s.user, a.id)), n = v.filter(x => x !== "–").map(Number).filter(x => !isNaN(x)); return `<tr><td>${esc(s.name)}</td>${v.map(x => `<td>${esc(x)}</td>`).join("")}<td>${n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(1) : "–"}</td></tr>`; }).join("")}</table></div><div class="bar"><button class="btn sec2" data-act="csv">Tải bảng điểm (CSV)</button></div>`;
}
document.addEventListener("change", e => { const s = e.target.dataset.sel; if (s === "subs") loadSubs(e.target.value); if (s === "book") loadBook(e.target.value); });
const val = id => $("#" + id).value;
const done = (r, msg, f) => { toast(r.ok ? msg : r.error); if (r.ok && f) f(); };
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-act]"); if (!t) return; const { act, id, u } = t.dataset;
  if (act === "save-prof") { const r = await api("saveProfile", { name: val("f-name"), class: val("f-class"), dob: val("f-dob"), phone: val("f-phone") }); done(r, "Đã lưu thông tin", () => { who.name = val("f-name"); sessionStorage.setItem("who", JSON.stringify(who)); }); }
  if (act === "change-pass") { const r = await api("changePass", { old: val("f-old"), new: val("f-new") }); done(r, "Đã đổi mật khẩu", () => { $("#f-old").value = $("#f-new").value = ""; }); }
  if (act === "submit") { const r = await api("submit", { aid: id, content: val("s-content"), link: val("s-link") }); done(r, "Đã nộp bài", () => pageTasks(id)); }
  if (act === "add-hs") { const rows = val("bulk").split("\n").map(l => l.split(",").map(x => x.trim())).filter(x => x.length >= 3); const r = await api("addStudents", { rows }); done(r, `Đã thêm ${r.added} học sinh` + (r.skipped ? `, bỏ qua ${r.skipped} dòng (trùng hoặc thiếu thông tin)` : ""), adminAsync); }
  if (act === "del-hs" && confirm("Xóa học sinh " + u + "?")) done(await api("delStudent", { user: u }), "Đã xóa", adminAsync);
  if (act === "reset-pw") { const p = prompt("Mật khẩu mới cho " + u); if (p) done(await api("resetPass", { user: u, pass: p }), "Đã đặt lại mật khẩu"); }
  if (act === "save-bt") done(await api("saveAssign", { id: val("b-id"), title: val("b-title"), desc: val("b-desc"), grade: val("b-grade"), deadline: val("b-dl") }), "Đã lưu bài tập", adminAsync);
  if (act === "edit-bt") { const a = S.as.find(x => x.id === id); $("#b-id").value = a.id; $("#b-title").value = a.title; $("#b-desc").value = a.desc; $("#b-grade").value = a.grade; $("#b-dl").value = a.deadline; window.scrollTo(0, 0); }
  if (act === "del-bt" && confirm("Xóa bài tập này và toàn bộ bài nộp của nó?")) done(await api("delAssign", { id }), "Đã xóa bài tập", adminAsync);
  if (act === "grade") done(await api("grade", { id, score: val("sc-" + id), comment: val("cm-" + id) }), "Đã lưu điểm");
  if (act === "csv") {
    const t = [...document.querySelectorAll("#bk tr")].map(tr => [...tr.children].map(c => '"' + c.textContent.replace(/"/g, '""') + '"').join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + t], { type: "text/csv" })); a.download = "bang-diem.csv"; a.click();
  }
});

function exportHtml() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(D, null, 2)], { type: "application/json" }));
  a.download = "data.json"; a.click();
}
async function loadData() {
  let d = null;
  try { const r = await fetch("data.json?v=" + Date.now()); if (r.ok) d = await r.json(); } catch { }
  if (isAdmin) { try { const s = localStorage.getItem("khlsDraft"); if (s) d = JSON.parse(s); } catch { } }
  D = Object.assign(JSON.parse(JSON.stringify(DEF)), d || {});
  render();
}
window.addEventListener("hashchange", render);
loadData();
