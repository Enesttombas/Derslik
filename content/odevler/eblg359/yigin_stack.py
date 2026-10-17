"""Ödev 5: Yığın (stack).

Liste tabanlı LIFO yığın yapısı ve temel parantez/sonek uygulamaları.
Tüm temel yığın operasyonları O(1) adımda gerçeklenir.

Kullanım: python yigin_stack.py
"""


class Yigin:
    """Son giren ilk çıkar (LIFO) prensibiyle çalışan yığın veri yapısı."""

    def __init__(self):
        self.elemanlar = []
        self.islem = 0

    def it(self, x):
        """Elemanı yığının tepesine ekler. Karmaşıklık: O(1)."""
        self.elemanlar.append(x)
        self.islem += 1

    def cik(self):
        """Tepedeki elemanı çıkarıp döndürür. Boş ise hata fırlatır."""
        if not self.elemanlar:
            raise IndexError("Yığın boş, eleman çıkarılamaz")
        self.islem += 1
        return self.elemanlar.pop()

    def tepe(self):
        """Tepedeki elemanı silmeden okur. Boş ise hata fırlatır."""
        if not self.elemanlar:
            raise IndexError("Yığın boş, tepe eleman yok")
        self.islem += 1
        return self.elemanlar[-1]

    def bos_mu(self):
        """Yığının boş olup olmadığını döndürür. Karmaşıklık: O(1)."""
        return len(self.elemanlar) == 0

    def __len__(self):
        return len(self.elemanlar)


def parantez_dengeli_mi(metin):
    """Metindeki (), [], {} parantezlerinin dengeli olup olmadığını denetler."""
    eslesme = {")": "(", "]": "[", "}": "{"}
    yigin = Yigin()
    for kr in metin:
        if kr in "([{":
            yigin.it(kr)
        elif kr in ")]}":
            if yigin.bos_mu() or yigin.cik() != eslesme[kr]:
                return False
    return yigin.bos_mu()


def sonek_hesapla(ifade):
    """Boşlukla ayrılmış sonek (postfix) matematiksel ifadeyi hesaplar."""
    yigin = Yigin()
    for simge in ifade.split():
        if simge in "+-*/":
            b = yigin.cik()
            a = yigin.cik()
            if simge == "+":
                sonuc = a + b
            elif simge == "-":
                sonuc = a - b
            elif simge == "*":
                sonuc = a * b
            else:
                sonuc = a / b
            yigin.it(sonuc)
        else:
            yigin.it(float(simge))
    return yigin.cik()


def main():
    print("=== Ödev 5: Yığın (Stack) Doğrulama ===")
    y = Yigin()
    for sayi in [10, 20, 30]:
        y.it(sayi)
    assert y.cik() == 30 and y.cik() == 20 and y.cik() == 10
    print("1. LIFO sırası doğrulandı: 30, 20, 10.")

    bos_hata = False
    try:
        y.cik()
    except IndexError:
        bos_hata = True
    assert bos_hata is True
    print("2. Boş yığından çıkarma IndexError ile yakalandı.")

    dengeli = "{[()()]}"
    dengesiz = "{[(])}"
    assert parantez_dengeli_mi(dengeli) is True
    assert parantez_dengeli_mi(dengesiz) is False
    assert parantez_dengeli_mi("(") is False
    print(f"3. Parantez denetimi basarili: '{dengeli}' dengeli, '{dengesiz}' dengesiz.")

    sonek_ifade = "3 4 + 2 *"
    sonuc = sonek_hesapla(sonek_ifade)
    assert sonuc == 14.0
    print(f"4. Sonek hesaplama basarili: '{sonek_ifade}' = {sonuc}")

    print("\n--- Ölçeklenme Testi (O(1) İşlem Maliyeti) ---")
    print(f"{'Boyut (n)':<12} {'Toplam İşlem':<15} {'İşlem / Eleman':<15}")
    for n in [100, 1000]:
        test_yigin = Yigin()
        for i in range(n):
            test_yigin.it(i)
        for _ in range(n):
            test_yigin.cik()
        assert test_yigin.islem == 2 * n
        oran = test_yigin.islem / n
        print(f"{n:<12} {test_yigin.islem:<15} {oran:<15.2f}")


if __name__ == "__main__":
    main()
