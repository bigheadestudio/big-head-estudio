(() => {
  const cfg = window.BIG_HEAD_CONFIG;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const baseMessage = "Olá! Vi a agenda no site do Big Head Estúdio e gostaria de consultar um horário para ensaio.";
  const waUrl = (message = baseMessage) => `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(message)}`;

  $$(".js-whatsapp").forEach(a => { a.href = waUrl(); a.target = "_blank"; a.rel = "noopener"; });
  $$(".js-instagram").forEach(a => a.href = cfg.instagramUrl);
  $$(".js-review").forEach(a => a.href = cfg.googleReviewUrl);
  $$(".js-maps").forEach(a => a.href = cfg.googleMapsUrl);

  if (document.body.dataset.page !== "agenda") return;

  const grid = $("#calendarGrid");
  const title = $("#calendarTitle");
  const slotsEl = $("#slots");
  const dateTitle = $("#selectedDateTitle");
  const dateSubtitle = $("#selectedDateSubtitle");
  const dayWhatsapp = $("#dayWhatsapp");
  const demoBanner = $("#demoBanner");

  let cursor = new Date();
  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  let selectedDate = new Date();
  selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  let events = [];
  let selectedSlot = null;
  let requestSerial = 0;

  // Bloqueios apenas para a prévia visual quando a integração ainda não foi configurada.
  function getDemoEvents(year, month) {
    const d = (day, sh, eh) => ({
      start: new Date(year, month, day, sh, 0),
      end: new Date(year, month, day, eh, 0)
    });
    return [d(7,19,21), d(10,14,17), d(13,20,22), d(17,10,13), d(17,18,21), d(22,19,22), d(25,15,18)];
  }

  function pad(n) { return String(n).padStart(2, "0"); }
  function isoLocal(d) {
    const off = -d.getTimezoneOffset();
    const sign = off >= 0 ? "+" : "-";
    const hh = pad(Math.floor(Math.abs(off)/60));
    const mm = pad(Math.abs(off)%60);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${sign}${hh}:${mm}`;
  }
  function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function formatDate(d){ return new Intl.DateTimeFormat("pt-BR", {weekday:"long", day:"2-digit", month:"long"}).format(d); }
  function formatShort(d){ return new Intl.DateTimeFormat("pt-BR", {day:"2-digit", month:"2-digit", year:"numeric"}).format(d); }
  function formatHour(d){ return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const callback = `bhCalendarCallback_${Date.now()}_${Math.floor(Math.random()*100000)}`;
      const script = document.createElement("script");
      const timeout = setTimeout(() => cleanup(new Error("Tempo de resposta excedido")), 12000);
      function cleanup(error, data) {
        clearTimeout(timeout);
        delete window[callback];
        script.remove();
        error ? reject(error) : resolve(data);
      }
      window[callback] = data => cleanup(null, data);
      script.onerror = () => cleanup(new Error("Falha ao carregar agenda"));
      script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${callback}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  async function loadMonth() {
    const serial = ++requestSerial;
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0);
    const end = new Date(cursor.getFullYear(), cursor.getMonth()+1, 1, 0, 0, 0);

    if (!cfg.appsScriptUrl) {
      demoBanner.classList.add("visible");
      events = getDemoEvents(cursor.getFullYear(), cursor.getMonth());
      renderCalendar();
      renderSelectedDay();
      return;
    }

    demoBanner.classList.remove("visible");
    try {
      const url = `${cfg.appsScriptUrl}?start=${encodeURIComponent(isoLocal(start))}&end=${encodeURIComponent(isoLocal(end))}`;
      const data = await jsonp(url);
      if (serial !== requestSerial) return;
      if (!data || data.ok !== true || !Array.isArray(data.events)) {
        throw new Error(data && data.error ? data.error : "Resposta inválida do Apps Script");
      }
      events = data.events.map(e => ({start:new Date(e.start), end:new Date(e.end)}));
      renderCalendar();
      renderSelectedDay();
    } catch (err) {
      console.error("Big Head Agenda:", err);
      demoBanner.textContent = `Agenda indisponível: ${err && err.message ? err.message : "falha de conexão"}. Verifique a implantação do Google Apps Script.`;
      demoBanner.classList.add("visible");
      events = [];
      renderCalendar();
      renderSelectedDay();
    }
  }

  function dayOpenHours(date) {
    return cfg.openingHours[date.getDay()] || null;
  }

  function slotsForDay(date) {
    const hours = dayOpenHours(date);
    if (!hours) return [];
    const result = [];
    const step = cfg.slotMinutes;
    let t = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours.start, 0, 0);
    const finish = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours.end, 0, 0);
    while (t < finish) {
      const e = new Date(t.getTime() + step*60000);
      const reserved = events.some(ev => ev.start < e && ev.end > t);
      result.push({start:new Date(t), end:e, reserved});
      t = e;
    }
    return result;
  }

  function dayStatus(date) {
    const slots = slotsForDay(date);
    if (!slots.length) return {kind:"full", label:"Fechado"};
    const reserved = slots.filter(s=>s.reserved).length;
    if (reserved === 0) return {kind:"free", label:"Livre"};
    if (reserved === slots.length) return {kind:"full", label:"Sem horários"};
    return {kind:"partial", label:"Parcial"};
  }

  function renderCalendar() {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    title.textContent = new Intl.DateTimeFormat("pt-BR", {month:"long", year:"numeric"}).format(cursor);
    grid.innerHTML = "";
    const first = new Date(y,m,1);
    const days = new Date(y,m+1,0).getDate();
    const before = first.getDay();
    for (let i=0;i<before;i++) grid.appendChild(makeDayCell(null));
    const today = new Date();
    for (let day=1; day<=days; day++) {
      const date = new Date(y,m,day);
      const cell = makeDayCell(date);
      if (sameDay(date,today)) cell.classList.add("today");
      if (sameDay(date,selectedDate)) cell.classList.add("selected");
      grid.appendChild(cell);
    }
    while (grid.children.length % 7) grid.appendChild(makeDayCell(null));
  }

  function makeDayCell(date) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "day";
    if (!date) { b.classList.add("outside"); b.disabled = true; return b; }
    const st = dayStatus(date);
    b.innerHTML = `<span class="day-number">${date.getDate()}</span><span class="day-status ${st.kind}"><span class="status-dot"></span>${st.label}</span>`;
    b.setAttribute("aria-label", `${formatDate(date)}: ${st.label}`);
    b.addEventListener("click", () => { selectedDate = date; selectedSlot = null; renderCalendar(); renderSelectedDay(); });
    return b;
  }

  function renderSelectedDay() {
    dateTitle.textContent = formatDate(selectedDate);
    const hours = dayOpenHours(selectedDate);
    selectedSlot = null;
    slotsEl.innerHTML = "";

    if (!hours) {
      dateSubtitle.textContent = "Estúdio fechado nesta data.";
      dayWhatsapp.href = waUrl(`Olá! Vi o site do Big Head Estúdio e gostaria de consultar uma possibilidade de horário em ${formatShort(selectedDate)}.`);
      return;
    }

    const slots = slotsForDay(selectedDate);
    const availableCount = slots.filter(s=>!s.reserved).length;
    dateSubtitle.textContent = `${availableCount} horário${availableCount===1?"":"s"} livre${availableCount===1?"":"s"} nesta data.`;

    slots.forEach(slot => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `slot ${slot.reserved ? "reserved" : "available"}`;
      btn.disabled = slot.reserved;
      btn.innerHTML = `<strong>${formatHour(slot.start)}–${formatHour(slot.end)}</strong><span class="slot-badge">${slot.reserved ? "Reservado" : "Disponível"}</span>`;
      if (!slot.reserved) {
        btn.addEventListener("click", () => {
          selectedSlot = slot;
          $$(".slot.available", slotsEl).forEach(x=>x.classList.remove("selected"));
          btn.classList.add("selected");
          dayWhatsapp.href = waUrl(`Olá! Vi a agenda no site do Big Head Estúdio e gostaria de consultar o horário de ${formatHour(slot.start)} às ${formatHour(slot.end)} do dia ${formatShort(selectedDate)} para ensaio.`);
        });
      }
      slotsEl.appendChild(btn);
    });

    dayWhatsapp.href = waUrl(`Olá! Vi a agenda no site do Big Head Estúdio e gostaria de consultar disponibilidade para ${formatShort(selectedDate)}.`);
  }

  $("#prevMonth").addEventListener("click", () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth()-1, 1); selectedDate = new Date(cursor.getFullYear(), cursor.getMonth(), 1); loadMonth(); });
  $("#nextMonth").addEventListener("click", () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth()+1, 1); selectedDate = new Date(cursor.getFullYear(), cursor.getMonth(), 1); loadMonth(); });
  $("#todayBtn").addEventListener("click", () => { const n=new Date(); cursor=new Date(n.getFullYear(),n.getMonth(),1); selectedDate=new Date(n.getFullYear(),n.getMonth(),n.getDate()); loadMonth(); });

  loadMonth();
  setInterval(() => { if (cfg.appsScriptUrl) loadMonth(); }, Math.max(1,cfg.refreshMinutes)*60000);
})();
