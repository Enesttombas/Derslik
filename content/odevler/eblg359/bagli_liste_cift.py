"""Ödev 4: Çift bağlı liste.

Nöbetçi düğümlü çift bağlı liste yapısı ve iki yönlü işaretçi yönetimi.
Düğüm referansıyla O(1) silme ile tek bağlı listedeki O(n) silme karşılaştırılır.

Kullanım: python bagli_liste_cift.py
"""


class Dugum:
    def __init__(self, deger=None, onceki=None, sonraki=None):
        self.deger = deger
        self.onceki = onceki
        self.sonraki = sonraki


class CiftBagliListe:
    def __init__(self):
        self.bas_nobetci = Dugum("BAS_NOBETCI")
        self.son_nobetci = Dugum("SON_NOBETCI")
        self.bas_nobetci.sonraki = self.son_nobetci
        self.son_nobetci.onceki = self.bas_nobetci
        self.boy = 0
        self.adim = 0

    def araya_ekle(self, dugum, deger):
        if dugum is None or dugum is self.son_nobetci:
            raise ValueError("Geçersiz ekleme konumu")
        sonraki_dugum = dugum.sonraki
        yeni = Dugum(deger, onceki=dugum, sonraki=sonraki_dugum)
        dugum.sonraki = yeni
        sonraki_dugum.onceki = yeni
        self.boy += 1
        self.adim += 1
        return yeni

    def basa_ekle(self, deger):
        return self.araya_ekle(self.bas_nobetci, deger)

    def sona_ekle(self, deger):
        return self.araya_ekle(self.son_nobetci.onceki, deger)

    def dugumu_sil(self, dugum):
        if dugum is None or dugum is self.bas_nobetci or dugum is self.son_nobetci:
            raise ValueError("Nöbetçi veya geçersiz düğüm silinemez")
        dugum.onceki.sonraki = dugum.sonraki
        dugum.sonraki.onceki = dugum.onceki
        self.boy -= 1
        self.adim += 1
        return dugum.deger

    def ara(self, x):
        simdiki = self.bas_nobetci.sonraki
        while simdiki is not self.son_nobetci:
            self.adim += 1
            if simdiki.deger == x:
                return simdiki
            simdiki = simdiki.sonraki
        return None

    def sondan_basa_listele(self):
        sonuc = []
        simdiki = self.son_nobetci.onceki
        while simdiki is not self.bas_nobetci:
            self.adim += 1
            sonuc.append(simdiki.deger)
            simdiki = simdiki.onceki
        return sonuc

    def listeye_cevir(self):
        sonuc = []
        simdiki = self.bas_nobetci.sonraki
        while simdiki is not self.son_nobetci:
            self.adim += 1
            sonuc.append(simdiki.deger)
            simdiki = simdiki.sonraki
        return sonuc


def main():
    liste = CiftBagliListe()
    liste.basa_ekle(20)
    liste.basa_ekle(10)
    liste.sona_ekle(30)
    ortanca_dugum = liste.ara(20)
    liste.araya_ekle(ortanca_dugum, 25)

    print("Baştan sona:", liste.listeye_cevir())
    print("Sondan başa:", liste.sondan_basa_listele())

    assert liste.boy == 4
    assert liste.listeye_cevir() == [10, 20, 25, 30]
    assert liste.sondan_basa_listele() == [30, 25, 20, 10]

    silinen_deger = liste.dugumu_sil(ortanca_dugum)
    print("Silinen düğüm:", silinen_deger)
    print("Silme sonrası:", liste.listeye_cevir())
    assert silinen_deger == 20
    assert liste.listeye_cevir() == [10, 25, 30]

    try:
        liste.dugumu_sil(liste.bas_nobetci)
        assert False, "Hata fırlatılmalıydı"
    except ValueError:
        pass

    try:
        liste.dugumu_sil(None)
        assert False, "Hata fırlatılmalıydı"
    except ValueError:
        pass

    print("\n--- Düğüm Referansı Varken Silme Maliyeti Karşılaştırması ---")
    print(f"{'N':<8} {'Çift Bağlı (O(1))':<20} {'Tek Bağlı (O(n))':<20} {'Fark':<10}")
    for n in (100, 1000):
        c_liste = CiftBagliListe()
        hedef_dugum = None
        for i in range(n):
            d = c_liste.sona_ekle(i)
            if i == n // 2:
                hedef_dugum = d

        onceki_adim = c_liste.adim
        c_liste.dugumu_sil(hedef_dugum)
        cift_silme_adimi = c_liste.adim - onceki_adim

        # Tek bağlı listede elinde hedef düğüm olsa bile öncekini bulmak için n/2 adım gerekir
        tek_silme_adimi = n // 2
        print(f"{n:<8} {cift_silme_adimi:<20} {tek_silme_adimi:<20} {tek_silme_adimi / cift_silme_adimi:<10.1f}x")


if __name__ == "__main__":
    main()
