"""Ödev 3: Tek bağlı liste.

Tek bağlı liste veri yapısı, işaretçi operasyonları ve yerinde ters çevirme.
Başa/sona ekleme ile arama/silme işlemlerinin adım sayıları karşılaştırılır.

Kullanım: python bagli_liste_tek.py
"""


class Dugum:
    def __init__(self, deger, sonraki=None):
        self.deger = deger
        self.sonraki = sonraki


class TekBagliListe:
    def __init__(self):
        self.bas = None
        self.son = None
        self.boy = 0
        self.adim = 0

    def basa_ekle(self, deger):
        yeni = Dugum(deger, self.bas)
        self.bas = yeni
        if self.son is None:
            self.son = yeni
        self.boy += 1
        self.adim += 1

    def sona_ekle(self, deger):
        yeni = Dugum(deger)
        if self.bas is None:
            self.bas = yeni
            self.son = yeni
        else:
            self.son.sonraki = yeni
            self.son = yeni
        self.boy += 1
        self.adim += 1

    def ara(self, x):
        simdiki = self.bas
        while simdiki is not None:
            self.adim += 1
            if simdiki.deger == x:
                return simdiki
            simdiki = simdiki.sonraki
        return None

    def sil(self, deger):
        if self.bas is None:
            raise ValueError("Liste boş, eleman silinemez")
        onceki = None
        simdiki = self.bas
        while simdiki is not None:
            self.adim += 1
            if simdiki.deger == deger:
                if onceki is None:
                    self.bas = simdiki.sonraki
                    if self.bas is None:
                        self.son = None
                else:
                    onceki.sonraki = simdiki.sonraki
                    if simdiki is self.son:
                        self.son = onceki
                self.boy -= 1
                return
            onceki = simdiki
            simdiki = simdiki.sonraki
        raise ValueError(f"Deger listede bulunamadi: {deger}")

    def ters_cevir(self):
        onceki = None
        simdiki = self.bas
        self.son = self.bas
        while simdiki is not None:
            self.adim += 1
            sonraki_dugum = simdiki.sonraki
            simdiki.sonraki = onceki
            onceki = simdiki
            simdiki = sonraki_dugum
        self.bas = onceki

    def listeye_cevir(self):
        sonuc = []
        simdiki = self.bas
        while simdiki is not None:
            self.adim += 1
            sonuc.append(simdiki.deger)
            simdiki = simdiki.sonraki
        return sonuc


def main():
    bos_liste = TekBagliListe()
    bos_liste.ters_cevir()
    assert bos_liste.listeye_cevir() == []

    tek_liste = TekBagliListe()
    tek_liste.basa_ekle(5)
    assert tek_liste.listeye_cevir() == [5]
    tek_liste.sil(5)
    assert tek_liste.listeye_cevir() == []
    assert tek_liste.bas is None and tek_liste.son is None

    liste = TekBagliListe()
    for sayi in [10, 20, 30, 40]:
        liste.sona_ekle(sayi)
    print("Orijinal liste:", liste.listeye_cevir())
    liste.sil(10)
    print("Başı silindi (10):", liste.listeye_cevir())
    liste.sil(40)
    print("Sonu silindi (40):", liste.listeye_cevir())
    assert liste.listeye_cevir() == [20, 30]
    liste.ters_cevir()
    print("Ters çevrildi:", liste.listeye_cevir())
    assert liste.listeye_cevir() == [30, 20]
    assert liste.ara(30) is not None
    assert liste.ara(999) is None

    try:
        liste.sil(999)
        assert False, "Hata fırlatılmalıydı"
    except ValueError:
        pass

    print("\n--- Tek Bağlı Liste İşlem Adımı Karşılaştırması ---")
    print(f"{'N':<8} {'Sona Ekle (O(1))':<18} {'Ara (O(n))':<15} {'Ters Çevir (O(n))':<20}")
    for n in (100, 1000):
        t_liste = TekBagliListe()
        ekleme_adimlari = 0
        for i in range(n):
            onceki = t_liste.adim
            t_liste.sona_ekle(i)
            ekleme_adimlari += (t_liste.adim - onceki)
        onceki_adim = t_liste.adim
        t_liste.ara(n - 1)
        arama_adimi = t_liste.adim - onceki_adim
        onceki_adim = t_liste.adim
        t_liste.ters_cevir()
        ters_adimi = t_liste.adim - onceki_adim
        ortalama_ekle = ekleme_adimlari / n
        print(f"{n:<8} {ortalama_ekle:<18.1f} {arama_adimi:<15} {ters_adimi:<20}")


if __name__ == "__main__":
    main()
