"""Ödev 6: Dairesel kuyruk.

Sabit boyutlu dizi üzerinde modulo aritmetiğiyle çalışan dairesel kuyruk.
Kaydırma yapılmadığı için tüm ekleme ve çıkarma işlemleri O(1) maliyetlidir.

Kullanım: python kuyruk_dairesel.py
"""


class DaireselKuyruk:
    """Sabit kapasiteli ve modulo tabanlı dairesel kuyruk yapısı."""

    def __init__(self, kapasite):
        if kapasite <= 0:
            raise ValueError("Kapasite pozitif bir tam sayı olmalıdır")
        self.kapasite = kapasite
        self.dizi = [None] * kapasite
        self.bas = 0
        self.boy = 0
        self.islem = 0

    def kuyruga_ekle(self, x):
        """Kuyruğun sonuna eleman ekler. Dolu ise hata fırlatır."""
        if self.dolu_mu():
            raise IndexError("Kuyruk dolu, eleman eklenemez")
        ekle_indeks = (self.bas + self.boy) % self.kapasite
        self.dizi[ekle_indeks] = x
        self.boy += 1
        self.islem += 1

    def kuyruktan_cikar(self):
        """Kuyruğun başındaki elemanı çıkarır ve döndürür."""
        if self.bos_mu():
            raise IndexError("Kuyruk boş, eleman çıkarılamaz")
        deger = self.dizi[self.bas]
        self.dizi[self.bas] = None
        self.bas = (self.bas + 1) % self.kapasite
        self.boy -= 1
        self.islem += 1
        return deger

    def on(self):
        """Kuyruğun başındaki elemanı silmeden döndürür."""
        if self.bos_mu():
            raise IndexError("Kuyruk boş, ön eleman yok")
        self.islem += 1
        return self.dizi[self.bas]

    def bos_mu(self):
        """Kuyruğun boş olup olmadığını döndürür."""
        return self.boy == 0

    def dolu_mu(self):
        """Kuyruğun tamamen dolu olup olmadığını döndürür."""
        return self.boy == self.kapasite

    def __len__(self):
        return self.boy


def main():
    print("=== Ödev 6: Dairesel Kuyruk Doğrulama ===")
    kuyruk = DaireselKuyruk(4)
    for x in ["A", "B", "C"]:
        kuyruk.kuyruga_ekle(x)
    assert kuyruk.kuyruktan_cikar() == "A"
    assert kuyruk.kuyruktan_cikar() == "B"

    # Şimdi bas = 2, boy = 1. Yeni elemanlar ekleyelim (başa sarma / wrap-around).
    kuyruk.kuyruga_ekle("D")
    kuyruk.kuyruga_ekle("E")
    kuyruk.kuyruga_ekle("F")
    assert kuyruk.dolu_mu() is True
    # Ekleme indeksleri sırasıyla 3, 0, 1 oldu (modulo ile başa sarıldı).
    assert kuyruk.dizi == ["E", "F", "C", "D"]
    assert kuyruk.bas == 2
    print(f"1. Basa sarma (wrap-around) basarili: dizi={kuyruk.dizi}, bas={kuyruk.bas}")

    dolu_hata = False
    try:
        kuyruk.kuyruga_ekle("TASMA")
    except IndexError:
        dolu_hata = True
    assert dolu_hata is True
    print("2. Dolu kuyruğa ekleme IndexError ile engellendi.")

    elemanlar = []
    while not kuyruk.bos_mu():
        elemanlar.append(kuyruk.kuyruktan_cikar())
    assert elemanlar == ["C", "D", "E", "F"]
    print(f"3. FIFO sirasi korundu: {elemanlar}")

    bos_hata = False
    try:
        kuyruk.kuyruktan_cikar()
    except IndexError:
        bos_hata = True
    assert bos_hata is True
    print("4. Boş kuyruktan çıkarma IndexError fırlattı.")

    print("\n--- Maliyet Karşılaştırması: Dairesel Kuyruk vs list.pop(0) ---")
    print(f"{'n':<8} {'Dairesel Toplam':<18} {'Dairesel / n':<15} {'pop(0) Kaydırma':<18}")
    for n in [100, 1000]:
        dk = DaireselKuyruk(n)
        for i in range(n):
            dk.kuyruga_ekle(i)
        for _ in range(n):
            dk.kuyruktan_cikar()
        assert dk.islem == 2 * n

        liste = list(range(n))
        kaydirma = 0
        for _ in range(n):
            kaydirma += len(liste) - 1
            liste.pop(0)
        assert kaydirma == n * (n - 1) // 2

        dairesel_oran = dk.islem / n
        print(f"{n:<8} {dk.islem:<18} {dairesel_oran:<15.2f} {kaydirma:<18}")


if __name__ == "__main__":
    main()
