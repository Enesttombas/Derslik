"""Ödev 1: Statik dizi.

Sabit kapasiteli dizi veri yapısı ve eleman bazlı işlem sayacı analizi.
Ekleme, silme ve arama işlemlerinin çalışma karmaşıklıkları incelenir.

Kullanım: python dizi_statik.py
"""


class StatikDizi:
    def __init__(self, kapasite):
        if kapasite <= 0:
            raise ValueError("Kapasite pozitif olmalıdır")
        self.kapasite = kapasite
        self.veri = [None] * kapasite
        self.boy = 0
        self.islem = 0

    def getir(self, i):
        if not 0 <= i < self.boy:
            raise IndexError("Geçersiz indeks")
        self.islem += 1
        return self.veri[i]

    def ata(self, i, x):
        if not 0 <= i < self.boy:
            raise IndexError("Geçersiz indeks")
        self.veri[i] = x
        self.islem += 1

    def sona_ekle(self, x):
        if self.boy >= self.kapasite:
            raise IndexError("Dizi dolu, ekleme yapılamaz")
        self.veri[self.boy] = x
        self.boy += 1
        self.islem += 1

    def araya_ekle(self, i, x):
        if self.boy >= self.kapasite:
            raise IndexError("Dizi dolu, ekleme yapılamaz")
        if not 0 <= i <= self.boy:
            raise IndexError("Geçersiz indeks")
        for j in range(self.boy, i, -1):
            self.veri[j] = self.veri[j - 1]
            self.islem += 1
        self.veri[i] = x
        self.boy += 1
        self.islem += 1

    def sil(self, i):
        if not 0 <= i < self.boy:
            raise IndexError("Geçersiz indeks")
        silinen = self.veri[i]
        for j in range(i, self.boy - 1):
            self.veri[j] = self.veri[j + 1]
            self.islem += 1
        self.veri[self.boy - 1] = None
        self.boy -= 1
        self.islem += 1
        return silinen

    def ara(self, x):
        for j in range(self.boy):
            self.islem += 1
            if self.veri[j] == x:
                return j
        return -1


def main():
    d = StatikDizi(5)
    d.sona_ekle(10)
    d.sona_ekle(20)
    d.araya_ekle(1, 15)
    print("Başlangıç dizisi:", [d.getir(k) for k in range(d.boy)])
    silinen = d.sil(0)
    print("0. indeks silindi:", silinen)
    print("Kalan elemanlar:", [d.getir(k) for k in range(d.boy)])

    assert d.boy == 2
    assert d.getir(0) == 15 and d.getir(1) == 20
    assert d.ara(20) == 1
    assert d.ara(99) == -1

    try:
        mini = StatikDizi(1)
        mini.sona_ekle(42)
        mini.sona_ekle(43)
        assert False, "Hata fırlatılmalıydı"
    except IndexError:
        pass

    try:
        d.getir(10)
        assert False, "Hata fırlatılmalıydı"
    except IndexError:
        pass

    print("\n--- Sona Ekleme vs Başa Ekleme İşlem Sayısı Karşılaştırması ---")
    print(f"{'N':<8} {'Sona Ekle (O(1))':<20} {'Başa Ekle (O(n))':<20} {'Teorik Oran':<12}")
    for n in (100, 1000):
        d_son = StatikDizi(n)
        for val in range(n):
            d_son.sona_ekle(val)
        d_bas = StatikDizi(n)
        for val in range(n):
            d_bas.araya_ekle(0, val)
        print(f"{n:<8} {d_son.islem:<20} {d_bas.islem:<20} {d_bas.islem / d_son.islem:<12.1f}")


if __name__ == "__main__":
    main()
