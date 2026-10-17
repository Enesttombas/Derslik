"""Ödev 7: İki yığın ile kuyruk.

Gelen ve giden yığınları kullanarak FIFO kuyruk davranışının elde edilmesi.
Her eleman en fazla bir kez aktarıldığından amortize karmaşıklık O(1)'dir.

Kullanım: python kuyruk_iki_yigin.py
"""


class IkiYiginKuyruk:
    """İki adet LIFO yığını birleştirerek FIFO kuyruk oluşturan sınıf."""

    def __init__(self):
        self.gelen = []
        self.giden = []
        self.islem = 0
        self.aktarim = 0

    def kuyruga_ekle(self, x):
        """Elemanı gelen yığınının tepesine ekler. Karmaşıklık: O(1)."""
        self.gelen.append(x)
        self.islem += 1

    def _aktar(self):
        """Giden boşsa gelen yığındaki tüm elemanları giden'e ters çevirerek aktarır."""
        if not self.giden:
            while self.gelen:
                self.giden.append(self.gelen.pop())
                self.aktarim += 1
                self.islem += 1

    def kuyruktan_cikar(self):
        """Kuyruğun başındaki elemanı çıkarır. Amortize karmaşıklık: O(1)."""
        if self.bos_mu():
            raise IndexError("Kuyruk boş, eleman çıkarılamaz")
        self._aktar()
        self.islem += 1
        return self.giden.pop()

    def on(self):
        """Kuyruğun başındaki elemanı silmeden inceler."""
        if self.bos_mu():
            raise IndexError("Kuyruk boş, ön eleman yok")
        self._aktar()
        self.islem += 1
        return self.giden[-1]

    def bos_mu(self):
        """Kuyruğun boş olup olmadığını döndürür."""
        return len(self.gelen) == 0 and len(self.giden) == 0

    def __len__(self):
        return len(self.gelen) + len(self.giden)


def main():
    print("=== Ödev 7: İki Yığın ile Kuyruk Doğrulama ===")
    kuyruk = IkiYiginKuyruk()
    for v in [1, 2, 3]:
        kuyruk.kuyruga_ekle(v)
    assert kuyruk.kuyruktan_cikar() == 1
    kuyruk.kuyruga_ekle(4)
    assert kuyruk.kuyruktan_cikar() == 2
    assert kuyruk.kuyruktan_cikar() == 3
    assert kuyruk.kuyruktan_cikar() == 4
    assert kuyruk.bos_mu() is True
    print("1. FIFO sıralaması ve ara ekleme davranışı doğrulandı.")

    bos_hata = False
    try:
        kuyruk.kuyruktan_cikar()
    except IndexError:
        bos_hata = True
    assert bos_hata is True
    print("2. Boş kuyruktan eleman çıkarma IndexError fırlattı.")

    # En kötü tekil çıkarma maliyeti deneyi (O(n))
    n_kotu = 500
    kotu_kuyruk = IkiYiginKuyruk()
    for i in range(n_kotu):
        kotu_kuyruk.kuyruga_ekle(i)
    onceki_islem = kotu_kuyruk.islem
    kotu_kuyruk.kuyruktan_cikar()
    tek_maliyet = kotu_kuyruk.islem - onceki_islem
    # 500 aktarım + 1 pop = 501 işlem
    assert tek_maliyet == n_kotu + 1
    print(f"3. En kotu tekil cikarma maliyeti O(n) kanitlandi: {tek_maliyet} islem.")

    # n = 1000 karışık dizi ve toplam aktarım sınırı
    n = 1000
    test_k = IkiYiginKuyruk()
    cikarilan = []
    for i in range(n):
        test_k.kuyruga_ekle(i)
        if i % 2 == 1:
            cikarilan.append(test_k.kuyruktan_cikar())
    while not test_k.bos_mu():
        cikarilan.append(test_k.kuyruktan_cikar())

    assert cikarilan == list(range(n))
    assert test_k.aktarim <= n
    print(f"4. n={n} karisik ekle/cikar FIFO dogrulandi, toplam aktarim={test_k.aktarim} <= {n}.")

    print("\nSenaryo          Eleman   Aktarım   Akt/Eleman")
    a1, a2 = kotu_kuyruk.aktarim, test_k.aktarim
    print(f"{'Tek Boşaltma':<16} {n_kotu:<8} {a1:<9} {a1 / n_kotu:<10.2f}")
    print(f"{'Karışık Akış':<16} {n:<8} {a2:<9} {a2 / n:<10.2f}")


if __name__ == "__main__":
    main()
