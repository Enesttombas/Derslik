"""Ödev 2: Dinamik dizi (vector).

Otomatik genişleyen dinamik dizi veri yapısı ve geometrik büyüme analizi.
İki katına çıkarma ile birer artırma stratejilerinin kopyalama maliyeti ölçülür.

Kullanım: python vector_dinamik.py
"""


class DinamikDizi:
    def __init__(self):
        self.kapasite = 1
        self.boy = 0
        self.veri = [None] * self.kapasite
        self.kopya = 0
        self.islem = 0

    def _yeniden_boyutlandir(self, yeni_kapasite):
        yeni_veri = [None] * yeni_kapasite
        for i in range(self.boy):
            yeni_veri[i] = self.veri[i]
            self.kopya += 1
            self.islem += 1
        self.veri = yeni_veri
        self.kapasite = yeni_kapasite

    def sona_ekle(self, x):
        if self.boy == self.kapasite:
            self._yeniden_boyutlandir(self.kapasite * 2)
        self.veri[self.boy] = x
        self.boy += 1
        self.islem += 1

    def son_cikar(self):
        if self.boy == 0:
            raise IndexError("Dinamik dizi boş, eleman çıkarılamaz")
        self.boy -= 1
        deger = self.veri[self.boy]
        self.veri[self.boy] = None
        self.islem += 1
        return deger

    def getir(self, i):
        if not 0 <= i < self.boy:
            raise IndexError("Geçersiz indeks")
        self.islem += 1
        return self.veri[i]

    def __len__(self):
        return self.boy


def main():
    dizi = DinamikDizi()
    kapasite_degisimleri = []
    n = 1024

    for i in range(n):
        onceki_kap = dizi.kapasite
        dizi.sona_ekle(i)
        if dizi.kapasite != onceki_kap:
            kapasite_degisimleri.append((i, onceki_kap, dizi.kapasite))

    print(f"Toplam eklenen eleman sayisi (N): {len(dizi)}")
    print("İlk 5 kapasite değişimi (indeks, eski, yeni):", kapasite_degisimleri[:5])
    print(f"Son kapasite: {dizi.kapasite}, Toplam kopyalama: {dizi.kopya}")

    assert len(dizi) == n
    assert dizi.kopya < 2 * n
    assert dizi.getir(0) == 0 and dizi.getir(n - 1) == n - 1

    cikarilan = dizi.son_cikar()
    assert cikarilan == n - 1
    assert len(dizi) == n - 1

    try:
        bos = DinamikDizi()
        bos.son_cikar()
        assert False, "Hata fırlatılmalıydı"
    except IndexError:
        pass

    saf_kopya_1024 = n * (n - 1) // 2
    print("\n--- Kapasite Artırma Stratejileri Karşılaştırması ---")
    print(f"{'N':<8} {'2x Büyüme (Amortize O(1))':<28} {'+1 Saf Büyüme (O(n^2))':<24} {'Kazanç':<10}")
    for buyukluk in (64, 256, 1024):
        test_dizi = DinamikDizi()
        for v in range(buyukluk):
            test_dizi.sona_ekle(v)
        saf_kopya = buyukluk * (buyukluk - 1) // 2
        oran = saf_kopya / test_dizi.kopya
        print(f"{buyukluk:<8} {test_dizi.kopya:<28} {saf_kopya:<24} {oran:<10.1f}x")


if __name__ == "__main__":
    main()
