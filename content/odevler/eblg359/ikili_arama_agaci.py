"""Ödev 10: İkili arama ağacı.

İkili arama ağacında yinelemesiz ekleme ve arama, yükseklik ve ortanca dolaşım.
Dengeli ağaçta O(log n) olan arama maliyetinin dejenere ağaçta O(n) oluşu ölçülür.

Kullanım: python ikili_arama_agaci.py
"""

import random


class IADugum:
    def __init__(self, anahtar, sol=None, sag=None):
        self.anahtar = anahtar
        self.sol = sol
        self.sag = sag


class IkiliAramaAgaci:
    def __init__(self):
        self.kok = None
        self.adim = 0

    def ekle(self, anahtar):
        yeni = IADugum(anahtar)
        if self.kok is None:
            self.kok = yeni
            self.adim += 1
            return
        m = self.kok
        while True:
            self.adim += 1
            if anahtar < m.anahtar:
                if m.sol is None:
                    m.sol = yeni
                    break
                m = m.sol
            elif anahtar > m.anahtar:
                if m.sag is None:
                    m.sag = yeni
                    break
                m = m.sag
            else:
                break

    def ara(self, anahtar):
        m = self.kok
        while m is not None:
            self.adim += 1
            if anahtar == m.anahtar:
                return True
            m = m.sol if anahtar < m.anahtar else m.sag
        return False

    def yukseklik(self, d=-1):
        d = self.kok if d == -1 else d
        if d is None:
            return 0
        return 1 + max(self.yukseklik(d.sol), self.yukseklik(d.sag))

    def ortanca_dolasim(self, d=-1, res=None):
        if res is None:
            res = []
        d = self.kok if d == -1 else d
        if d is not None:
            self.ortanca_dolasim(d.sol, res)
            res.append(d.anahtar)
            self.ortanca_dolasim(d.sag, res)
        return res

    def en_kucuk(self):
        if self.kok is None:
            raise ValueError("Ağaç boş, en küçük anahtar bulunamaz.")
        m = self.kok
        while m.sol is not None:
            self.adim += 1
            m = m.sol
        return m.anahtar

    def en_buyuk(self):
        if self.kok is None:
            raise ValueError("Ağaç boş, en büyük anahtar bulunamaz.")
        m = self.kok
        while m.sag is not None:
            self.adim += 1
            m = m.sag
        return m.anahtar


def main():
    rng = random.Random(7)
    veri = list(range(1, 201))
    karisik = list(veri)
    rng.shuffle(karisik)

    agac_dengeli, agac_sirali = IkiliAramaAgaci(), IkiliAramaAgaci()
    for x in karisik:
        agac_dengeli.ekle(x)
    for x in veri:
        agac_sirali.ekle(x)

    assert agac_dengeli.ortanca_dolasim() == veri
    assert agac_sirali.ortanca_dolasim() == veri
    assert agac_dengeli.en_kucuk() == 1 and agac_dengeli.en_buyuk() == 200
    assert agac_sirali.en_kucuk() == 1 and agac_sirali.en_buyuk() == 200

    h_dengeli = agac_dengeli.yukseklik()
    h_sirali = agac_sirali.yukseklik()
    assert h_sirali == 200 and h_dengeli < 20

    agac_dengeli.adim, agac_sirali.adim = 0, 0
    assert agac_dengeli.ara(200) and agac_sirali.ara(200)
    adim_dengeli, adim_sirali = agac_dengeli.adim, agac_sirali.adim
    assert adim_dengeli < adim_sirali

    bos_agac = IkiliAramaAgaci()
    try:
        bos_agac.en_kucuk()
        assert False, "Boş ağaçta hata fırlatılmalıydı"
    except ValueError:
        pass

    print("=== Ödev 10: İkili Arama Ağacı (BST) Çalışma Raporu ===")
    print(f"Toplam dugum sayisi: {len(veri)}")
    print(f"Dengeli agac yuksekligi: {h_dengeli} (O(log n) beklenir)")
    print(f"Sirali (dejenere) agac yuksekligi: {h_sirali} (O(n) bagli liste)")
    print(f"Eleman (200) arama -> Dengeli: {adim_dengeli}, Sirali: {adim_sirali}")
    print(f"Arama hizlanma orani: {adim_sirali / adim_dengeli:.2f}x")
    print("\n  N  | Dengeli Y | Sıralı Y | Dengeli Adım | Sıralı Adım")
    print("-" * 55)
    for n in (50, 100, 200):
        t_sirali = list(range(1, n + 1))
        t_karisik = list(t_sirali)
        rng.shuffle(t_karisik)
        a1, a2 = IkiliAramaAgaci(), IkiliAramaAgaci()
        for v in t_karisik:
            a1.ekle(v)
        for v in t_sirali:
            a2.ekle(v)
        a1.adim, a2.adim = 0, 0
        a1.ara(n)
        a2.ara(n)
        print(f"{n:4d} | {a1.yukseklik():9d} | {a2.yukseklik():8d} | {a1.adim:12d} | {a2.adim:11d}")


if __name__ == "__main__":
    main()
