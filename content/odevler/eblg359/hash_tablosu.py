"""Ödev 8: Hash tablosu (zincirleme).

Ayrık zincirleme ve dinamik yeniden hashleme ile sözlük veri yapısı.
Polinomsal hash fonksiyonu ile anahtarlar kovalara dengeli dağıtılır.

Kullanım: python hash_tablosu.py
"""


class ZincirliHash:
    """Ayrık zincirleme yöntemiyle çalışan dinamik hash tablosu."""

    def __init__(self, baslangic_kapasite=4):
        self.kovalar = [[] for _ in range(baslangic_kapasite)]
        self.eleman_sayisi = 0
        self.islem = 0
        self.yeniden_hash = 0

    def _hash(self, anahtar):
        """Polinomsal (taban 31) deterministik metin hash fonksiyonu."""
        h = 0
        for ch in str(anahtar):
            h = h * 31 + ord(ch)
        return h % len(self.kovalar)

    def yuk_orani(self):
        """Mevcut doluluk oranını (n / m) hesaplar."""
        return self.eleman_sayisi / len(self.kovalar)

    def _yeniden_hashle(self):
        """Kova sayısını iki katına çıkarıp elemanları tekrar dağıtır."""
        self.yeniden_hash += 1
        eski_kovalar = self.kovalar
        self.kovalar = [[] for _ in range(len(eski_kovalar) * 2)]
        self.eleman_sayisi = 0
        for kova in eski_kovalar:
            for k, v in kova:
                idx = self._hash(k)
                self.kovalar[idx].append([k, v])
                self.eleman_sayisi += 1

    def ekle(self, anahtar, deger):
        """Anahtar-değer çiftini ekler, varsa değerini günceller."""
        idx = self._hash(anahtar)
        for cift in self.kovalar[idx]:
            self.islem += 1
            if cift[0] == anahtar:
                cift[1] = deger
                return
        self.kovalar[idx].append([anahtar, deger])
        self.eleman_sayisi += 1
        if self.yuk_orani() > 0.75:
            self._yeniden_hashle()

    def ara(self, anahtar):
        """Anahtarın değerini döndürür, yoksa None döndürür."""
        idx = self._hash(anahtar)
        for cift in self.kovalar[idx]:
            self.islem += 1
            if cift[0] == anahtar:
                return cift[1]
        return None

    def sil(self, anahtar):
        """Anahtarı siler; silindiyse True, bulunamadıysa False döndürür."""
        idx = self._hash(anahtar)
        for i, cift in enumerate(self.kovalar[idx]):
            self.islem += 1
            if cift[0] == anahtar:
                del self.kovalar[idx][i]
                self.eleman_sayisi -= 1
                return True
        return False

    def __len__(self):
        return self.eleman_sayisi


def main():
    print("=== Ödev 8: Hash Tablosu (Zincirleme) Doğrulama ===")
    ht = ZincirliHash(4)
    meyveler = [
        "elma", "armut", "muz", "cilek", "kiraz", "kavun", "karpuz", "seftali",
        "erik", "incir", "uzum", "nar", "ayva", "portakal", "mandalina",
        "limon", "visne", "dut", "ananas", "kivi"
    ]
    for i, meyve in enumerate(meyveler):
        ht.ekle(meyve, (i + 1) * 10)

    assert len(ht) == 20
    assert ht.yeniden_hash >= 3
    print(f"1. 20 anahtar eklendi, yeniden hashleme sayisi: {ht.yeniden_hash}")
    print(f"   Kova sayisi: {len(ht.kovalar)}, Yuk orani: {ht.yuk_orani():.3f}")

    dagilim = [len(k) for k in ht.kovalar]
    print(f"2. Kova dagilimi: {dagilim}")

    ht.islem = 0
    for i, meyve in enumerate(meyveler):
        val = ht.ara(meyve)
        assert val == (i + 1) * 10
    ort_arama = ht.islem / len(meyveler)
    print(f"3. Tum anahtarlar bulundu. Arama basina karsilastirma: {ort_arama:.2f}")

    beklenen_ust = 1.0 + ht.yuk_orani()
    assert ort_arama <= beklenen_ust + 0.5
    print(f"   Teorik sinir (1 + alpha) = {beklenen_ust:.2f} civarinda kaldi.")

    assert ht.ara("ejder_meyvesi") is None
    print("4. Olmayan anahtar için None döndürüldüğü doğrulandı.")

    assert ht.sil("elma") is True
    assert ht.ara("elma") is None
    assert len(ht) == 19
    print("5. Anahtar silme işlemi doğrulandı.")

    print("\n--- Hash Tablosu Başarım Özeti ---")
    print(f"{'Metrik':<25} {'Değer':<10}")
    print(f"{'Toplam Eleman':<25} {len(ht):<10}")
    print(f"{'Kova Sayısı':<25} {len(ht.kovalar):<10}")
    print(f"{'Yük Oranı (alpha)':<25} {ht.yuk_orani():<10.3f}")
    print(f"{'Ortalama Arama Maliyeti':<25} {ort_arama:<10.2f}")


if __name__ == "__main__":
    main()
