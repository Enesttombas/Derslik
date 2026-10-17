"""Ödev 9: İkili yığın (min-heap).

Dizi tabanlı min-heap veri yapısı, Floyd yöntemi ve yığın sıralaması.
Ebeveyn ve çocuk indisleri dizi aritmetiğiyle doğrudan O(1) sürede hesaplanır.

Kullanım: python ikili_yigin_heap.py
"""

import random


class MinYigin:
    def __init__(self):
        self.veri = []
        self.islem = 0

    def __len__(self):
        return len(self.veri)

    def en_kucuk(self):
        if not self.veri:
            raise IndexError("Yığın boş, en küçük eleman bulunamaz.")
        return self.veri[0]

    def _ebeveyn(self, i):
        return (i - 1) // 2

    def _sol_cocuk(self, i):
        return 2 * i + 1

    def _sag_cocuk(self, i):
        return 2 * i + 2

    def ekle(self, x):
        self.veri.append(x)
        self._yukari_sizdir(len(self.veri) - 1)

    def _yukari_sizdir(self, i):
        while i > 0:
            p = self._ebeveyn(i)
            self.islem += 1
            if self.veri[i] < self.veri[p]:
                self.islem += 1
                self.veri[i], self.veri[p] = self.veri[p], self.veri[i]
                i = p
            else:
                break

    def en_kucuk_cikar(self):
        if not self.veri:
            raise IndexError("Yığın boş, eleman çıkarılamaz.")
        kok = self.veri[0]
        son = self.veri.pop()
        if self.veri:
            self.veri[0] = son
            self.islem += 1
            self._asagi_sizdir(0)
        return kok

    def _asagi_sizdir(self, i):
        n = len(self.veri)
        while True:
            sol = self._sol_cocuk(i)
            sag = self._sag_cocuk(i)
            ebk = i
            if sol < n:
                self.islem += 1
                if self.veri[sol] < self.veri[ebk]:
                    ebk = sol
            if sag < n:
                self.islem += 1
                if self.veri[sag] < self.veri[ebk]:
                    ebk = sag
            if ebk != i:
                self.islem += 1
                self.veri[i], self.veri[ebk] = self.veri[ebk], self.veri[i]
                i = ebk
            else:
                break

    def listeden_kur(self, liste):
        self.veri = list(liste)
        self.islem = 0
        n = len(self.veri)
        for i in range((n - 2) // 2, -1, -1):
            self._asagi_sizdir(i)


def yigin_siralama(liste):
    yigin = MinYigin()
    yigin.listeden_kur(liste)
    return [yigin.en_kucuk_cikar() for _ in range(len(liste))]


def main():
    rng = random.Random(7)
    veri = [rng.randint(1, 10000) for _ in range(1000)]
    yigin = MinYigin()
    for x in veri:
        yigin.ekle(x)
    ardisil_islem = yigin.islem

    for i in range(len(yigin)):
        sol = 2 * i + 1
        sag = 2 * i + 2
        if sol < len(yigin):
            assert yigin.veri[i] <= yigin.veri[sol]
        if sag < len(yigin):
            assert yigin.veri[i] <= yigin.veri[sag]

    sirali = [yigin.en_kucuk_cikar() for _ in range(1000)]
    assert sirali == sorted(veri)

    bos_yigin = MinYigin()
    try:
        bos_yigin.en_kucuk_cikar()
        assert False, "Boş yığından çıkarma hata vermeliydi"
    except IndexError:
        pass

    floyd_yigin = MinYigin()
    floyd_yigin.listeden_kur(veri)
    floyd_islem = floyd_yigin.islem
    assert floyd_islem < ardisil_islem

    print("=== Ödev 9: İkili Yığın (Min-Heap) Çalışma Raporu ===")
    print(f"Eleman sayisi: {len(veri)}")
    print(f"Ardisil ekleme islem sayisi: {ardisil_islem}")
    print(f"Floyd ile kurma islem sayisi: {floyd_islem}")
    print(f"Floyd avantaji: {ardisil_islem / floyd_islem:.2f} kat daha az islem")
    print(f"Yigin siralamasi baslangic 5: {sirali[:5]}, bitis 5: {sirali[-5:]}")
    print("\nBoyut (N) | Ardışıl Ekleme Adımı | Floyd Kurma Adımı | Oran")
    print("-" * 55)
    for n in (100, 500, 1000):
        ornek = [rng.randint(1, 100000) for _ in range(n)]
        y1 = MinYigin()
        for v in ornek:
            y1.ekle(v)
        y2 = MinYigin()
        y2.listeden_kur(ornek)
        print(f"{n:9d} | {y1.islem:20d} | {y2.islem:17d} | {y1.islem / y2.islem:6.2f}x")


if __name__ == "__main__":
    main()
