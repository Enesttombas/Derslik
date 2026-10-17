# Akış v2 — Kapsam seçmeli, kod odaklı kaydırmalı çalışma (PLAN)

Durum (2026-10-16): **F0 bitti** (şema `lib/akis-paket.ts`, doğrulayıcı `scripts/check-akis.mjs`, pilot paketler
`content/akis/eblg359/{yigin_stack,kuyruk_dairesel}.json` + `content/akis/eblg351/hafta4.json`, toplam 18 kart).
Çalıştırma: `node --experimental-strip-types scripts/check-akis.mjs` → 3 paket, 18 kart, 0 hata (rc 0).
Şema sapması: `hata-bul` kartına `kod` alanı eklendi (gerçek dosyada hata olmadığı için bozulmuş blok kartta tutulur,
`hataSatir` bu bloğa göre sayılır). `ne-olur`/`cikti-tahmin` kanıtları gerçek koşudan alındı.
Sıradaki: F1 (UI) — Codex'in UI/UX işi bitmeden `components/` ve `app/` dosyalarına dokunma. Önceki durum: plan (kod yok). Kapsam: yalnız **EBLG351 Görüntü İşleme** ve **EBLG359 Algoritma Analizi**.
Enes'in isteği: belirli bir kod / hafta / ödev / ders geneli seçilsin; Instagram/TikTok gibi kaydırınca
önüme örnek ve ödevler gelsin; açıklama istesin, soru sorsun, kod okutsun, "şunu böyle değiştirirsek ne olur" desin.

---

## 1. Mevcut durum (2026-10-15 sürümü) — analiz

Ne var:
- `components/study-feed.tsx` + `study-feed-card.tsx` + `hooks/use-study-feed.ts`; API `GET /api/feed`, `POST /api/feed/events`.
- Dikey kaydırma (dokunma, tekerlek, ↑/↓), Öğren / Antrenman modu, beğen/beğenme, 10/20/tümü oturum, özet ekranı.
- Sıralama `lib/study-feed.ts > rankFeedScore`: tekrar zamanı 40, yanlış oranı 32, yeni kart 8, tercih ±6. Deterministik, testli.
- Olaylar `feed_events` tablosunda; cevap olayı SM2 tekrar zamanını günceller.

Sorunlar (önem sırası):
1. **Kart tek tip: düz metin soru/cevap.** Kaynak yalnız `study_items` (elle kart + notlardaki "Aktif Hatırlama
   Soruları" havuzu). Derslikte en değerli içerik olan ödev kodları (`content/odevler/eblg351|eblg359/*.py`),
   satır-grup açıklamaları (`*.aciklama.json`: aciklama + sinav), ödev adımları (`assignments.json`) ve gerçek
   çıktılar (`public/odevler/...`) akışta **hiç kullanılmıyor**.
2. **Kapsam seçimi yok.** Tek filtre "ders". Hafta, ödev, kod dosyası veya "genel tekrar" seçilemiyor.
3. **Öğren modu pasif.** Cevap doğrudan açık geliyor; kendi araştırma raporumuz (work/derslik-kaydirmali-plan-2026-10-15)
   bunu "akıcılık yanılsaması" diye işaretliyor. Önce tahmin, sonra açıklama olmalı.
4. **Antrenman yalnız öz-beyan.** "Doğru yaptım / Tekrar çalış" dışında doğrulanabilir etkileşim yok
   (çoktan seçmeli, satır seçme, sıralama yok).
5. **Kod okuma, çıktı tahmini, "ne olur?" senaryosu, hata bulma kartı yok** — isteğin çekirdeği eksik.
6. Akış boşken müfredat içe aktarma gerekiyor; seçilen ders için hazır içerik kendiliğinden gelmiyor.
7. Konu bazlı zayıflık yok: yanlışlar kart bazında tutuluyor, "Sobel'de zayıfsın" gibi konu sinyali yok.
8. Mobil başlık kalabalık (mod + ders + limit + yenile tek satırda).
9. Olay API'si kartı `study_items` içinde arıyor; repo içi statik kartlar için olay kaydı şu an 404 verir.

Korunacak: kaydırma jest motoru, deterministik sıralama, olay idempotensi, SM2, sonlu oturum, 44px dokunma hedefleri.

---

## 2. Hedef deneyim

Akış açılır → **Kapsam seçici** (alt sayfa / sheet):
- Ders: Görüntü İşleme | Algoritma Analizi
- Kapsam: **Genel tekrar** | **Hafta N** | **Ödev** (ör. "4.3 Sobel", "Yığın") | **Kod dosyası** (ör. `kenarlar.py`)
- Kart türleri (çoklu seçim çipleri, varsayılan hepsi) + oturum uzunluğu (10/20)
- Seçim URL'de ve localStorage'da tutulur; "son kapsamla devam" tek dokunuş.

Sonra tam ekran dikey akış. Her kart **tek bir işi** sorar; önce Enes cevaplar, sonra açıklama açılır.

### Kart türleri

| Tür | Ne gösterir | Enes ne yapar | Doğrulama |
|---|---|---|---|
| `kod-oku` | Kod dosyasından 2-8 satırlık blok (aciklama.json grubu) | "Bu blok ne yapar?" — kısa yazar veya 3-4 şıktan seçer | Şık: otomatik. Yazı: açıklamayla karşılaştırıp öz-değerlendirme |
| `ne-olur` | Blok + tek değişiklik (diff görünümü: `ksize=3` → `ksize=7`, `list` → `deque`) | Sonucu tahmin eder (şık) | Otomatik + açıklama. 351'de varsa önceden üretilmiş **önce/sonra görseli** |
| `cikti-tahmin` | Kısa kod + girdi | Çıktıyı / son durumu seçer | Gerçek çalıştırma çıktısından üretilmiş doğru şık |
| `hata-bul` | Bloğa bilerek eklenmiş tek hata | Hatalı satıra dokunur | Satır numarası eşleşmesi |
| `acikla` | Kavram veya blok | Kendi cümlesiyle açıklar (Feynman) | Model cevap + `sinav` notu ile öz-değerlendirme |
| `sinav` | `sinav` alanından tanım/formül/sık hata | Boşluk doldurma veya doğru/yanlış (sağ/sol kaydır) | Otomatik |
| `odev` | Ödev özeti + adımlar karışık | Adımları doğru sıraya dizer | Sıra eşleşmesi |
| `karmasiklik` (yalnız 359) | İşlem + veri yapısı | Big-O seçer, gerekçeyi okur | Otomatik |

Her kartın altında **kaynak çıpası**: "kenarlar.py s.12-18 · Hafta 4 · Ödev 4.3" → dokununca Ödevler sekmesinde
o satır grubu vurgulu açılır. Beğen/beğenme korunur; ek olarak "**Bundan daha çok**" (aynı konu etiketi ağırlığını artırır).

### Etkileşim sözleşmesi
- Yukarı kaydır = sonraki, aşağı = önceki (değişmez). Kart içi kod alanı kendi kaydırmasını yer, sonra akış devralır.
- Doğru/yanlış kartlarında sağ = doğru, sol = yanlış; her jestin buton karşılığı var.
- Cevap verilmeden açıklama açılmaz ama **"Bilmiyorum, göster"** her zaman var (yanlış sayılır, cezasız ton).
- Kod görünümü Ödevler sekmesi kuralına uyar: yatay kaydırma yok, satır sarılır, girinti korunur, 13px açıklama.

---

## 3. Veri tasarımı

**Kart paketleri repo içinde, statik JSON** (çalışma anında yapay zekâ yok; mevcut "uydurma cevap yok" ilkesiyle uyumlu):

```
content/akis/eblg351/hafta4.json      # hafta başına bir paket
content/akis/eblg359/yigin_stack.json # veya kod dosyası başına
```

Kart şeması (taslak, uygulamada Zod ile `lib/akis-paket.ts`):
```json
{
  "id": "351-h4-sobel-ne-olur-ksize",      // kalıcı, olay kaydının anahtarı
  "ders": "EBLG351", "hafta": 4, "odev": "h4-3", "dosya": "hafta4/kenarlar.py",
  "satirlar": [12, 18], "tur": "ne-olur", "etiketler": ["sobel", "gradyan", "cekirdek-boyutu"],
  "soru": "ksize=3 yerine 7 olursa kenar haritası nasıl değişir?",
  "degisiklik": { "eski": "ksize=3", "yeni": "ksize=7" },
  "secenekler": ["...", "...", "..."], "dogru": 1,
  "aciklama": "...", "sinav": "...",
  "gorsel": { "once": "/odevler/eblg351/hafta4/...png", "sonra": "/akis/eblg351/...png" }
}
```

Kurallar:
- `dosya` + `satirlar` gerçek dosyada var olmalı; kodu karta kopyalamayız, **çalışma anında dosyadan keseriz**
  (kod değişirse kart bozulduğunu doğrulayıcı yakalar).
- `ne-olur` ve `cikti-tahmin` doğru cevabı **gerçek çalıştırmadan** gelir: `scripts/akis-uret-cikti.py` varyantı koşar,
  çıktı/görseli `public/akis/...` altına yazar, karta yalnız sonucu koyar. Tahminle cevap yazılmaz.
- Doğrulayıcı `scripts/check-akis.mjs` (`check-curriculum.mjs` gibi): şema, satır aralığı, tek doğru şık,
  benzersiz id, görsel dosyası var, her hafta/ödev için en az N kart.

**Sunucu bağlantısı:**
- `GET /api/feed` yeni parametreler: `ders`, `kapsam=genel|hafta|odev|dosya`, `deger`, `turler`. Paket kartları
  `pak:<id>` önekiyle `study_items` kartlarıyla birleşir; genel tekrarda ikisi karışık gelir.
- `POST /api/feed/events`: `pak:` önekli kart için sahiplik kontrolü yerine "paket kataloğunda var mı" kontrolü.
  Cevap olayına `secim` (şık/satır/sıra) alanı eklenir; doğruluk **sunucuda** paketten hesaplanır, istemciye güvenilmez.
- Paket kartlarının tekrar zamanı için yeni tablo `akis_kart_durumu (user_id, kart_id, sonraki_tekrar, aralik, kolaylik, tekrar)`
  — `study_items`'ı paket kopyalarıyla şişirmemek için. Additive migration.
- Sıralamaya **konu zayıflığı** eklenir: etiket bazlı yanlış oranı (ör. `sobel` %60 yanlış → o etiketli kartlar öne).
  Mevcut ağırlık sırası korunur: tekrar zamanı > zayıflık > yeni > tercih. Aynı tür arka arkaya en fazla 2 (iç içe alıştırma).

---

## 4. Fazlar ve kabul ölçütleri

**F0 — Şema + doğrulayıcı + pilot paket** (Opus şema, işçi pilot içerik)
- `lib/akis-paket.ts` (Zod şema, saf, `--experimental-strip-types` ile içe aktarılabilir), `scripts/check-akis.mjs`.
- Pilot: EBLG351 Hafta 4 (Sobel, Prewitt, Canny) ~12 kart + EBLG359 `yigin_stack.py` / `kuyruk_dairesel.py` ~12 kart, 6 türün hepsinden.
- Kabul: `node scripts/check-akis.mjs` rc 0; bilerek bozulmuş satır aralığı ve çift doğru şık rc ≠ 0.

**F1 — Kapsam seçici + kart oluşturucular (yalnız istemci, paketten okur)**
- `components/akis/` altında tür başına küçük bileşen; kod bloğu ortak `AkisKod` (sarmalı, satır vurgulu, diff kipi).
- Kabul: tarayıcıda 390px ve masaüstünde her tür cevaplanır, açıklama cevaptan önce açılmaz, yatay kaydırma yok,
  kaynak çıpası doğru satır grubunu açar. Ekran görüntüsü kanıtı.

**F2 — Sunucu entegrasyonu**
- API parametreleri, `pak:` olayları, sunucu tarafı doğruluk, `akis_kart_durumu` migration, etiket zayıflığı sıralaması.
- Kabul: gerçek D1'e karşı API duman testi (dünkü `work/derslik-feed-2026-10-15/api-smoke.mjs` genişletilir):
  yanlış şık → yanlış kaydı; aynı eventId iki kez → tek kayıt; başka kullanıcının kart durumu okunamaz; mevcut akış testleri yeşil.

**F3 — İçerik doldurma** — TAMAM 2026-10-16: 286 kart, 14 paket; her ders notu haftası 5, her ödev ≥3 kart; `check-akis` kapsam.json'a karşı doğrular. Sayısal iddialar gerçek koşuyla ölçüldü. (işçi hacmi, Opus son tat/doğruluk turu)
- 351: her ödev (hafta3 5 ödev, hafta4 7 ödev, kök dizindeki 6 kod) için en az 6 kart; `ne-olur` görselleri gerçek koşudan.
- 359: 11 veri yapısı kodu için en az 6 kart + notlardaki hafta 1-16 için `sinav`/`karmasiklik` kartları.
- Kabul: doğrulayıcı yeşil + Opus örneklem incelemesi (her paketten 3 kart elle açılıp cevap doğruluğu kontrol).

**F4 — Cila**
- Mobil başlık sadeleşir (kapsam çipi tek satır, ayrıntı sheet'te), "son kapsamla devam", oturum özeti konu bazlı
  ("Sobel 3/5, Canny 1/4 → zayıf: Canny eşikleri").

Sonraki (bu planın dışında, ertelendi): serbest metin cevabı yapay zekâyla puanlama, diğer derslere genişleme.

---

## 5. İş bölümü (EnesOS kuralı)

- Opus: şema, sunucu doğruluk/olay mantığı, sıralama değişikliği, son kabul, içerik örneklem denetimi.
- Gemini işçi (`agy-gw.sh --kabul`): kart bileşenleri, doğrulayıcı, pilot ve toplu kart taslakları, çıktı üretim betiği.
- Tat işi (kartın hissi, animasyon, kod görünümü): başlamadan Enes'e sorulacak — Gemini tat hattı mı, Opus tek mi.

## 6. Enes'e açık sorular

1. Kart sırası: kapsam içinde **önce kolay → zor** mu, yoksa baştan **karışık** mı? (Öneri: hafta/ödev kapsamında kolay→zor, genel tekrarda karışık.)
2. Serbest metin cevaplarını şimdilik öz-değerlendirmeyle bırakalım mı? (Öneri: evet; yapay zekâ puanlaması sonra.)
3. Pilot için Hafta 4 + Yığın/Kuyruk uygun mu, yoksa önce sınava yakın başka bir hafta mı?
