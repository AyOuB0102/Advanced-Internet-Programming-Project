"use strict";

const $ = (s) => document.querySelector(s);

const RH = (() => {
  const KEY = "researchhub_v1";
  const THEME_KEY = "researchhub_theme";
  const SESSION_KEY = "researchhub_session";

  const uid = (p="id") => `${p}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  const nowISO = () => new Date().toISOString().slice(0,10);

  function load(){
    const raw = localStorage.getItem(KEY);
    if(raw) return JSON.parse(raw);

    const empty = {
      meta: { createdAt: new Date().toISOString() },
      projects: [],
      tasks: [],
      papers: []
    };
    localStorage.setItem(KEY, JSON.stringify(empty));
    return empty;
  }
  function save(db){ localStorage.setItem(KEY, JSON.stringify(db)); }

  function getTheme(){
    return localStorage.getItem(THEME_KEY) || "dark";
  }
  function applyTheme(){
    document.documentElement.setAttribute("data-theme", getTheme());
  }
  function toggleTheme(){
    const t = getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, t);
    applyTheme();
    toast(`تم تغيير الثيم إلى: ${t === "dark" ? "داكن" : "فاتح"}`, "ok");
  }

  function toast(msg, type=""){
    const el = document.createElement("div");
    el.className = `toast ${type}`.trim();
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function confirm(msg, onYes){
    openModal("تأكيد", `
      <p class="muted">${escapeHTML(msg)}</p>
      <div class="actions">
        <button class="btn danger" id="yesBtn">نعم</button>
        <button class="btn" id="noBtn">إلغاء</button>
      </div>
    `);
    $("#yesBtn").onclick = () => { closeModal(); onYes?.(); };
    $("#noBtn").onclick = closeModal;
  }

  function escapeHTML(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function setSession({user, remember}){
    const session = { user, at: Date.now() };
    if(remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  function getSession(){
    const a = localStorage.getItem(SESSION_KEY);
    const b = sessionStorage.getItem(SESSION_KEY);
    return a ? JSON.parse(a) : (b ? JSON.parse(b) : null);
  }
  function logout(){
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    location.href = "index.html";
  }
  function guard(){
    const s = getSession();
    if(!s) location.href = "index.html";
  }

  function initCommon(){
    applyTheme();
    // ensure db exists
    load();
  }

  function resetAll(){
    localStorage.removeItem(KEY);
    load();
  }

  function seedDemoData(){
    const db = load();
    if(db.projects.length || db.tasks.length || db.papers.length) return;

    const p1 = { id: uid("prj"), title:"نظام توأم رقمي للمرور", field:"Smart City", priority:"High", createdAt: nowISO() };
    const p2 = { id: uid("prj"), title:"منصة إدارة مراجع بحثية", field:"HCI/IR", priority:"Med", createdAt: nowISO() };
    db.projects.push(p1, p2);

    db.tasks.push(
      { id: uid("tsk"), projectId:p1.id, title:"تصميم مخطط البيانات (Conceptual)", due: addDays(7), status:"todo", priority:"High", createdAt: nowISO() },
      { id: uid("tsk"), projectId:p1.id, title:"تحضير واجهة Dashboard", due: addDays(10), status:"doing", priority:"Med", createdAt: nowISO() },
      { id: uid("tsk"), projectId:p1.id, title:"تجميع متطلبات أصحاب المصلحة", due: addDays(4), status:"todo", priority:"High", createdAt: nowISO() },
      { id: uid("tsk"), projectId:p2.id, title:"إضافة Tags + فلترة", due: addDays(6), status:"doing", priority:"Med", createdAt: nowISO() },
      { id: uid("tsk"), projectId:p2.id, title:"تصدير/استيراد JSON", due: addDays(9), status:"todo", priority:"Low", createdAt: nowISO() },
      { id: uid("tsk"), projectId:p2.id, title:"رسم بياني Canvas", due: addDays(12), status:"done", priority:"Med", createdAt: nowISO() },
    );

    db.papers.push(
      { id: uid("pap"), title:"Digital Twins for Smart Cities: A Survey", authors:"(Demo)", year:"2023", rating:5, tags:["digital-twin","smart-city"], link:"https://example.com", notes:"ملخص سريع: تعريف + معماريات + تحديات.", createdAt: nowISO() },
      { id: uid("pap"), title:"Task Management UX Patterns", authors:"(Demo)", year:"2022", rating:4, tags:["ux","productivity"], link:"https://example.com", notes:"أفكار للتصميم والتجربة.", createdAt: nowISO() },
    );

    save(db);
  }

  function addDays(n){
    const d = new Date();
    d.setDate(d.getDate()+n);
    return d.toISOString().slice(0,10);
  }

  /* ---------------- Modal ---------------- */
  function openModal(title, html){
    const m = $("#modal");
    if(!m) return;
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    m.classList.remove("hidden");
  }
  function closeModal(){
    const m = $("#modal");
    if(!m) return;
    m.classList.add("hidden");
  }

  /* ---------------- Dashboard ---------------- */
  function renderUserBox(){
    const s = getSession();
    if(!s) return;
    const initials = (s.user || "?").trim().slice(0,1).toUpperCase();
    const a = $("#avatar"); const u = $("#userName");
    if(a) a.textContent = initials;
    if(u) u.textContent = s.user;
  }

  function renderDashboard(){
    const db = load();
    const kProjects = $("#kProjects"), kTasks = $("#kTasks"), kPapers = $("#kPapers"), kDone = $("#kDone");

    if(kProjects) kProjects.textContent = db.projects.length;
    if(kTasks) kTasks.textContent = db.tasks.length;
    if(kPapers) kPapers.textContent = db.papers.length;

    const done = db.tasks.filter(t => t.status === "done").length;
    const pct = db.tasks.length ? Math.round(done * 100 / db.tasks.length) : 0;
    if(kDone) kDone.textContent = pct + "%";

    // deadlines
    const dl = $("#deadlines");
    if(dl){
      const upcoming = [...db.tasks]
        .filter(t => t.due)
        .sort((a,b) => a.due.localeCompare(b.due))
        .slice(0,6);

      dl.innerHTML = upcoming.length ? upcoming.map(t => {
        const pr = db.projects.find(p => p.id === t.projectId);
        const badge = t.status === "done" ? "ok" : (isLate(t) ? "danger" : "warn");
        return `
          <div class="item">
            <div class="t">${escapeHTML(t.title)}</div>
            <div class="m">المشروع: ${escapeHTML(pr?.title || "—")} • الموعد: ${escapeHTML(t.due)}</div>
            <div class="badges">
              <span class="badge ${badge}">${labelStatus(t.status)}</span>
              <span class="badge">${labelPriority(t.priority)}</span>
            </div>
          </div>`;
      }).join("") : `<div class="muted">لا توجد مواعيد قريبة.</div>`;
    }

    // mini kanban
    const mTodo = $("#mini_todo"), mDoing = $("#mini_doing"), mDone = $("#mini_done");
    if(mTodo && mDoing && mDone){
      const top = (status) => db.tasks.filter(t=>t.status===status).slice(0,4).map(t => `
        <div class="task">
          <div class="tt">${escapeHTML(t.title)}</div>
          <div class="tm">${escapeHTML(t.due || "بدون موعد")}</div>
        </div>`).join("");
      mTodo.innerHTML = top("todo") || `<div class="muted small">فارغ</div>`;
      mDoing.innerHTML = top("doing") || `<div class="muted small">فارغ</div>`;
      mDone.innerHTML = top("done") || `<div class="muted small">فارغ</div>`;
    }
  }

  function isLate(task){
    if(!task.due) return false;
    return task.status !== "done" && task.due < nowISO();
  }

  /* ---------------- Projects CRUD ---------------- */
  function renderProjects(q=""){
    const db = load();
    const list = $("#projectsList");
    if(!list) return;

    const query = (q||"").trim().toLowerCase();
    const projects = db.projects
      .filter(p => !query || (p.title||"").toLowerCase().includes(query) || (p.field||"").toLowerCase().includes(query))
      .sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||""));

    list.innerHTML = projects.length ? projects.map(p => {
      const tasks = db.tasks.filter(t => t.projectId === p.id);
      const done = tasks.filter(t => t.status === "done").length;
      const pct = tasks.length ? Math.round(done*100/tasks.length) : 0;

      return `
        <div class="item">
          <div class="row-between">
            <div>
              <div class="t">${escapeHTML(p.title)}</div>
              <div class="m">المجال: ${escapeHTML(p.field || "—")} • الأولوية: ${escapeHTML(p.priority || "—")}</div>
            </div>
            <span class="badge">${pct}%</span>
          </div>

          <div class="badges">
            <span class="badge ${p.priority==='High'?'danger':p.priority==='Med'?'warn':''}">${labelPriority(p.priority)}</span>
            <span class="badge">${tasks.length} مهام</span>
          </div>

          <div class="actions">
            <button class="btn small" data-act="edit" data-id="${p.id}">تعديل</button>
            <button class="btn small danger" data-act="del" data-id="${p.id}">حذف</button>
          </div>
        </div>`;
    }).join("") : `<div class="muted">لا توجد مشاريع.</div>`;

    list.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const act = btn.getAttribute("data-act");
        if(act === "edit") openProjectModal(id);
        if(act === "del") confirm("سيتم حذف المشروع وكل مهامه، هل أنت متأكد؟", () => deleteProject(id));
      });
    });

    // also refresh kanban if exists
    renderKanban();
  }

  function openProjectModal(projectId=null){
    const db = load();
    const p = projectId ? db.projects.find(x => x.id === projectId) : null;

    openModal(projectId ? "تعديل مشروع" : "مشروع جديد", `
      <div class="form">
        <label>عنوان المشروع</label>
        <input id="p_title" value="${escapeHTML(p?.title || "")}" placeholder="مثال: منصة تحليل بيانات..." />

        <label>المجال/التخصص</label>
        <input id="p_field" value="${escapeHTML(p?.field || "")}" placeholder="مثال: AI / HCI / Networks" />

        <label>الأولوية</label>
        <select id="p_priority" class="input">
          <option value="Low" ${p?.priority==="Low"?"selected":""}>Low</option>
          <option value="Med" ${p?.priority==="Med"?"selected":""}>Med</option>
          <option value="High" ${p?.priority==="High"?"selected":""}>High</option>
        </select>

        <div class="actions">
          <button class="btn primary" id="saveProjectBtn">حفظ</button>
          <button class="btn" id="cancelProjectBtn">إلغاء</button>
        </div>
      </div>
    `);

    $("#cancelProjectBtn").onclick = closeModal;
    $("#saveProjectBtn").onclick = () => {
      const title = $("#p_title").value.trim();
      const field = $("#p_field").value.trim();
      const priority = $("#p_priority").value;

      if(!title) return toast("عنوان المشروع مطلوب", "warn");

      const db2 = load();
      if(projectId){
        const idx = db2.projects.findIndex(x => x.id === projectId);
        db2.projects[idx] = { ...db2.projects[idx], title, field, priority };
      }else{
        db2.projects.push({ id: uid("prj"), title, field, priority, createdAt: nowISO() });
      }
      save(db2);
      closeModal();
      toast("تم حفظ المشروع ✅", "ok");
      renderProjects($("#projectSearch")?.value || "");
    };
  }

  function deleteProject(id){
    const db = load();
    db.projects = db.projects.filter(p => p.id !== id);
    db.tasks = db.tasks.filter(t => t.projectId !== id);
    save(db);
    toast("تم حذف المشروع.", "ok");
    renderProjects($("#projectSearch")?.value || "");
  }

  /* ---------------- Tasks CRUD + Kanban ---------------- */
  function openTaskModal(taskId=null){
    const db = load();
    const t = taskId ? db.tasks.find(x => x.id === taskId) : null;

    if(!db.projects.length){
      toast("أنشئ مشروعًا أولًا.", "warn");
      return;
    }

    openModal(taskId ? "تعديل مهمة" : "مهمة جديدة", `
      <div class="form">
        <label>العنوان</label>
        <input id="t_title" value="${escapeHTML(t?.title || "")}" placeholder="مثال: كتابة الفصل الأول..." />

        <label>المشروع</label>
        <select id="t_project" class="input">
          ${db.projects.map(p => `<option value="${p.id}" ${t?.projectId===p.id?"selected":""}>${escapeHTML(p.title)}</option>`).join("")}
        </select>

        <div class="row">
          <div style="flex:1">
            <label>الموعد</label>
            <input id="t_due" type="date" value="${escapeHTML(t?.due || "")}" />
          </div>
          <div style="flex:1">
            <label>الحالة</label>
            <select id="t_status" class="input">
              <option value="todo" ${t?.status==="todo"?"selected":""}>To-Do</option>
              <option value="doing" ${t?.status==="doing"?"selected":""}>Doing</option>
              <option value="done" ${t?.status==="done"?"selected":""}>Done</option>
            </select>
          </div>
        </div>

        <label>الأولوية</label>
        <select id="t_priority" class="input">
          <option value="Low" ${t?.priority==="Low"?"selected":""}>Low</option>
          <option value="Med" ${t?.priority==="Med"?"selected":""}>Med</option>
          <option value="High" ${t?.priority==="High"?"selected":""}>High</option>
        </select>

        <div class="actions">
          <button class="btn primary" id="saveTaskBtn">حفظ</button>
          ${taskId ? `<button class="btn danger" id="delTaskBtn">حذف</button>` : ``}
          <button class="btn" id="cancelTaskBtn">إلغاء</button>
        </div>
      </div>
    `);

    $("#cancelTaskBtn").onclick = closeModal;

    if(taskId){
      $("#delTaskBtn").onclick = () => confirm("حذف المهمة؟", () => {
        const db2 = load();
        db2.tasks = db2.tasks.filter(x => x.id !== taskId);
        save(db2);
        closeModal();
        toast("تم حذف المهمة.", "ok");
        renderKanban();
      });
    }

    $("#saveTaskBtn").onclick = () => {
      const title = $("#t_title").value.trim();
      const projectId = $("#t_project").value;
      const due = $("#t_due").value;
      const status = $("#t_status").value;
      const priority = $("#t_priority").value;

      if(!title) return toast("عنوان المهمة مطلوب", "warn");

      const db2 = load();
      if(taskId){
        const idx = db2.tasks.findIndex(x => x.id === taskId);
        db2.tasks[idx] = { ...db2.tasks[idx], title, projectId, due, status, priority };
      }else{
        db2.tasks.push({ id: uid("tsk"), title, projectId, due, status, priority, createdAt: nowISO() });
      }
      save(db2);
      closeModal();
      toast("تم حفظ المهمة ✅", "ok");
      renderKanban();
      renderProjects($("#projectSearch")?.value || "");
    };
  }

  function renderKanban(){
    const db = load();
    const a = $("#k_todo"), b = $("#k_doing"), c = $("#k_done");
    if(!a || !b || !c) return;

    const col = (status) => db.tasks
      .filter(t => t.status === status)
      .sort((x,y) => (x.due||"9999-99-99").localeCompare(y.due||"9999-99-99"))
      .map(t => {
        const pr = db.projects.find(p => p.id === t.projectId);
        const late = isLate(t);
        const badge = t.status==="done" ? "ok" : (late ? "danger" : "warn");
        return `
          <div class="task" draggable="true" data-id="${t.id}">
            <div class="tt">${escapeHTML(t.title)}</div>
            <div class="tm">المشروع: ${escapeHTML(pr?.title || "—")}</div>
            <div class="tm">الموعد: ${escapeHTML(t.due || "—")}</div>
            <div class="badges">
              <span class="badge ${badge}">${labelStatus(t.status)}</span>
              <span class="badge">${labelPriority(t.priority)}</span>
            </div>
            <div class="actions">
              <button class="btn small" data-act="edit" data-id="${t.id}">تعديل</button>
            </div>
          </div>`;
      }).join("");

    a.innerHTML = col("todo") || `<div class="muted small">فارغ</div>`;
    b.innerHTML = col("doing") || `<div class="muted small">فارغ</div>`;
    c.innerHTML = col("done") || `<div class="muted small">فارغ</div>`;

    document.querySelectorAll(".task button[data-act='edit']").forEach(btn => {
      btn.addEventListener("click", () => openTaskModal(btn.getAttribute("data-id")));
    });
  }

  function enableKanbanDnD(){
    const cols = document.querySelectorAll(".kcol");
    if(!cols.length) return;

    let draggingId = null;

    document.addEventListener("dragstart", (e) => {
      const task = e.target.closest(".task");
      if(!task) return;
      draggingId = task.getAttribute("data-id");
    });

    cols.forEach(col => {
      col.addEventListener("dragover", (e) => e.preventDefault());
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        const status = col.getAttribute("data-status");
        if(!draggingId) return;

        const db = load();
        const idx = db.tasks.findIndex(t => t.id === draggingId);
        if(idx >= 0){
          db.tasks[idx].status = status;
          save(db);
          renderKanban();
          toast("تم تحديث حالة المهمة ✅", "ok");
        }
        draggingId = null;
      });
    });
  }

  /* ---------------- Papers CRUD ---------------- */
  function openPaperModal(paperId=null){
    const db = load();
    const p = paperId ? db.papers.find(x => x.id === paperId) : null;

    openModal(paperId ? "تعديل مرجع" : "مرجع جديد", `
      <div class="form">
        <label>العنوان</label>
        <input id="pa_title" value="${escapeHTML(p?.title||"")}" placeholder="عنوان الورقة/الكتاب" />

        <label>المؤلفون</label>
        <input id="pa_auth" value="${escapeHTML(p?.authors||"")}" placeholder="مثال: A. Smith, B. Ali" />

        <div class="row">
          <div style="flex:1">
            <label>السنة</label>
            <input id="pa_year" value="${escapeHTML(p?.year||"")}" placeholder="2025" />
          </div>
          <div style="flex:1">
            <label>التقييم</label>
            <select id="pa_rate" class="input">
              ${[5,4,3,2,1].map(r => `<option value="${r}" ${Number(p?.rating)===r?"selected":""}>${"★".repeat(r)}</option>`).join("")}
            </select>
          </div>
        </div>

        <label>الوسوم (Tags) مفصولة بفاصلة</label>
        <input id="pa_tags" value="${escapeHTML((p?.tags||[]).join(", "))}" placeholder="ai, smart-city, ux" />

        <label>الرابط</label>
        <input id="pa_link" value="${escapeHTML(p?.link||"")}" placeholder="https://..." />

        <label>ملاحظات</label>
        <textarea id="pa_notes" placeholder="اكتب ملخصك الشخصي...">${escapeHTML(p?.notes||"")}</textarea>

        <div class="actions">
          <button class="btn primary" id="savePaperBtn">حفظ</button>
          ${paperId ? `<button class="btn danger" id="delPaperBtn">حذف</button>` : ``}
          <button class="btn" id="cancelPaperBtn">إلغاء</button>
        </div>
      </div>
    `);

    $("#cancelPaperBtn").onclick = closeModal;

    if(paperId){
      $("#delPaperBtn").onclick = () => confirm("حذف المرجع؟", () => {
        const db2 = load();
        db2.papers = db2.papers.filter(x => x.id !== paperId);
        save(db2);
        closeModal();
        toast("تم حذف المرجع.", "ok");
        renderPapers();
      });
    }

    $("#savePaperBtn").onclick = () => {
      const title = $("#pa_title").value.trim();
      if(!title) return toast("العنوان مطلوب", "warn");

      const authors = $("#pa_auth").value.trim();
      const year = $("#pa_year").value.trim();
      const rating = Number($("#pa_rate").value);
      const tags = $("#pa_tags").value.split(",").map(x => x.trim()).filter(Boolean);
      const link = $("#pa_link").value.trim();
      const notes = $("#pa_notes").value.trim();

      const db2 = load();
      if(paperId){
        const idx = db2.papers.findIndex(x => x.id === paperId);
        db2.papers[idx] = { ...db2.papers[idx], title, authors, year, rating, tags, link, notes };
      }else{
        db2.papers.push({ id: uid("pap"), title, authors, year, rating, tags, link, notes, createdAt: nowISO() });
      }
      save(db2);
      closeModal();
      toast("تم حفظ المرجع ✅", "ok");
      renderPapers();
    };
  }

  function renderPapers(){
    const db = load();
    const list = $("#papersList");
    if(!list) return;

    const q = ($("#paperSearch")?.value || "").toLowerCase().trim();
    const rf = $("#rateFilter")?.value || "";

    const papers = db.papers
      .filter(p => {
        const hit = !q || (p.title||"").toLowerCase().includes(q) ||
                    (p.authors||"").toLowerCase().includes(q) ||
                    (p.tags||[]).join(" ").toLowerCase().includes(q);
        const rateOk = !rf || Number(p.rating) >= Number(rf);
        return hit && rateOk;
      })
      .sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||""));

    list.innerHTML = papers.length ? papers.map(p => `
      <div class="item">
        <div class="row-between">
          <div>
            <div class="t">${escapeHTML(p.title)}</div>
            <div class="m">${escapeHTML(p.authors || "—")} • ${escapeHTML(p.year || "—")} • ${"★".repeat(Number(p.rating||0))}</div>
          </div>
          ${p.link ? `<a class="btn small" href="${escapeHTML(p.link)}" target="_blank" rel="noreferrer">فتح</a>` : ``}
        </div>

        <div class="badges">
          ${(p.tags||[]).slice(0,8).map(t => `<span class="badge">${escapeHTML(t)}</span>`).join("")}
        </div>

        ${p.notes ? `<div class="m" style="margin-top:10px">${escapeHTML(p.notes)}</div>` : ``}

        <div class="actions">
          <button class="btn small" data-act="edit" data-id="${p.id}">تعديل</button>
          <button class="btn small" data-act="copy" data-id="${p.id}">نسخ اقتباس</button>
        </div>
      </div>
    `).join("") : `<div class="muted">لا توجد مراجع مطابقة.</div>`;

    list.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const act = btn.getAttribute("data-act");
        if(act === "edit") return openPaperModal(id);
        if(act === "copy"){
          const p = db.papers.find(x => x.id === id);
          const cite = `${p.title}. ${p.authors || ""} (${p.year || "n.d."}).`;
          try { await navigator.clipboard.writeText(cite); toast("تم نسخ الاقتباس ✅", "ok"); }
          catch { toast("لم أستطع النسخ (صلاحيات المتصفح).", "warn"); }
        }
      });
    });
  }

  /* ---------------- Charts ---------------- */
  function renderCharts(){
    const c1 = $("#chartTasks");
    const c2 = $("#chartProjects");
    if(!c1 || !c2) return;

    const db = load();

    // tasks distribution
    const stats = {
      todo: db.tasks.filter(t=>t.status==="todo").length,
      doing: db.tasks.filter(t=>t.status==="doing").length,
      done: db.tasks.filter(t=>t.status==="done").length
    };
    drawBarChart(c1, [
      { label:"To-Do", value: stats.todo },
      { label:"Doing", value: stats.doing },
      { label:"Done", value: stats.done }
    ]);

    // projects progress
    const prog = db.projects.map(p => {
      const tasks = db.tasks.filter(t => t.projectId === p.id);
      const done = tasks.filter(t => t.status === "done").length;
      const pct = tasks.length ? Math.round(done*100/tasks.length) : 0;
      return { label: p.title.slice(0,14), value: pct };
    });
    drawBarChart(c2, prog.length ? prog : [{label:"لا بيانات", value:0}], true);
  }

  function drawBarChart(canvas, items, isPercent=false){
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.clientWidth;
    const H = canvas.height = canvas.getAttribute("height") ? Number(canvas.getAttribute("height")) : 220;

    ctx.clearRect(0,0,W,H);

    // theme-aware colors (no hard-coded palette, but we still need readable strokes)
    const stroke = getComputedStyle(document.documentElement).getPropertyValue("--stroke").trim() || "rgba(255,255,255,.14)";
    const text = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#fff";
    const muted = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "rgba(255,255,255,.7)";
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#7c3aed";

    const pad = 16;
    const maxVal = Math.max(1, ...items.map(x=>x.value));
    const barW = Math.max(18, (W - pad*2) / Math.max(1, items.length) - 10);

    // grid
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    for(let i=0;i<4;i++){
      const y = pad + (H-pad*2) * (i/3);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W-pad, y); ctx.stroke();
    }

    items.forEach((it, i) => {
      const x = pad + i * (barW + 10);
      const h = (H - pad*2) * (it.value / maxVal);
      const y = H - pad - h;

      ctx.fillStyle = primary;
      ctx.globalAlpha = 0.65;
      roundRect(ctx, x, y, barW, h, 10, true, false);

      ctx.globalAlpha = 1;
      ctx.fillStyle = text;
      ctx.font = "700 12px system-ui";
      ctx.fillText(String(it.value) + (isPercent ? "%" : ""), x, y - 6);

      ctx.fillStyle = muted;
      ctx.font = "12px system-ui";
      ctx.fillText(it.label, x, H - 6);
    });
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke){
    if(w < 2*r) r = w/2;
    if(h < 2*r) r = h/2;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
    if(fill) ctx.fill();
    if(stroke) ctx.stroke();
  }

  /* ---------------- Export / Import ---------------- */
  function exportJSON(filename="researchhub_export.json"){
    const data = localStorage.getItem(KEY) || "{}";
    const blob = new Blob([data], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("تم التصدير ✅", "ok");
  }

  function importJSONFile(file){
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const obj = JSON.parse(reader.result);
        if(!obj || !("projects" in obj) || !("tasks" in obj) || !("papers" in obj)){
          toast("ملف غير صالح.", "danger");
          return;
        }
        localStorage.setItem(KEY, JSON.stringify(obj));
        toast("تم الاستيراد ✅", "ok");
        // re-render depending on page
        renderDashboard();
        renderProjects($("#projectSearch")?.value || "");
        renderKanban();
        renderPapers();
        renderCharts();
      }catch{
        toast("فشل قراءة الملف.", "danger");
      }
    };
    reader.readAsText(file);
  }

  /* ---------------- Labels ---------------- */
  function labelStatus(s){
    if(s==="todo") return "To-Do";
    if(s==="doing") return "Doing";
    if(s==="done") return "Done";
    return s || "—";
  }
  function labelPriority(p){
    if(p==="High") return "أولوية عالية";
    if(p==="Med") return "أولوية متوسطة";
    if(p==="Low") return "أولوية منخفضة";
    return p || "—";
  }

  return {
    initCommon, toggleTheme, toast, confirm,
    setSession, getSession, guard, logout,
    seedDemoData, resetAll,
    renderUserBox, renderDashboard,
    renderProjects, openProjectModal,
    renderKanban, openTaskModal, enableKanbanDnD,
    renderPapers, openPaperModal,
    renderCharts,
    exportJSON, importJSONFile,
    openModal, closeModal
  };
})();
