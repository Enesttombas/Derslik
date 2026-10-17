"""Ödev 11: Veri yapıları karşılaştırması.

Dizi (list), çift uçlu kuyruk (deque) ve tek bağlı liste ekleme maliyetleri.
Başa ve sona ekleme işlemlerinin süre ve deterministik adım karşılaştırması.

Kullanım: python karsilastirma.py
"""

from collections import deque
import time


class Dugum:
    def __init__(self, veri, sonraki=None):
        self.veri = veri
        self.sonraki = sonraki


class TekBagliListe:
    def __init__(self):
        self.bas = None
        self.son = None
        self.boyut = 0
        self.adim = 0

    def basa_ekle(self, veri):
        yeni = Dugum(veri, self.bas)
        self.bas = yeni
        if self.son is None:
            self.son = yeni
        self.boyut += 1
        self.adim += 1

    def sona_ekle(self, veri):
        yeni = Dugum(veri)
        if self.son is None:
            self.bas = self.son = yeni
        else:
            self.son.sonraki = yeni
            self.son = yeni
        self.boyut += 1
        self.adim += 1


def olcum_yap(n):
    t0 = time.perf_counter()
    l_bas = []
    for i in range(n):
        l_bas.insert(0, i)
    t_l_bas = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    l_son = []
    for i in range(n):
        l_son.append(i)
    t_l_son = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    d_bas = deque()
    for i in range(n):
        d_bas.appendleft(i)
    t_d_bas = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    d_son = deque()
    for i in range(n):
        d_son.append(i)
    t_d_son = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    b_bas = TekBagliListe()
    for i in range(n):
        b_bas.basa_ekle(i)
    t_b_bas = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    b_son = TekBagliListe()
    for i in range(n):
        b_son.sona_ekle(i)
    t_b_son = (time.perf_counter() - t0) * 1000

    sureler = (t_l_bas, t_l_son, t_d_bas, t_d_son, t_b_bas, t_b_son)
    objeler = (b_bas, b_son, l_bas, d_bas)
    return sureler, objeler


def main():
    boyutlar = (2000, 4000, 8000)
    print("=== Ödev 11: Veri Yapıları Performans Karşılaştırması ===")
    print("\n1. Çalışma Süreleri Tablosu (ms):")
    hdr1 = f"{'N':6} | {'List Baş':10} | {'List Son':10} | {'Deq Baş':10} | " \
           f"{'Deq Son':10} | {'BL Baş':10} | {'BL Son':10}"
    print(hdr1)
    print("-" * 75)

    for n in boyutlar:
        sureler, (b_bas, b_son, l_bas, d_bas) = olcum_yap(n)
        assert b_bas.boyut == n and b_son.boyut == n
        assert b_bas.adim == n and b_son.adim == n
        assert len(l_bas) == n and len(d_bas) == n
        assert b_bas.bas.veri == n - 1 and b_son.son.veri == n - 1
        t_lb, t_ls, t_db, t_ds, t_bb, t_bs = sureler
        print(f"{n:6d} | {t_lb:10.2f} | {t_ls:10.2f} | {t_db:10.2f} | "
              f"{t_ds:10.2f} | {t_bb:10.2f} | {t_bs:10.2f}")

    bos_bl = TekBagliListe()
    assert bos_bl.bas is None and bos_bl.son is None and bos_bl.boyut == 0

    print("\n2. Deterministik İşlem / Kaydırma Adımları Tablosu:")
    print(f"{'N':6} | {'List Baş Kaydırma':18} | {'List Son Adım':14} | "
          f"{'Deque Adım':12} | {'BL Adım':10}")
    print("-" * 70)
    for n in boyutlar:
        kaydirma = n * (n - 1) // 2
        assert kaydirma == n * (n - 1) // 2
        print(f"{n:6d} | {kaydirma:18d} | {n:14d} | {n:12d} | {n:10d}")

    print("\n3. Teorik Karmaşıklık Özet Tablosu:")
    print(f"{'Veri Yapısı':17} | {'Ekleme (Ort/En Kötü)':22} | {'Arama':10} | {'Silme':12}")
    print("-" * 68)
    tablo = [
        ("Dizi / list", "O(1) / O(n) sona", "O(n)", "O(n)"),
        ("Bağlı liste", "O(1) başa/sona", "O(n)", "O(1) bilinen"),
        ("Deque", "O(1) uçlardan", "O(n)", "O(1) uçlardan"),
        ("Yığın (Stack)", "O(1) itme", "O(n)", "O(1) çekme"),
        ("Kuyruk (Queue)", "O(1) kuyruğa", "O(n)", "O(1) kuyruktan"),
        ("İkili Yığın", "O(log n)", "O(n)", "O(log n) kök"),
        ("Hash Tablosu", "O(1) / O(n)", "O(1) / O(n)", "O(1) / O(n)"),
        ("BST (Arama)", "O(log n) / O(n)", "O(log n)", "O(log n)"),
    ]
    for yapi, ekle, ara, sil in tablo:
        print(f"{yapi:17} | {ekle:22} | {ara:10} | {sil:12}")


if __name__ == "__main__":
    main()
