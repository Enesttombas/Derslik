// Statik (Netlify) sürümü: /api/* çağrılarını sunucu olmadan yanıtlar.
// Okuma: /statik/veri.json anlık görüntüsü. Yazma: yalnız bu tarayıcıda (localStorage), başkasına görünmez.
// Yapay zekâ, PDF/ünite yükleme ve müfredat içe aktarma sunucu ister; kapalıdır ve nedeniyle 503 döner.
(function () {
  var ANAHTAR = "derslik-statik-v1";
  var gercekFetch = window.fetch.bind(window);
  var veriSozu = null;

  function veri() {
    if (!veriSozu) {
      veriSozu = gercekFetch("/statik/veri.json").then(function (r) { return r.json(); });
    }
    return veriSozu;
  }
  function katman() {
    try {
      var h = JSON.parse(localStorage.getItem(ANAHTAR) || "null");
      if (h && typeof h === "object") return { eklenen: h.eklenen || [], silinen: h.silinen || [], guncel: h.guncel || {}, notlar: h.notlar || [] };
    } catch (e) { /* özel pencere */ }
    return { eklenen: [], silinen: [], guncel: {}, notlar: [] };
  }
  function kaydet(k) {
    try { localStorage.setItem(ANAHTAR, JSON.stringify(k)); } catch (e) { /* sessizce geç */ }
  }
  function json(govde, durum) {
    return new Response(JSON.stringify(govde), { status: durum || 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
  var KAPALI = "Bu özellik statik sürümde kapalı (sunucu gerekir).";

  function kartlar(v, k) {
    var silinen = {};
    k.silinen.forEach(function (id) { silinen[id] = 1; });
    return v.cards.concat(k.eklenen)
      .filter(function (c) { return !silinen[c.id]; })
      .map(function (c) { return k.guncel[c.id] ? Object.assign({}, c, k.guncel[c.id]) : c; });
  }
  function sirala(liste) {
    return liste.slice().sort(function (a, b) {
      return String(a.nextReviewAt).localeCompare(String(b.nextReviewAt)) || String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }

  function sm2(c, rating) {
    var aralik = c.intervalDays, ease = c.easeFactor, tekrar = c.repetitionCount;
    if (rating === "again") { tekrar = 0; aralik = 1; ease = Math.max(1.3, ease - 0.2); }
    else if (rating === "hard") { tekrar += 1; aralik = Math.max(1, Math.round(Math.max(1, aralik) * 1.2)); ease = Math.max(1.3, ease - 0.15); }
    else if (rating === "good") { aralik = tekrar === 0 ? 1 : tekrar === 1 ? 3 : Math.max(1, Math.round(aralik * ease)); tekrar += 1; }
    else { aralik = tekrar === 0 ? 3 : Math.max(1, Math.round(aralik * ease * 1.3)); ease += 0.15; tekrar += 1; }
    var simdi = new Date();
    var sonraki = new Date(simdi.getTime() + aralik * 86400000).toISOString();
    return { intervalDays: aralik, easeFactor: ease, repetitionCount: tekrar, lastReviewedAt: simdi.toISOString(), nextReviewAt: sonraki, updatedAt: simdi.toISOString() };
  }

  async function yanit(yol, url, init) {
    var yontem = ((init && init.method) || "GET").toUpperCase();
    var v = await veri();
    var k = katman();
    var q = url.searchParams;
    var govde = null;
    if (init && typeof init.body === "string") { try { govde = JSON.parse(init.body); } catch (e) { govde = null; } }

    if (yontem === "GET") {
      if (yol === "/api/courses") {
        var tum = kartlar(v, k), simdi = new Date().toISOString();
        return json({ courses: v.courses.map(function (c) {
          var kd = tum.filter(function (x) { return x.courseId === c.id; });
          var stats = Object.assign({}, c.stats, { cards: kd.length, dueCards: kd.filter(function (x) { return x.nextReviewAt <= simdi; }).length });
          return Object.assign({}, c, { stats: stats });
        }) });
      }
      if (yol === "/api/curriculum") return json(v.curriculum);
      if (yol === "/api/units") return json({ units: (v.units[q.get("courseId")] || []) });
      if (yol === "/api/pdfs") return json({ pdfs: (v.pdfs[q.get("courseId")] || []) });
      if (yol === "/api/notes") {
        var cid = q.get("courseId");
        var n = (v.notes[cid] || []).concat(k.notlar.filter(function (x) { return !cid || x.courseId === cid; }));
        return json({ notes: n.sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); }) });
      }
      if (yol === "/api/cards") {
        var liste = kartlar(v, k).filter(function (c) {
          return (!q.get("courseId") || c.courseId === q.get("courseId")) &&
            (!q.get("unitId") || c.unitId === q.get("unitId")) &&
            (q.get("dueOnly") !== "true" || c.nextReviewAt <= new Date().toISOString());
        });
        return json({ cards: sirala(liste) });
      }
      if (yol === "/api/feed") {
        var f = v.feed[q.get("courseId") || ""] || v.feed[""] || { cards: [], stats: null };
        return json(f);
      }
      if (yol === "/api/feed/akis") return json({ error: "Statik sürüm" }, 404);
      return json({ error: KAPALI }, 503);
    }

    if (yol === "/api/cards" && yontem === "POST" && govde) {
      if (!govde.courseId || !govde.prompt || !govde.answer) return json({ error: "Ders seçimi, soru/prompt metni ve cevap zorunludur." }, 400);
      var simdi2 = new Date().toISOString();
      var kart = {
        id: "crd_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7), courseId: govde.courseId, unitId: govde.unitId || null,
        pdfSourceId: null, sourcePage: govde.sourcePage || null, userId: "statik", kind: govde.kind === "question" ? "question" : "flashcard",
        prompt: String(govde.prompt).trim(), answer: String(govde.answer).trim(), hint: govde.hint ? String(govde.hint).trim() : null,
        intervalDays: 0, easeFactor: 2.5, repetitionCount: 0, lastReviewedAt: null, nextReviewAt: simdi2, createdAt: simdi2, updatedAt: simdi2,
      };
      k.eklenen.push(kart); kaydet(k);
      return json({ card: kart }, 201);
    }
    var silme = /^\/api\/cards\/([^/]+)$/.exec(yol);
    if (silme && yontem === "DELETE") {
      k.silinen.push(decodeURIComponent(silme[1])); kaydet(k);
      return json({ success: true });
    }
    if (yol === "/api/reviews" && yontem === "POST" && govde) {
      var hedef = kartlar(v, k).filter(function (c) { return c.id === govde.studyItemId; })[0];
      if (!hedef) return json({ error: "Çalışma kartı bulunamadı." }, 404);
      var yeni = sm2(hedef, govde.rating);
      k.guncel[hedef.id] = Object.assign({}, k.guncel[hedef.id] || {}, yeni); kaydet(k);
      return json({ success: true, event: { id: "rev_" + Date.now(), rating: govde.rating }, intervalDays: yeni.intervalDays, nextReviewAt: yeni.nextReviewAt, repetitionCount: yeni.repetitionCount });
    }
    if (yol === "/api/notes" && yontem === "POST" && govde) {
      if (!govde.courseId || !govde.title) return json({ error: "Ders ve not başlığı zorunludur." }, 400);
      var s = new Date().toISOString();
      var not = { id: "n_" + Date.now(), courseId: govde.courseId, unitId: govde.unitId || null, userId: "statik", title: String(govde.title).trim(), content: String(govde.content || "").trim(), createdAt: s, updatedAt: s };
      k.notlar.push(not); kaydet(k);
      return json({ note: not }, 201);
    }
    if (yol === "/api/feed/events" && yontem === "POST") {
      return json({ eventId: (govde && govde.eventId) || "statik", duplicate: false });
    }
    return json({ error: KAPALI }, 503);
  }

  window.fetch = function (girdi, init) {
    try {
      var ham = typeof girdi === "string" ? girdi : girdi && girdi.url;
      var url = new URL(ham, location.href);
      if (url.origin === location.origin && url.pathname.indexOf("/api/") === 0) {
        var ayar = init || (typeof girdi !== "string" && girdi ? { method: girdi.method } : undefined);
        return yanit(url.pathname, url, ayar);
      }
    } catch (e) { /* gerçek fetch'e düş */ }
    return gercekFetch(girdi, init);
  };
})();
