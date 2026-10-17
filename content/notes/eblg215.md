## Hafta 1 — Sayı Sistemleri ve Taban Dönüşümleri

### Öğrenme Hedefleri
Bu bölümü tamamladığında şunları yapabilirsin:
1. Dört sayı sistemini (ikilik, onluk, sekizlik, onaltılık) ve rakamlarını sayabilmek.
2. $n$ bit ile $2^n$ durum gösterilebileceğini örnekleriyle söyleyebilmek.
3. İkilik ↔ onluk, ikilik ↔ sekizlik, ikilik ↔ onaltılık dönüşümlerini kâğıt üzerinde hatasız yapabilmek.

### Kavram Anlatımı

#### Dört sayı sistemi
Sayı sistemleri 4 çeşittir. Sayı parantez içine yazılır, taban sağ alt indis olarak eklenir.

| Sistem | Taban | Rakamlar | Örnek |
|---|---|---|---|
| Binary (ikilik) | 2 | 0, 1 | $(0110)_2$, $(1010101)_2$ |
| Decimal (onluk) | 10 | 0–9 | $(78)_{10}$ |
| Octal (sekizlik) | 8 | 0–7 | $(752)_8$ |
| Hexadecimal (onaltılık) | 16 | 0–9 ve A–F | $(16A)_{16}$, $(ABC14)_{16}$ |

İkilik sayıda 0 ve 1'den başka rakam olmaz. Onaltılıkta harfler: A=10, B=11, C=12, D=13, E=14, F=15.

#### Bit sayısı ve durum sayısı
Bir bit iki farklı durum gösterir (1-0, açık-kapalı, var-yok). Daha fazla durumu göstermek için daha fazla bit gerekir. $n$ bit ile gösterilebilecek durum sayısı $2^n$'dir.

| Bit sayısı $n$ | Durum sayısı $2^n$ | Defterdeki örnek |
|---|---|---|
| 1 | 2 | |
| 4 | 16 | Intel 4004 (ilk ticari işlemci) |
| 8 | 256 | ATmega328P mikrodenetleyici |
| 16 | 65.536 | Microchip dsPIC33F mikrodenetleyici |
| 32 | 4.294.967.296 | ARM Cortex mikrodenetleyiciler |
| 64 | 18.446.744.073.709.551.616 | Intel Core i7 |

#### Bu sistemleri neden öğreniyoruz
- Sekizlik 3 bitlik, onaltılık 4 bitlik bilgiyi tek rakamla taşır; uzun ikilik sayıları kısa yazmak için kullanılır.
- Onluk günlük hayatta kullandığımız sistemdir.
- İkilik bilgisayarın ana yazılımının (dilinin) tabanıdır.
- İstenirse 32, 64 gibi tabanlar da tanımlanabilir.

#### İkilik → Onluk
Sağdan başlayarak her basamak $2^0, 2^1, 2^2, \ldots$ ile çarpılır, sonuçlar toplanır.

$$(101101)_2 = 1\cdot2^5 + 0\cdot2^4 + 1\cdot2^3 + 1\cdot2^2 + 0\cdot2^1 + 1\cdot2^0 = 32 + 8 + 4 + 1 = 45$$

#### Onluk → İkilik
Sayı sonuç 1 olana kadar 2'ye bölünür; kalanlar **sondan başa** (son kalan en solda) yazılır.

$$29 \to 14\ (r1) \to 7\ (r0) \to 3\ (r1) \to 1\ (r1) \to 0\ (r1) \implies (11101)_2$$

Kesirli kısım için kesir sürekli 2 ile çarpılır, her adımdaki tam kısım yazılır:

$$0{,}625\times2=1{,}25\ (1);\quad 0{,}25\times2=0{,}5\ (0);\quad 0{,}5\times2=1{,}0\ (1)\implies (0{,}101)_2$$

#### İkilik ↔ Sekizlik
- İkilik → sekizlik: ikilik sayı **sağdan başlayarak 3'erli** gruplanır; her grup 4-2-1 ağırlıklarıyla bir rakama çevrilir. Eksik kalan soldaki gruba 0 eklenir.
- Sekizlik → ikilik: her rakam 3 bitlik ikilik olarak yazılır.

#### İkilik ↔ Onaltılık
- İkilik → onaltılık: **sağdan 4'erli** gruplanır; her grup 8-4-2-1 ağırlıklarıyla toplanır, 10–15 arası değerler A–F olarak yazılır.
- Onaltılık → ikilik: $16 = 2^4$ olduğu için her rakam 4 bitle yazılır.

#### Dönüşüm özeti (defterdeki kutu)

| Dönüşüm | Kural |
|---|---|
| 2 → 10 | Sondan başa 2'nin kuvvetleriyle çarp, sonra topla |
| 10 → 2 | Sonuç 1 olana kadar 2'ye böl, kalanları sondan başa yaz |
| 2 → 8 | 3'erli grupla (sağdan), her grubu 4-2-1 ile topla |
| 8 → 2 | Her rakamı 3 bitle yaz |
| 2 → 16 | 4'erli grupla (sağdan), 8-4-2-1 ile topla; 10–15 → A–F |
| 16 → 2 | Her rakamı 4 bitle yaz |

### Çözümlü Örnekler (defterden)

**İkilik → onluk**
- $(0110)_2 = 4 + 2 = 6$
- $(010110)_2 = 16 + 4 + 2 = 22$
- $(101101)_2 = 32 + 8 + 4 + 1 = 45$
- $(01100101)_2 = 64 + 32 + 4 + 1 = 101$
- $(101100101)_2 = 256 + 32 + 4 + 1 = 357$

**Onluk → ikilik**
- $(29)_{10} = (11101)_2$
- $(16)_{10} = (10000)_2$
- $(118)_{10} = (1110110)_2$
- $(188)_{10} = (10111100)_2$

**İkilik → sekizlik**
- $(001\ 001\ 010\ 110)_2 = (1126)_8$
- $(010\ 011\ 010)_2 = (232)_8$
- $(010\ 100\ 111\ 011)_2 = (2473)_8$

**Sekizlik → ikilik**
- $(752)_8 = (111\ 101\ 010)_2$
- $(62)_8 = (110\ 010)_2$
- $(164)_8 = (001\ 110\ 100)_2$
- $(3572)_8 = (011\ 101\ 111\ 010)_2$

**İkilik → onaltılık**
- $(0110\ 1001)_2 = (69)_{16}$ (0110 = 6, 1001 = 9)
- $(0001\ 0111\ 1011)_2 = (17B)_{16}$ (1011 = 11 = B)
- $(0110\ 1110)_2 = (6E)_{16}$ (1110 = 14 = E)
- $(1011\ 1001\ 1101)_2 = (B9D)_{16}$
- $(1101\ 0101\ 0110\ 1101)_2 = (D56D)_{16}$

**Onaltılık → ikilik**
- $(9A)_{16} = (1001\ 1010)_2$
- $(A8B4)_{16} = (1010\ 1000\ 1011\ 0100)_2$
- $(F29C5)_{16} = (1111\ 0010\ 1001\ 1100\ 0101)_2$

### Sık Yapılan Hata
- Gruplamayı soldan başlatmak. Hem 3'erli hem 4'erli gruplama **virgülden/sağdan** başlar; eksik kalan soldaki gruba 0 eklenir.
- Bölme kalanlarını baştan okumak. Kalanlar sondan başa okunur.
- Onaltılıkta harf değerlerini karıştırmak (B = 11, D = 13, E = 14).

### Aktif Hatırlama Soruları
1. $(110101)_2$ sayısının onluk karşılığı nedir?
2. $(77)_{10}$ sayısını ikilik tabana çeviriniz.
3. $(1011101101)_2$ sayısını sekizlik tabana çeviriniz.
4. $(3C7)_{16}$ sayısını ikilik tabana çeviriniz.
5. 8 bit ve 16 bit ile kaç farklı durum gösterilebilir?
6. $(1101110110)_2$ sayısını onaltılık tabana çeviriniz.

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. $1\cdot32 + 1\cdot16 + 0\cdot8 + 1\cdot4 + 0\cdot2 + 1\cdot1 = 53$. Cevap: $(53)_{10}$.
2. $77 \to 38\ (r1) \to 19\ (r0) \to 9\ (r1) \to 4\ (r1) \to 2\ (r0) \to 1\ (r0) \to 0\ (r1)$. Sondan başa: $(1001101)_2$. Doğrulama: $64 + 8 + 4 + 1 = 77$.
3. Sağdan 3'erli: $001\ 011\ 101\ 101 \to 1,\ 3,\ 5,\ 5$. Cevap: $(1355)_8$.
4. $3 = 0011,\ C = 1100,\ 7 = 0111$. Cevap: $(0011\ 1100\ 0111)_2 = (1111000111)_2$ (baştaki sıfırlar atılabilir).
5. $2^8 = 256$ durum, $2^{16} = 65.536$ durum.
6. Sağdan 4'erli: $0011\ 0111\ 0110 \to 3,\ 7,\ 6$. Cevap: $(376)_{16}$.
</details>

---

## Hafta 2 — İkilik Sayılarda Toplama, Çıkarma, Çarpma, Bölme

### Öğrenme Hedefleri
1. İkilik toplama, çıkarma, çarpma ve bölme kurallarını ezbersiz uygulayabilmek.
2. Çıkarmayı 1'e tümleyen (tümleme) yöntemiyle yapıp sonucun işaretini yorumlayabilmek.

### Kavram Anlatımı

#### Toplama
$$0+0=0,\quad 0+1=1,\quad 1+0=1,\quad 1+1=10\ (\text{0 yaz, elde 1})$$

Basamak basamak sağdan sola toplanır; elde bir sonraki basamağa eklenir. Örnekler:
- $11 + 10 = 101$ ($3 + 2 = 5$)
- $101 + 110 = 1011$ ($5 + 6 = 11$)
- $1011 + 0011 = 1110$ ($11 + 3 = 14$)

#### Çıkarma
$$0-0=0,\quad 0-1=1\ (\text{borç}),\quad 1-0=1,\quad 1-1=0$$

Örnekler: $111 - 011 = 100$; $110 - 10 = 100$; $1011 - 1001 = 0010$.

#### Tümleme yöntemiyle çıkarma
Eksilen $XXXXX$, çıkan $YYYYY$, kalan $ZZZZZ$ olsun. Adımlar:
1. Çıkan sayının **1'e tümleyeni** alınır ($1 \to 0$, $0 \to 1$).
2. Eksilen ile çıkanın 1'e tümleyeni toplanır.
3. Toplamın en solundaki bit (basamak) alta getirilerek (**end-around carry**) toplama eklenir.
4. En büyük basamakta **elde 1 oluştuysa sonuç pozitif**, elde oluşmadıysa **negatiftir**; negatifse sonucun tersi (1'e tümleyeni) alınıp eksi işaretiyle yazılır.

#### Çarpma
$$0\times0=0,\quad 0\times1=0,\quad 1\times0=0,\quad 1\times1=1$$

Onluk çarpmadaki gibi her çarpan basamağı için kaydırılmış satırlar yazılır ve toplanır.

#### Bölme
$$0:0=0,\quad 0:1=0,\quad 1:0=0\ (\text{tanımsız},\ \text{defterde } 0),\quad 1:1=1$$

Uzun bölme onluktaki gibi yapılır; her adımda çıkarma ikilik kurala göre yapılır.

### Çözümlü Örnekler

**Tümleme ile çıkarma**
- $1101 - 1010$: 1010'un tümleyeni $0101$. $1101 + 0101 = 1\ 0010$. Elde 1 → pozitif. Elde sağa eklenir: $0010 + 1 = 0011$. Sonuç: $0011$ ($13 - 10 = 3$).
- $1001 - 1101$: 1101'in tümleyeni $0010$. $1001 + 0010 = 1011$. Elde yok → negatif. Tersi: $0100$. Sonuç: $-0100$ ($9 - 13 = -4$).
- $11001 - 10011$: 10011'in tümleyeni $01100$. $11001 + 01100 = 1\ 00101$. Elde 1 → pozitif. $00101 + 1 = 00110$ ($25 - 19 = 6$).

**Çarpma**
- $11 \times 11$: $11 + 110 = 1001$ ($3 \times 3 = 9$).
- $11 \times 10 = 110$ ($3 \times 2 = 6$).
- $1010 \times 1001$: satırlar $1010$, $0000$, $0000$, $1010$ (kaydırılmış). Toplam $1011010$ ($10 \times 9 = 90$).

**Bölme**
- $1100 : 100 = 11$ ($12 : 4 = 3$). $1100$'dan $100$ çıkar → $100$ kalır; yine $100$ çıkar → kalan $000$.

### Sık Yapılan Hata
- $1 + 1 = 2$ yazmak. İkilikte $1 + 1 = 10$'dur.
- Tümleme yönteminde end-around elde'yi eklemeyi unutmak.
- Elde yokken sonucu pozitif sanmak. Elde yoksa sonuç negatiftir ve tersi alınır.

### Aktif Hatırlama Soruları
1. $1101 + 1011$ işlemini ikilik tabanda yapınız.
2. $1110 - 0101$ işlemini 1'e tümleyen yöntemiyle yapınız.
3. $0101 - 1000$ işlemini 1'e tümleyen yöntemiyle yapınız ve sonucun işaretini belirtiniz.
4. $101 \times 11$ işlemini ikilik tabanda yapınız.
5. $1111 : 11$ işlemini ikilik tabanda yapınız.
6. İkilik tabanda $1 + 1$ kaçtır ve elde ne olur?

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. $1101 + 1011 = 11000$ ($13 + 11 = 24$).
2. 0101'in tümleyeni $1010$. $1110 + 1010 = 1\ 1000$. Elde 1 → pozitif. $1000 + 1 = 1001$ ($14 - 5 = 9$).
3. 1000'in tümleyeni $0111$. $0101 + 0111 = 1100$. Elde yok → negatif. 1100'ün tersi $0011$. Sonuç $-0011$ ($5 - 8 = -3$).
4. $101 \times 11 = 101 + 1010 = 1111$ ($5 \times 3 = 15$).
5. $1111 : 11 = 101$ ($15 : 3 = 5$). Adımlar: ilk iki basamak $11$, $11 - 11 = 00$ → bölüm basamağı $1$; sıradaki basamak $1$ aşağı alınır → $01$, $11$'e sığmaz → bölüm basamağı $0$; son basamak $1$ aşağı alınır → $011$ → $11 - 11 = 0$ → bölüm basamağı $1$. Bölüm $101$, kalan $0$.
6. $1 + 1 = 10$: toplam basamağı $0$ yazılır, **elde $1$** bir sonraki basamağa taşınır.
</details>

---

## Hafta 3 — Lojik Kapılar

### Öğrenme Hedefleri
1. Entegre devre ve lojik kapıların temelini (iki gerilim seviyesi) anlatabilmek.
2. Sekiz lojik kapının adını, çıkış ifadesini ve doğruluk tablosunu bilmek.
3. Kapıların anahtar-lamba benzetmesini ve entegre numaralarını söyleyebilmek.

### Kavram Anlatımı

#### Entegre devreler ve gerilim seviyeleri
Entegre devreler; güç harcamasının az, çalışma hızının yüksek, ebatlarının küçük ve ekonomik olması gibi üstün özellikleri nedeniyle tercih edilir. Lojik kapılara geçmeden önce konunun iyi bilinmesi gerekir.

Lojik kapı devrelerinde **2 gerilim seviyesi** vardır:
1. **Lojik 1**: yüksek seviye ($+5\text{ V}$)
2. **Lojik 0**: düşük seviye ($0\text{ V}$)

Lojik kapılar genel itibarıyla **transistör ve diyotlardan** meydana gelir.

#### Sekiz lojik kapı

| # | Kapı | Çıkış ifadesi | Entegre | Anahtar benzetmesi |
|---|---|---|---|---|
| 1 | Tampon (Buffer) | $Q = A$ | 7407 | Lamba, anahtarla seri |
| 2 | Veya (OR) | $Q = A + B$ (toplama) | | İki anahtar **paralel** |
| 3 | Ve (AND) | $Q = A \cdot B$ (çarpma) | | İki anahtar **seri** |
| 4 | Değil (NOT) | $Q = \overline{A}$ | | Anahtar lambaya paralel, direnç $R$ üzerinden |
| 5 | Ve Değil (NAND) | $Q = \overline{A \cdot B}$ | 7400 | AND + NOT |
| 6 | Veya Değil (NOR) | $Q = \overline{A + B}$ | 7402 | OR + NOT |
| 7 | Özel Veya (XOR) | $Q = A \oplus B = \overline{A}B + A\overline{B}$ | 7486 | Çift konumlu (değiştirmeli) anahtar |
| 8 | Özel Veya Değil (XNOR) | $Q = \overline{A \oplus B} = \overline{\overline{A}B + A\overline{B}} = \overline{A}\,\overline{B} + AB$ | | XOR + NOT |

- VE kapısı iki girişli, bir çıkışlı kapıdır; **çarpma kapısı** olarak da bilinir.
- VEYA kapısı iki girişli, bir çıkışlı kapıdır; **toplama kapısı** olarak da bilinir.
- DEĞİL kapısının bir girişi ve bir çıkışı vardır, **tersleme kapısıdır**. Defterdeki devrede anahtar açıkken lamba yanar, anahtar kapalıyken söner.

#### Doğruluk tabloları

| A | B | OR | AND | NAND | NOR | XOR | XNOR |
|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 1 | 1 | 0 | 1 |
| 0 | 1 | 1 | 0 | 1 | 0 | 1 | 0 |
| 1 | 0 | 1 | 0 | 1 | 0 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 |

Tek girişli kapılar: Tampon $A=0 \to 0,\ A=1 \to 1$; DEĞİL $A=0 \to 1,\ A=1 \to 0$.

#### Ek bilgi
- NAND = AND'in çıkışına NOT eklemek; NOR = OR'un çıkışına NOT eklemek (defterdeki şekillerde "$\equiv$" ile gösterilir).
- XOR yalnız girişler **farklıyken** 1 verir; XNOR girişler **eşitken** 1 verir.

### Sık Yapılan Hata
- XOR ile OR'u karıştırmak: $A=B=1$ iken OR çıkışı 1, XOR çıkışı 0'dır.
- NAND ve NOR'un çıkışını AND/OR'unkiyle aynı yazmak; çıkış tersleniyor.

### Aktif Hatırlama Soruları
1. Defterdeki 8 lojik kapının adlarını sayınız.
2. $A=1,\ B=1$ iken OR, AND, NAND, NOR, XOR, XNOR çıkışları nedir?
3. 7400, 7402 ve 7486 entegreleri hangi kapılardır?
4. XOR kapısının çıkış ifadesini iki biçimde yazınız.
5. Anahtar-lamba devresinde AND ve OR kapıları anahtarların nasıl bağlanmasıyla elde edilir?
6. XNOR kapısı hangi giriş durumlarında 1 verir?

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. Tampon (Buffer), Veya (OR), Ve (AND), Değil (NOT), Ve Değil (NAND), Veya Değil (NOR), Özel Veya (XOR), Özel Veya Değil (XNOR).
2. OR $=1$, AND $=1$, NAND $=0$, NOR $=0$, XOR $=0$, XNOR $=1$.
3. 7400 = NAND, 7402 = NOR, 7486 = XOR.
4. $Q = A \oplus B = \overline{A}B + A\overline{B}$.
5. AND: anahtarlar **seri** (ikisi de kapalıysa lamba yanar). OR: anahtarlar **paralel** (biri kapalıysa lamba yanar).
6. Girişler **eşitken**: $A=B=0$ veya $A=B=1$ (ifade: $\overline{A}\,\overline{B} + AB$).
</details>

---

## Hafta 4 — Boolean Matematiği ve De Morgan

### Öğrenme Hedefleri
1. Boolean teoremlerini (10 madde) ve isimlerini bilmek.
2. De Morgan teoremlerini uygulayabilmek.
3. Boolean ifadelerini sadeleştirip lojik devre olarak çizebilmek.

### Kavram Anlatımı

#### Genel bilgi
- Devre matematiğinin temeli, George Boole tarafından 1847'de mantığın matematiksel analizi üzerine yazdığı tez ile ortaya çıkar.
- Boolean matematiği basit bir matematiktir ama anahtarlı devrelerde çok önemli rol oynar.
- Lojik devre tasarımında ve lojik devre basitleştirilmesinde kullanılır.
- Sayısal devrelerin analizini ve tasarımını sağlayan matematiksel bir teoridir.
- Sayısal PC devreleri uygulamasında ikili değişkenler üzerinde tanımlanan sayısal operasyonları gösterir; yani ikili sayı sistemine dayanır.

#### Toplama ve çarpma
$$0+0=0,\ 0+1=1,\ 1+0=1,\ 1+1=1 \qquad\quad 0\cdot0=0,\ 0\cdot1=0,\ 1\cdot0=0,\ 1\cdot1=1$$

#### Boolean teoremleri

| # | Teorem | Adı |
|---|---|---|
| 1 | $A + 0 = A$, $\quad A \cdot 1 = A$ | |
| 2 | $A + 1 = 1$, $\quad A \cdot 0 = 0$ | |
| 3 | $A + A = A$, $\quad A \cdot A = A$ | |
| 4 | $A + \overline{A} = 1$, $\quad A \cdot \overline{A} = 0$ | |
| 5 | $\overline{\overline{A}} = A$ | Çift terslemenin iptali |
| 6 | $A \cdot B = B \cdot A$, $\quad A + B = B + A$ | Yer değiştirme |
| 7 | $A + B + C = A + (B + C)$, $\quad (AB)C = A(BC)$ | Birleşme |
| 8 | $A(B + C) = AB + AC$, $\quad A + BC = (A + B)(A + C)$ | Dağılma |
| 9 | $A + AB = A$, $\quad A(A + B) = A$ | **Gereksizlik** |
| 10 | $A + \overline{A}B = A + B$, $\quad A(\overline{A} + B) = AB$ | **Benzetme** |

#### De Morgan teoremleri
$$\overline{A + B} = \overline{A} \cdot \overline{B} \qquad\qquad \overline{A \cdot B} = \overline{A} + \overline{B}$$

Terslemeyi dağıtırken **VE ↔ VEYA** değişir ve her değişken terslenir.

#### Boolean ifadesinin lojik devrede gösterimi
- $Q = (A+B)\cdot\overline{(C+D)}$: bir **OR** ($A+B$), bir **NOR** ($\overline{C+D}$) ve ikisini birleştiren bir **AND** kullanılır.
- $Q = A\overline{B}C + B\cdot\overline{(C+D)}$: $B$ bir NOT'tan geçip $A$ ve $C$ ile 3 girişli AND'e girer; $B$ ile NOR$(C,D)$ çıkışı ikinci bir AND'e girer; iki AND çıkışı bir **OR** ile birleşir ("and – or and – or" yapısı).
- Çizim kuralı: önce en içteki parantezden başla, her işlem için bir kapı koy, ters için NOT sembolü (daire) kullan.

### Çözümlü Örnekler (defterden)

1. $(A+B)\overline{A} = A\overline{A} + B\overline{A} = 0 + B\overline{A} = \mathbf{B\overline{A}}$
2. $(A+B)(B+C) = AB + AC + BB + BC = B(A + C + 1) + AC = \mathbf{B + AC}$
3. $\overline{AB}\,(A+B)(\overline{A}+A) = (\overline{A}+\overline{B})(A+B) = \overline{A}B + A\overline{B} = \mathbf{A \oplus B}$ (XOR)
4. $ABC + A\overline{B}C + A\overline{C} + BC = AC(B+\overline{B}) + A\overline{C} + BC = AC + A\overline{C} + BC = A + BC$
5. $A + \overline{AB} = A + \overline{A} + \overline{B} = \overline{B} + 1 = \mathbf{1}$
6. $\overline{A}\,B\overline{C} + B\overline{C} = B\overline{C}(\overline{A}+1) = \mathbf{B\overline{C}}$
7. $\big(\overline{A+B} + \overline{B}C\big)(\overline{A}+C) = \overline{B}(\overline{A}+C)(\overline{A}+C) = \overline{B}(\overline{A}+C) = \mathbf{\overline{A}\,\overline{B} + \overline{B}C}$
8. $AB + (A+B)A = AB + A = A(B+1) = \mathbf{A}$ (gereksizlik)
9. $(A+\overline{B})(A+B) = A + AB + A\overline{B} + B\overline{B} = A + A(B+\overline{B}) = A + A = \mathbf{A}$
10. $(A \odot B) + (A \oplus B) = (\overline{A}\,\overline{B} + AB) + (\overline{A}B + A\overline{B}) = \overline{A}(\overline{B}+B) + A(B+\overline{B}) = \overline{A} + A = \mathbf{1}$

Ek örnekler:
- $\overline{A+B} + \overline{AB}\cdot B = \overline{A}\,\overline{B} + (\overline{A}+\overline{B})B = \overline{A}(\overline{B} + B) = \mathbf{\overline{A}}$
- $(A \oplus B)\cdot\overline{AB} = (\overline{A}B + A\overline{B})(\overline{A}+\overline{B}) = \mathbf{A \oplus B}$
- $(A \odot B) + (A \oplus B)(\overline{A}+B) = \overline{A}\,\overline{B} + AB + \overline{A}B = \overline{A} + AB = \mathbf{\overline{A} + B}$ (benzetme ile)

### Sık Yapılan Hata
- De Morgan'da yalnız işareti değiştirip değişkenleri terslemeyi unutmak: $\overline{A+B} \ne \overline{A} + \overline{B}$.
- $A + AB = A$ (gereksizlik) ile $A + \overline{A}B = A + B$ (benzetme) kurallarını karıştırmak.
- $A + \overline{A}$'yı $0$, $A \cdot \overline{A}$'yı $1$ yazmak; doğrusu $A+\overline{A}=1$ ve $A\overline{A}=0$.

### Aktif Hatırlama Soruları
1. $A + \overline{A}B$ ifadesini sadeleştiriniz ve kullandığınız teoremin adını yazınız.
2. $(A+B)\overline{A}$ ifadesini sadeleştiriniz.
3. $\overline{A+B}$ ve $\overline{A \cdot B}$ ifadelerini De Morgan ile açınız.
4. $AB + A\overline{B} + \overline{A}B$ ifadesini sadeleştiriniz.
5. $(A+\overline{B})(A+B)$ ifadesini sadeleştiriniz.
6. $(A \odot B) + (A \oplus B)$ ifadesinin değeri nedir?
7. $Q = (A+B)\cdot\overline{(C+D)}$ devresi kaç ve hangi kapılarla çizilir?

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. $A + \overline{A}B = A + B$. Teorem 10: **benzetme kanunu**.
2. $(A+B)\overline{A} = A\overline{A} + B\overline{A} = 0 + B\overline{A} = \overline{A}B$.
3. $\overline{A+B} = \overline{A}\cdot\overline{B}$ ve $\overline{A\cdot B} = \overline{A} + \overline{B}$.
4. $AB + A\overline{B} = A(B+\overline{B}) = A$. Sonra $A + \overline{A}B = A + B$ (benzetme). Cevap: $A + B$.
5. $A + AB + A\overline{B} + B\overline{B} = A + A(B+\overline{B}) + 0 = A$. Cevap: $A$.
6. $(A \odot B) + (A \oplus B) = 1$ (XNOR ile XOR birbirinin tümleyenidir).
7. 3 kapı: bir **OR** ($A+B$), bir **NOR** ($\overline{C+D}$) ve bunları birleştiren bir **AND**.
</details>

---

## Hafta 5 — Bileşik Mantık Devreleri: Minterm ve Maxterm

### Öğrenme Hedefleri
1. Minterm ve maxterm kavramlarını ve $\sum$, $\prod$ gösterimlerini bilmek.
2. Doğruluk tablosundan ve Boolean denkleminden minterm/maxterm listesi çıkarabilmek.
3. Minterm/maxterm listesini sadeleştirip devreye dönüştürebilmek.

### Kavram Anlatımı

#### Fikir
- Dijital bir devrenin çıkışı ya 1 ya da 0 olmak zorundadır.
- Çıkışın 1 olduğu tüm durumlar mantık kapılarıyla oluşturulduğunda geriye kalan durumlar 0 olmak zorundadır; benzer şekilde çıkışın 0 olması gereken tüm durumlar oluşturulursa geriye kalanlar 1 olur.
- Bu durumlardan **çıkışın 1 olduğu satırlara minterm, 0 olduğu satırlara maxterm** denir.
- Devrenin iç yapısı bilinmediği için bütün özellikleri doğruluk tablosuna uygularız; çıkışı $F$ olan sistemi, girişleri değişken olan bir $F$ fonksiyonu gibi yazarız.

$$m \to \text{minterm: çarpımların toplamı}\ (\sum)\ ,\qquad M \to \text{maxterm: toplamların çarpımı}\ (\prod)$$

**Kural özeti:** minterm → çıkış **1**; maxterm → çıkış **0**.

#### Minterm ve maxterm tablosu (3 değişken, ABC)

> [!WARNING]
> Defterde bu tablo için "**Sınavda bunu eklemeyi soruya unutma!!!**" yazıyor. Minterm/maxterm sorularında önce bu tabloyu kâğıda yaz.

| A B C | Minterm | Maxterm |
|---|---|---|
| 0 0 0 | $m_0 = \overline{A}\,\overline{B}\,\overline{C}$ | $M_0 = A + B + C$ |
| 0 0 1 | $m_1 = \overline{A}\,\overline{B}C$ | $M_1 = A + B + \overline{C}$ |
| 0 1 0 | $m_2 = \overline{A}B\overline{C}$ | $M_2 = A + \overline{B} + C$ |
| 0 1 1 | $m_3 = \overline{A}BC$ | $M_3 = A + \overline{B} + \overline{C}$ |
| 1 0 0 | $m_4 = A\overline{B}\,\overline{C}$ | $M_4 = \overline{A} + B + C$ |
| 1 0 1 | $m_5 = A\overline{B}C$ | $M_5 = \overline{A} + B + \overline{C}$ |
| 1 1 0 | $m_6 = AB\overline{C}$ | $M_6 = \overline{A} + \overline{B} + C$ |
| 1 1 1 | $m_7 = ABC$ | $M_7 = \overline{A} + \overline{B} + \overline{C}$ |

Minterm'de 1 olan giriş **düz**, 0 olan giriş **terslenmiş** yazılır. Maxterm'de tam tersi: 0 olan giriş **düz**, 1 olan giriş **terslenmiş**.

### Çözümlü Örnekler (defterden)

**Doğruluk tablosundan** ($C\,B\,A$ sırasıyla, satır numarası = ikilik değeri):

| # | C B A | F |
|---|---|---|
| 0 | 0 0 0 | 1 |
| 1 | 0 0 1 | 1 |
| 2 | 0 1 0 | 1 |
| 3 | 0 1 1 | 0 |
| 4 | 1 0 0 | 0 |
| 5 | 1 0 1 | 1 |
| 6 | 1 1 0 | 0 |
| 7 | 1 1 1 | 0 |

$F(CBA) = \sum(0,1,2,5)$ (minterm) ve $F(CBA) = \prod(3,4,6,7)$ (maxterm).

Başka bir tablo: $F = 1$ olan satırlar $0,3,6,7$ ise
- $F(CBA) = \sum(0,3,6,7) = \overline{C}\,\overline{B}\,\overline{A} + \overline{C}BA + CB\overline{A} + CBA$
- $F(CBA) = \prod(1,2,4,5) = (C+B+\overline{A})(C+\overline{B}+A)(\overline{C}+B+A)(\overline{C}+B+\overline{A})$

**Denklemden minterm bulma** — $F = AB + A\overline{C}$ (eksik değişkenleri $(x+\overline{x})$ ile tamamla):
$$F = AB(C+\overline{C}) + A\overline{C}(B+\overline{B}) = ABC + AB\overline{C} + AB\overline{C} + A\overline{B}\,\overline{C} = m_7 + m_6 + m_6 + m_4$$
Tekrarlayan terim bir kez sayılır: $F = \sum(4,6,7)$.

**Denklemden minterm** — $F = A + \overline{A}\,\overline{C} + BC$:
- $A \to m_4, m_5, m_6, m_7$
- $\overline{A}\,\overline{C} \to m_0, m_2$
- $BC \to m_3, m_7$
- Birleşim: $F = \sum(0,2,3,4,5,6,7)$ (yalnız $m_1$ eksik).

**Denklemden maxterm** — $F = (A+B)(A+\overline{C})$:
- $A + B = (A+B+C)(A+B+\overline{C}) = M_0 M_1$
- $A + \overline{C} = (A+B+\overline{C})(A+\overline{B}+\overline{C}) = M_1 M_3$
- $F = \prod(0,1,3)$ (tekrar eden $M_1$ bir kez).

**Denklemden maxterm** — $F = (A+C)(B+\overline{C})$: $A+C \to M_0, M_2$; $B+\overline{C} \to M_1, M_5$. $F = \prod(0,1,2,5)$.

**Sadeleştirme**
- $F(AB) = \sum(0,3) = \overline{A}\,\overline{B} + AB = A \odot B$ (XNOR).
- $F(AB) = \prod(1,2) = (A+\overline{B})(\overline{A}+B) = AB + \overline{A}\,\overline{B} = A \odot B$.
- $F(ABC) = \sum(1,2,6,7) = \overline{A}\,\overline{B}C + \overline{A}B\overline{C} + AB\overline{C} + ABC = \overline{A}(B \oplus C) + AB$.
- $F(ABC) = \prod(0,2,4,6)$: sıfırlar hep $C=0$ satırlarında, birler $C=1$ satırlarında → $F = C$. Cebirle: $(A+B+C)(A+\overline{B}+C)(\overline{A}+B+C)(\overline{A}+\overline{B}+C) = (A+C)(\overline{A}+C) = C$.

**Devre örneği:** $F = AB + A\overline{C}$ iki AND (AB ve $A\overline{C}$) ve bir OR ile; $F = A + \overline{A}\,\overline{C} + BC$ iki AND ve bir 3 girişli OR ile çizilir (iki seviyeli AND-OR).

### Sık Yapılan Hata
- Minterm ile maxterm'de terslemeyi ters uygulamak (minterm'de 0 → tersli; maxterm'de 1 → tersli).
- $\sum$ listesini yazarken satır numaralarını (ikilik değerini) yanlış sıralamak. Girişlerin sırası ($ABC$ mi $CBA$ mı) soruda belirtilmelidir.
- Tekrarlayan minterm'i iki kez saymak ($m_6 + m_6 = m_6$).

### Aktif Hatırlama Soruları
1. Çıkışı $F=1$ olan satırlar $0,1,2,5$ olan 3 değişkenli fonksiyonun $\sum$ ve $\prod$ gösterimlerini yazınız.
2. $F = AB + A\overline{C}$ fonksiyonunu $\sum$ biçiminde yazınız (3 değişken: A, B, C).
3. $F = (A+B)(A+\overline{C})$ fonksiyonunu $\prod$ biçiminde yazınız.
4. $F(AB) = \sum(0,3)$ fonksiyonu hangi lojik kapıdır?
5. $F(ABC) = \prod(0,2,4,6)$ fonksiyonunu sadeleştiriniz.
6. $F = A + \overline{A}\,\overline{C} + BC$ fonksiyonunda $F=0$ olan satır hangisidir ve $\prod$ gösterimi nedir?

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. 3 değişkende satırlar $0\ldots7$; 1 olanlar $0,1,2,5$ ise 0 olanlar $3,4,6,7$. $F = \sum(0,1,2,5) = \prod(3,4,6,7)$.
2. $AB(C+\overline{C}) + A\overline{C}(B+\overline{B}) = m_7 + m_6 + m_6 + m_4$. $F = \sum(4,6,7)$.
3. $A+B \to M_0, M_1$; $A+\overline{C} \to M_1, M_3$. $F = \prod(0,1,3)$.
4. $\overline{A}\,\overline{B} + AB = A \odot B$: **XNOR**.
5. Sıfırlar $0,2,4,6$ (hepsinde $C=0$); birler $1,3,5,7$ ($C=1$). $F = C$.
6. $A$, $\overline{A}\,\overline{C}$ ve $BC$ birlikte $0,2,3,4,5,6,7$ satırlarını kapsar; yalnız satır $1$ ($\overline{A}\,\overline{B}C$) 0'dır. $F = \prod(1) = A + B + \overline{C}$.
</details>

---

## Hafta 6 — Karnaugh Haritaları

### Öğrenme Hedefleri
1. Karnaugh haritasının amacını ve hücre numaralamasını (2, 3, 4 değişken) bilmek.
2. 1'leri 2'nin kuvveti büyüklüğünde gruplayıp sadeleştirilmiş ifade yazabilmek.
3. Haritadan elde edilen ifadeyi Boolean cebirle doğrulayabilmek.

### Kavram Anlatımı

#### Amaç
Karnaugh haritaları **mantık ifadelerini sadeleştirmek** için kullanılır. Bir devrede giriş sayısı arttıkça sadeleştirme işlemi zorlaşır ve hata oranı artar. Genelde minterm gösteriminde kullanılır, yani **1 olan durumlar** gruplanır; ancak maxterm yani 0 olan durumlar kullanılarak da sadeleştirme yapılabilir. Giriş sayısı $n$ olan devrede $2^n$ durum vardır.

#### 2 girişli harita
| A \ B | 0 | 1 |
|---|---|---|
| **0** | $m_0$ | $m_1$ |
| **1** | $m_2$ | $m_3$ |

#### 3 girişli harita ($2^3 = 8$)
Sütunlar **Gray kodu** sırasındadır (00, 01, 11, 10): komşu hücreler yalnız 1 bit farklıdır.

| A \ BC | 00 | 01 | 11 | 10 |
|---|---|---|---|---|
| **0** | $m_0$ | $m_1$ | $m_3$ | $m_2$ |
| **1** | $m_4$ | $m_5$ | $m_7$ | $m_6$ |

Harita iki biçimde çizilebilir: $A$ satırda $BC$ sütunda (yukarıdaki), ya da $AB$ satırda $C$ sütunda.

#### 4 girişli harita ($2^4 = 16$)
| AB \ CD | 00 | 01 | 11 | 10 |
|---|---|---|---|---|
| **00** | $m_0$ | $m_1$ | $m_3$ | $m_2$ |
| **01** | $m_4$ | $m_5$ | $m_7$ | $m_6$ |
| **11** | $m_{12}$ | $m_{13}$ | $m_{15}$ | $m_{14}$ |
| **10** | $m_8$ | $m_9$ | $m_{11}$ | $m_{10}$ |

#### Gruplama kuralları
- Gruplar yalnız **1'lerden** oluşur; büyüklükleri **2'nin kuvvetidir** (defterdeki not: 2'li veya 4'lü gruplanabilir; 1, 8, 16'lı gruplar da aynı kuraldır).
- Grup ne kadar büyükse ifade o kadar kısalır (2'li grup 1 değişken, 4'lü grup 2 değişken eler).
- Haritanın **kenarları birbirine komşudur** (sol-sağ, üst-alt, dört köşe).
- Bir 1 birden fazla grupta yer alabilir.
- Her grup için grup içinde **değişmeyen değişkenler** yazılır: değişmeyen 1 ise düz, 0 ise terslenmiş. Grupların ifadeleri **toplanır**: $F = f_1 + f_2 + \ldots$

### Çözümlü Örnekler (defterden)

**2 girişli**
- $F = A\overline{B} + AB = A(\overline{B}+B) = A$. Harita: $m_2, m_3$ satır $A=1$'de iki komşu → $F = A$.
- $F = \overline{A}\,\overline{B} + \overline{A}B = \overline{A}$. $m_0, m_1$ → $F = \overline{A}$.
- $F = A + \overline{A}B = AB + A\overline{B} + \overline{A}B$ ($m_3, m_2, m_1$). Satır $A=1$ → $f_1 = A$; sütun $B=1$ → $f_2 = B$. $F = A + B$.

**3 girişli**
- $F = A\overline{B}C + \overline{A}B\overline{C} + AB\overline{C} + ABC$ ($m_5, m_2, m_6, m_7$):

| A \ BC | 00 | 01 | 11 | 10 |
|---|---|---|---|---|
| **0** | 0 | 0 | 0 | 1 |
| **1** | 0 | 1 | 1 | 1 |

  $m_2, m_6$ (sütun $BC=10$) → $f_1 = B\overline{C}$; $m_5, m_7$ → $f_2 = AC$. $F = B\overline{C} + AC$.
- $F = \overline{A}\,\overline{B}\,\overline{C} + \overline{A}\,\overline{B}C + A\overline{B}\,\overline{C} + A\overline{B}C$ ($m_0, m_1, m_4, m_5$) → 4'lü grup, $B=0$ sabit → $F = \overline{B}$ (cebirle: $f_1 = \overline{A}\,\overline{B},\ f_2 = A\overline{B},\ F = \overline{B}(\overline{A}+A) = \overline{B}$).
- $F = \overline{A}\,\overline{B}\,\overline{C} + \overline{A}\,\overline{B}C + AB\overline{C} + ABC$ ($m_0, m_1, m_6, m_7$) → $\overline{A}\,\overline{B} + AB = A \odot B$.
- Satır $A=0$'ın tamamı 1 ($m_0..m_3$): 4'lü grup, $A=0$ sabit → $F = \overline{A}$.

**4 girişli**
- $F = \overline{A}\,\overline{B}CD + \overline{A}BCD + \overline{A}\,\overline{B}C\overline{D} + \overline{A}BC\overline{D} + \overline{A}\,\overline{B}\,\overline{C}D + A\overline{B}CD$ ($m_3, m_7, m_2, m_6, m_1, m_{11}$):

| AB \ CD | 00 | 01 | 11 | 10 |
|---|---|---|---|---|
| **00** | 0 | 1 | 1 | 1 |
| **01** | 0 | 0 | 1 | 1 |
| **11** | 0 | 0 | 0 | 0 |
| **10** | 0 | 0 | 1 | 0 |

  $f_1 = \overline{A}C$ ($m_2, m_3, m_6, m_7$), $f_2 = \overline{A}\,\overline{B}D$ ($m_1, m_3$), $f_3 = \overline{B}CD$ ($m_3, m_{11}$). $F = \overline{A}C + \overline{A}\,\overline{B}D + \overline{B}CD$.
- **Dört köşe örneği:** $F = \overline{A}\,\overline{B}\,\overline{C}\,\overline{D} + \overline{A}\,\overline{B}C\overline{D} + A\overline{B}\,\overline{C}\,\overline{D} + A\overline{B}C\overline{D}$ ($m_0, m_2, m_8, m_{10}$). Dört köşe komşudur: $f_1 = \overline{B}\,\overline{C}\,\overline{D}$, $f_2 = \overline{B}C\overline{D}$ → $F = \overline{B}\,\overline{D}(\overline{C}+C) = \overline{B}\,\overline{D}$.

**Ödev tipi (defterdeki):** $F = \overline{A}\,\overline{B}C\overline{D} + \overline{A}BCD + \overline{A}BC\overline{D} + \overline{A}\,\overline{B}CD + A\overline{B}CD$. Harita: $m_2, m_7, m_6, m_3, m_{11}$. Gruplar: $\overline{A}C$ ($m_2, m_3, m_6, m_7$) ve $\overline{B}CD$ ($m_3, m_{11}$). **$F = \overline{A}C + \overline{B}CD$.** İstenenler: Boolean ile sadeleştir, Karnaugh ile doğrula, lojik devreyi çiz.

**xyz örneği:** $F = xyz + x\overline{y}z + x\overline{y}\,\overline{z}$ ($m_7, m_5, m_4$). $f_1 = xz$ ($m_5, m_7$), $f_2 = x\overline{y}$ ($m_4, m_5$). $F = xz + x\overline{y} = x(z + \overline{y})$. Devre: iki AND ve bir OR.

### Sık Yapılan Hata
- Sütunları ikilik sırayla (00, 01, 10, 11) yazmak. Doğrusu **Gray sırası**: 00, 01, 11, 10.
- Grubu 3'lü veya 5'li yapmak. Grup boyutu 1, 2, 4, 8 veya 16 olmalıdır.
- Kenar ve köşe komşuluğunu gözden kaçırmak (daha küçük grup, daha uzun ifade).

### Aktif Hatırlama Soruları
1. $F(A,B,C) = \sum(0,1,4,5)$ fonksiyonunu Karnaugh haritasıyla sadeleştiriniz.
2. $F(A,B,C) = \sum(2,5,6,7)$ fonksiyonunu Karnaugh haritasıyla sadeleştiriniz.
3. $F(A,B,C,D) = \sum(0,2,8,10)$ fonksiyonunu sadeleştiriniz.
4. $F(A,B,C,D) = \sum(2,3,6,7,11)$ fonksiyonunu sadeleştiriniz.
5. $F = A + \overline{A}B$ fonksiyonunu 2 girişli Karnaugh haritasıyla sadeleştiriniz.
6. Karnaugh haritasında 3 değişkenli sütunlar neden 00, 01, 11, 10 sırasındadır ve grup boyutları ne olabilir?

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. $m_0, m_1, m_4, m_5$ aynı $B=0$ sütunlarında; 4'lü grup. $F = \overline{B}$.
2. $m_2, m_6$ → $B\overline{C}$; $m_5, m_7$ → $AC$. $F = B\overline{C} + AC$.
3. Dört köşe $m_0, m_2, m_8, m_{10}$ komşudur. $F = \overline{B}\,\overline{D}$.
4. $m_2, m_3, m_6, m_7$ → $\overline{A}C$; $m_{11}$ ve $m_3$ → $\overline{B}CD$. $F = \overline{A}C + \overline{B}CD$.
5. Harita: $m_1, m_2, m_3$ birdir. Satır $A=1$ ($m_2, m_3$) → $A$; sütun $B=1$ ($m_1, m_3$) → $B$. $F = A + B$.
6. Gray sırasında komşu iki hücre **yalnız bir bit** farklıdır; bu yüzden komşu hücreler gruplanıp bir değişken elenebilir. Grup boyutları 1, 2, 4, 8, 16 (2'nin kuvveti) olabilir.
</details>

---

## Hafta 7 — Toplayıcı ve Çıkarıcı Devreler

### Öğrenme Hedefleri
1. Yarım ve tam toplayıcının doğruluk tablosunu, çıkış denklemlerini ve devresini bilmek.
2. Çok bitli toplamayı tam toplayıcıları zincirleyerek kurabilmek.
3. Yarım/tam çıkarıcıyı ve toplama-çıkarma devresini açıklayabilmek.

### Kavram Anlatımı

#### Lojik yarım toplayıcı (Half Adder, HA)
İki tek bitlik sayıyı toplar: $0+0=0$, $0+1=1$, $1+0=1$, $1+1=10$. Devrenin çıkışından aynı anda tek değer gösterilebileceği için sonuç **toplam ($T$)** ve **elde ($E$)** olarak ayrı gösterilir; bu tabloya toplayıcı doğruluk tablosu denir.

| a b | T | E |
|---|---|---|
| 0 0 | 0 | 0 |
| 0 1 | 1 | 0 |
| 1 0 | 1 | 0 |
| 1 1 | 0 | 1 |

$$T = m_1 + m_2 = \sum(1,2) = \overline{a}b + a\overline{b} = a \oplus b \qquad E = m_3 = ab$$

Devre: bir **XOR** (toplam) ve bir **AND** (elde).

#### Tam toplayıcı (Full Adder, FA)
1 bit yerine 3 bitlik toplama yapılır (a, b ve bir önceki basamaktan gelen giriş eldesi $E_g$). Defterdeki sıra: $E_g\ a\ b \to T\ E_c$.

| $E_g$ a b | T | $E_c$ |
|---|---|---|
| 0 0 0 | 0 | 0 |
| 0 0 1 | 1 | 0 |
| 0 1 0 | 1 | 0 |
| 0 1 1 | 0 | 1 |
| 1 0 0 | 1 | 0 |
| 1 0 1 | 0 | 1 |
| 1 1 0 | 0 | 1 |
| 1 1 1 | 1 | 1 |

$$T = m_1 + m_2 + m_4 + m_7 = E_g \oplus a \oplus b$$
$$E_c = m_3 + m_5 + m_6 + m_7 = ab + E_g(a \oplus b)$$

Türetme: $T = \overline{E_g}(\overline{a}b + a\overline{b}) + E_g(\overline{a}\,\overline{b} + ab) = \overline{E_g}(a\oplus b) + E_g\,\overline{(a\oplus b)} = E_g \oplus (a \oplus b)$ (XOR ve XNOR). Devre: iki XOR (toplam), iki AND ve bir OR (elde).

#### Çok bitli toplama
- **2 bit:** $A = a_1a_0$, $B = b_1b_0$. İki FA yan yana; ilk FA'nın $E_g = 0$, onun çıkış eldesi ikinci FA'nın giriş eldesi olur. Sonuç: $E_{c1}\,T_1\,T_0$.
- **4 bit:** $A = a_3a_2a_1a_0$, $B = b_3b_2b_1b_0$. Dört FA zincirlenir; en sağdaki $E_g = 0$; her FA'nın $E_c$ çıkışı soldaki FA'nın $E_g$ girişine bağlanır. Sonuç: $E_{c3}\,T_3\,T_2\,T_1\,T_0$.

#### Yarım çıkarıcı (Half Subtractor, HS)
$F$ = fark, $B$ = borç.

| a b | F | B |
|---|---|---|
| 0 0 | 0 | 0 |
| 0 1 | 1 | 1 |
| 1 0 | 1 | 0 |
| 1 1 | 0 | 0 |

$$F = m_1 + m_2 = \overline{a}b + a\overline{b} = a \oplus b \qquad B = m_1 = \overline{a}b$$

#### Tam çıkarıcı (Full Subtractor, FS)
Tam toplayıcılar yarım toplayıcılardan oluştuğu gibi tam çıkarıcı yarım çıkarıcılardan meydana gelir. Girişler $a$, $b$ ve borç girişi $B_g$.

| a b $B_g$ | F | B |
|---|---|---|
| 0 0 0 | 0 | 0 |
| 0 0 1 | 1 | 1 |
| 0 1 0 | 1 | 1 |
| 0 1 1 | 0 | 1 |
| 1 0 0 | 1 | 0 |
| 1 0 1 | 0 | 0 |
| 1 1 0 | 0 | 0 |
| 1 1 1 | 1 | 1 |

$$F = \sum(1,2,4,7) = a \oplus b \oplus B_g \qquad B = \sum(1,2,3,7) = B_g(a \odot b) + \overline{a}b$$

4 bitlik tam çıkarma da dört FS'nin zincirlenmesiyle yapılır (borç bir üst basamağa taşınır).

#### Toplama–çıkarma devresi
$A = 0010$, $B = 1010$ için toplam $1100$ ($2 + 10 = 12$). Devrede dört tam toplayıcı vardır; $B$'nin her biti, dışarıdan gelen bir kontrol hattı ($R_0$) ile birlikte bir XOR kapısından geçerek FA'ya girer. Kontrol hattı **0** iken $B$ aynen geçer (toplama); **1** iken $B$ terslenir ve kontrol hattı en sağdaki FA'nın giriş eldesine verilir (çıkarma, 2'ye tümleyen).

### Çözümlü Örnek
**4 bitlik toplama:** $A = 0010$, $B = 1010$.

| Basamak | a | b | giriş eldesi | T | çıkış eldesi |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 1 | 1 | 0 | 0 | 1 |
| 2 | 0 | 0 | 1 | 1 | 0 |
| 3 | 0 | 1 | 0 | 1 | 0 |

Sonuç $T_3T_2T_1T_0 = 1100$ ($2 + 10 = 12$).

### Sık Yapılan Hata
- Yarım toplayıcıyı çok bitli toplamada kullanmak. İlk basamak dışında giriş eldesi olduğu için **tam toplayıcı** gerekir.
- Çıkarıcıda borç denklemini $a\overline{b}$ yazmak. $a - b$ için borç $\overline{a}b$'dir.
- XOR ile XNOR'u karıştırmak ($E_c$ ifadesinde $(a \oplus b)$ kullanılır, $B$ ifadesinde $(a \odot b)$).

### Aktif Hatırlama Soruları
1. Yarım toplayıcının $T$ ve $E$ ifadelerini yazınız.
2. Tam toplayıcının $T$ ve $E_c$ ifadelerini yazınız.
3. $A = 0110$ ve $B = 0111$ sayılarını 4 bitlik tam toplayıcı zinciriyle toplayınız.
4. Yarım çıkarıcının $F$ ve $B$ (borç) ifadelerini yazınız.
5. Tam çıkarıcının $F$ ve $B$ ifadelerini yazınız.
6. 4 bitlik toplama için kaç tam toplayıcı gerekir ve ilk basamağın giriş eldesi nedir?

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. $T = a \oplus b$, $E = ab$.
2. $T = E_g \oplus a \oplus b$, $E_c = ab + E_g(a \oplus b)$.
3. Basamak 0: $0+1 = 1$, elde 0. Basamak 1: $1+1 = 0$, elde 1. Basamak 2: $1+1+1 = 1$, elde 1. Basamak 3: $0+0+1 = 1$, elde 0. Sonuç $1101$ ($6 + 7 = 13$).
4. $F = a \oplus b$, $B = \overline{a}b$.
5. $F = a \oplus b \oplus B_g$, $B = B_g(a \odot b) + \overline{a}b$.
6. 4 tam toplayıcı; en sağdaki (en düşük basamak) giriş eldesi $0$'dır.
</details>

---

## Hafta 8 — Çoğullayıcı (Multiplexer, MUX)

### Öğrenme Hedefleri
1. MUX'un tanımını, giriş-seçici-çıkış yapısını ve doğruluk tablosunu bilmek.
2. 2x1, 4x1 ve 8x1 MUX denklemlerini yazıp kapı devresini çizebilmek.
3. Büyük MUX'u küçük MUX'larla kurarken gereken adedi hesaplayabilmek.

### Kavram Anlatımı

#### Tanım
Birden fazla **veri girişinin** olduğu bir sistemin belirli bir girişi seçip çıkışa aktaran devre yapısıdır. MUX'a **anahtarlama** ya da **veri seçici** de denir. Seçilecek girişi **seçici (select) girişleri** belirler.

#### 2x1 MUX
Girişler $I_0, I_1$, seçici $S_0$, çıkış $Z$.

| $S_0$ | Z |
|---|---|
| 0 | $I_0$ |
| 1 | $I_1$ |

$$Z = \overline{S_0}\,I_0 + S_0\,I_1$$
Devre: $S_0$ bir NOT'tan geçip $I_0$ ile AND'e girer; $S_0$ doğrudan $I_1$ ile AND'e girer; iki AND çıkışı bir OR ile birleşir.

#### 4x1 MUX
Girişler $I_0 \ldots I_3$, seçiciler $S_1 S_0$.

| $S_1 S_0$ | Z |
|---|---|
| 0 0 | $I_0$ |
| 0 1 | $I_1$ |
| 1 0 | $I_2$ |
| 1 1 | $I_3$ |

$$Z = \overline{S_1}\,\overline{S_0}\,I_0 + \overline{S_1}S_0\,I_1 + S_1\overline{S_0}\,I_2 + S_1S_0\,I_3$$
Devre: 4 adet AND (her biri bir seçici kombinasyonu ve bir veri girişi), çıkışlar 4 girişli OR'da toplanır.

#### 8x1 MUX
Girişler $I_0 \ldots I_7$, seçiciler $S_2 S_1 S_0$ (3 seçici hattı, $2^3 = 8$).

| $S_2 S_1 S_0$ | Z |
|---|---|
| 0 0 0 | $I_0$ |
| 0 0 1 | $I_1$ |
| 0 1 0 | $I_2$ |
| 0 1 1 | $I_3$ |
| 1 0 0 | $I_4$ |
| 1 0 1 | $I_5$ |
| 1 1 0 | $I_6$ |
| 1 1 1 | $I_7$ |

$$Z = \sum_{k=0}^{7} m_k(S_2,S_1,S_0)\cdot I_k$$
Devre: 8 adet 4 girişli AND (3 seçici + 1 veri) ve çıkışta 8 girişli OR.

#### Büyük MUX'u küçük MUX'larla kurma
Kaç küçük MUX gerektiği, giriş sayısını MUX boyutuna bölerek **kademe kademe** bulunur; kesirli çıkan değer yukarı yuvarlanır.

- **4x1'i 2x1'lerle:** $4 / 2 = 2$ (ilk kademe), $2 / 2 = 1$ (ikinci kademe). Toplam $2 + 1 = 3$ adet 2x1 MUX. İlk kademedeki iki MUX $S_0$ ile, çıkışları birleştiren MUX $S_1$ ile sürülür.
- **8x1'i 4x1'lerle:** $8 / 4 = 2$, sonra $2 / 4 = 0{,}5$ → bir üste yuvarlanır (1). Toplam $2 + 1 = 3$ adet 4x1 MUX. Üçüncü MUX'un yalnız iki girişi kullanılır; boş girişler **toprağa (0) bağlanır** ve onun seçici girişi $S_2$ olur. İlk iki MUX $S_1 S_0$ ile sürülür.
- **8x1'i 2x1'lerle:** $8/2 = 4$, $4/2 = 2$, $2/2 = 1$. Toplam $4 + 2 + 1 = 7$ adet 2x1 MUX. (Birinci kademe $S_0$, ikinci kademe $S_1$, üçüncü kademe $S_2$ ile sürülür.)

### Sık Yapılan Hata
- Seçici sayısını $2^n$ ile karıştırmak. $n$ seçici hattı $2^n$ veri girişini seçer (8 giriş → 3 seçici).
- Seçici sırasını karıştırmak ($S_1 S_0 = 10$ → $I_2$).
- Kesirli MUX sayısını aşağı yuvarlamak (2,5 → 3 olmalı).

### Aktif Hatırlama Soruları
1. 2x1 MUX'un $Z$ denklemini yazınız.
2. 4x1 MUX'u 2x1 MUX'larla kurmak için kaç adet 2x1 MUX gerekir?
3. 8x1 MUX'u 4x1 MUX'larla kurmak için kaç adet 4x1 MUX gerekir ve boş girişler ne olur?
4. 8x1 MUX'u 2x1 MUX'larla kurmak için kaç adet MUX gerekir?
5. 8x1 MUX'ta kaç seçici girişi vardır?
6. 16x1 MUX'u 4x1 MUX'larla kurmak için kaç adet 4x1 MUX gerekir?

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. $Z = \overline{S_0}\,I_0 + S_0\,I_1$.
2. $4/2 = 2$, $2/2 = 1$ → toplam **3** adet.
3. $8/4 = 2$, $2/4 = 0{,}5 \to 1$ → toplam **3** adet. Üçüncü MUX'un kullanılmayan iki girişi toprağa (0) bağlanır; seçicisi $S_2$'dir.
4. $4 + 2 + 1 = $ **7** adet.
5. **3** seçici girişi ($S_2, S_1, S_0$), çünkü $2^3 = 8$.
6. $16/4 = 4$, $4/4 = 1$ → toplam $4 + 1 = $ **5** adet 4x1 MUX.
</details>

---

## Hafta 9 — MUX ile Boolean Fonksiyon Gerçekleme

### Öğrenme Hedefleri
1. Bir Boolean fonksiyonunu verilen seçici girişlerine göre MUX ile gerçekleyebilmek.
2. Veri girişlerine gelecek değerleri (0, 1, değişken veya tersi) belirleyebilmek.
3. Karnaugh haritası ve doğruluk tablosu yöntemlerini kullanabilmek.

### Kavram Anlatımı

#### Yöntem
1. Fonksiyonu verilen **seçici değişkenlere** göre $Z = \sum (\text{seçici minterm}) \cdot I_k$ biçiminde yaz.
2. Her seçici kombinasyonu için fonksiyonun geriye kalan değişkenlerine bak: sonuç sabit 0, sabit 1, bir değişken veya tersi olur; bu $I_k$ girişine bağlanır.
3. Gerekirse veri girişlerine NOT/OR/AND kapıları eklenir.

**Karnaugh yöntemi:** Seçici değişkenler haritanın satır/sütunlarını belirler; her seçici hücre grubunda kalan değişkenin değerine bakılır: iki hücre de 1 → $I = 1$; ikisi de 0 → $I = 0$; yalnız biri 1 → $I$ o değişken (veya tersi).

### Çözümlü Örnekler (defterden)

**1) $F = \overline{A}B + AB$** (= $B$)
- Seçici $A$ olan 2x1: $F = \overline{A}\,I_0 + A\,I_1$ → $I_0 = B$, $I_1 = B$.
- Seçiciler $A, B$ olan 4x1: $F = \overline{A}\,\overline{B}I_0 + \overline{A}B\,I_1 + A\overline{B}I_2 + AB\,I_3$ → $I_0 = 0,\ I_1 = 1,\ I_2 = 0,\ I_3 = 1$.

**2) $F = AB + \overline{A}\,\overline{B}$** (XNOR)
- 2x1, seçici $A$: $I_0 = \overline{B}$, $I_1 = B$ ($I_0$ girişine $B$ bir NOT'tan geçerek bağlanır).
- 4x1, seçiciler $A, B$: $I_0 = 1,\ I_1 = 0,\ I_2 = 0,\ I_3 = 1$.

**3) $F = \overline{A}\,\overline{B} + \overline{A}B\overline{C} + ABC$** (defterdeki 3 değişkenli örneğin düzenli hali)
- 2x1, seçici $A$: $A=0$ iken $F = \overline{B} + B\overline{C} = \overline{B} + \overline{C}$ → $I_0 = \overline{B} + \overline{C}$ (benzetme); $A=1$ iken $F = BC$ → $I_1 = BC$. Veri girişleri bir OR ve bir AND ile üretilir.
- 4x1, seçiciler $A, B$: $AB=00$ iken $F = 1$ → $I_0 = 1$; $AB=01$ iken $F = \overline{C}$ → $I_1 = \overline{C}$; $AB=10$ iken $F = 0$ → $I_2 = 0$; $AB=11$ iken $F = C$ → $I_3 = C$. Yani $I_0 = 1,\ I_1 = \overline{C},\ I_2 = 0,\ I_3 = C$.

**4) $F(A,B,C) = \sum(0,2,6,7)$** — Karnaugh yardımıyla:

| A \ BC | 00 | 01 | 11 | 10 |
|---|---|---|---|---|
| **0** | 1 | 0 | 0 | 1 |
| **1** | 0 | 0 | 1 | 1 |

- Seçici $A$, 2x1: $A=0$ satırında $m_0, m_2$ → $\overline{C}$ ($I_0 = \overline{C}$); $A=1$ satırında $m_6, m_7$ → $B$ ($I_1 = B$). $F = \overline{A}\,\overline{C} + AB$.
- Seçiciler $A, B$, 4x1: $AB=00$ ($m_0 = 1, m_1 = 0$) → $I_0 = \overline{C}$; $AB=01$ ($m_2 = 1, m_3 = 0$) → $I_1 = \overline{C}$; $AB=10$ ($m_4 = m_5 = 0$) → $I_2 = 0$; $AB=11$ ($m_6 = m_7 = 1$) → $I_3 = 1$.
- Defterde bu fonksiyon için seçicilerin $B, C$ olduğu bir 4x1 çözümü de var: sütunlara göre $I_0 = \overline{A}$ ($BC=00$), $I_1 = 0$ ($BC=01$), $I_2 = 1$ ($BC=10$), $I_3 = A$ ($BC=11$).

**5) $F(A,B,C) = \sum(1,3,6)$** (defterde verilen alıştırma; çözüm türetilmiştir): $A=0$ satırında $m_1, m_3$ → $C$; $A=1$ satırında yalnız $m_6$ → $B\overline{C}$.
- 2x1, seçici $A$: $I_0 = C$, $I_1 = B\overline{C}$.
- 4x1, seçiciler $A, B$: $I_0 = C$, $I_1 = C$, $I_2 = 0$, $I_3 = \overline{C}$.

**6) $F(A,B,C,D) = \sum(0,2,3,5,8,13,14,15)$** — 8x1 MUX, seçiciler $S_2 = A$, $S_1 = B$, $S_0 = C$, veri $D$'ye bağlı (sınav tipi, Hafta 11'de de var). Satırlar iki-ikili gruplanır:

| $ABC$ | Hücreler | $F$ değerleri ($D=0,1$) | $I_k$ |
|---|---|---|---|
| 000 | $m_0, m_1$ | 1, 0 | $\overline{D}$ |
| 001 | $m_2, m_3$ | 1, 1 | 1 |
| 010 | $m_4, m_5$ | 0, 1 | $D$ |
| 011 | $m_6, m_7$ | 0, 0 | 0 |
| 100 | $m_8, m_9$ | 1, 0 | $\overline{D}$ |
| 101 | $m_{10}, m_{11}$ | 0, 0 | 0 |
| 110 | $m_{12}, m_{13}$ | 0, 1 | $D$ |
| 111 | $m_{14}, m_{15}$ | 1, 1 | 1 |

$I_0 = \overline{D},\ I_1 = 1,\ I_2 = D,\ I_3 = 0,\ I_4 = \overline{D},\ I_5 = 0,\ I_6 = D,\ I_7 = 1$.

**7) $F(A,B,C,D) = \sum(1,7,8,9,13,15)$ için 8x1 MUX** (seçiciler $A, B, C$; aynı yöntemle türetilmiştir): $I_0 = D,\ I_1 = 0,\ I_2 = 0,\ I_3 = D,\ I_4 = 1,\ I_5 = 0,\ I_6 = D,\ I_7 = D$.

### Sık Yapılan Hata
- Seçici değişkenlerin sırasını ($S_2 S_1 S_0$ = $A B C$) karıştırmak.
- Veri girişine gelen $D$ ile $\overline{D}$'yi ters bağlamak (ilk hücre 1, ikinci hücre 0 ise $\overline{D}$).
- Hem seçici hem veri olarak aynı değişkeni kullanmak. Seçici olan değişken veri girişlerinde yer almaz.

### Aktif Hatırlama Soruları
1. $F = \overline{A}B + AB$ fonksiyonunu seçici girişi $A$ olan 2x1 MUX ile gerçekleyiniz; $I_0$ ve $I_1$ nedir?
2. $F = AB + \overline{A}\,\overline{B}$ fonksiyonunu seçicileri $A, B$ olan 4x1 MUX ile gerçekleyiniz.
3. $F(A,B,C) = \sum(0,2,6,7)$ fonksiyonunu seçici girişi $A$ olan 2x1 MUX ile gerçekleyiniz.
4. $F(A,B,C) = \sum(1,2,6,7)$ fonksiyonunu seçicileri $A, B$ olan 4x1 MUX ile gerçekleyiniz.
5. $F(A,B,C,D) = \sum(0,2,3,5,8,13,14,15)$ fonksiyonunu 8x1 MUX ile ($S_2=A$, $S_1=B$, $S_0=C$) gerçekleyiniz.
6. $F(A,B,C) = \sum(1,3,6)$ fonksiyonunu seçici girişi $A$ olan 2x1 MUX ile gerçekleyiniz.

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. $F = B$ olduğu için $I_0 = B$, $I_1 = B$.
2. $AB=00$ iken $F=1$, $01$ iken $0$, $10$ iken $0$, $11$ iken $1$. $I_0 = 1,\ I_1 = 0,\ I_2 = 0,\ I_3 = 1$.
3. $A=0$: $m_0, m_2$ → $\overline{C}$; $A=1$: $m_6, m_7$ → $B$. $I_0 = \overline{C}$, $I_1 = B$.
4. $AB=00$: ($m_0 = 0, m_1 = 1$) → $C$; $AB=01$: ($m_2 = 1, m_3 = 0$) → $\overline{C}$; $AB=10$: ($m_4 = m_5 = 0$) → $0$; $AB=11$: ($m_6 = m_7 = 1$) → $1$. $I_0 = C,\ I_1 = \overline{C},\ I_2 = 0,\ I_3 = 1$.
5. $I_0 = \overline{D},\ I_1 = 1,\ I_2 = D,\ I_3 = 0,\ I_4 = \overline{D},\ I_5 = 0,\ I_6 = D,\ I_7 = 1$.
6. $A=0$: $m_1, m_3$ → $C$ ($m_0 = m_2 = 0$); $A=1$: yalnız $m_6 = AB\overline{C}$ → $B\overline{C}$. $I_0 = C$, $I_1 = B\overline{C}$.
</details>

---

## Hafta 10 — Mandallar (Latch), JK Flip-Flop, Senkron ve Asenkron Devreler

### Öğrenme Hedefleri
1. Mandalın (latch) temel bellek hücresi olduğunu ve flip-flop'tan farkını açıklayabilmek.
2. R-S ve D tipi mandalın çalışmasını, doğruluk tablosunu ve zaman grafiğini çizebilmek.
3. JK flip-flop doğruluk tablosunu ve karakteristik denklemini yazabilmek.
4. Senkron ve asenkron devreyi clock sinyali ve domino etkisiyle anlatabilmek.

### Kavram Anlatımı

#### Mandal (LATCH)
- **Temel bellek hücresidir**; ikili (binary) bilgiyi depolayan mantık devresidir.
- Mantık kapılarından elde edilmiş bir devredir.
- **Clock girişi yoktur.**
- Son değerleri saklar.
- **R-S ve D** tipi bulunur.
- Girişlere uygulanan sinyale göre çıkışlar etkilenir.

> [!NOTE]
> **Notlar:** (1) Mandallar girişlere uygulanan sinyale göre çıkış değeri üretir; bu çıkış değerini saklarlar, bu nedenle bir bellek hücresi olarak düşünebiliriz. (2) Flip-flop'larla çok benzer yapıdadır. Flip-flopta clock girişi mecburen vardır, mandallarda bu giriş yoktur. Benzerlik: ikisi de iki ayrı kararlı durumda bulunabilir. Mandalda çıkışın kararlı kalması girişteki verinin **sürekliliğine** bağlıdır.

#### R-S mandalı
$S$ = set, $R$ = reset. Mandalda $S$ ve $R$ olmak üzere 2 giriş vardır; aynı anda **yalnız 1 giriş** aktif olmalıdır.

| S R | Q | Q' | Anlamı |
|---|---|---|---|
| 0 0 | Q | Q' | Önceki durum korunur |
| 0 1 | 0 | 1 | Mandal sıfırlanır (reset) |
| 1 0 | 1 | 0 | Mandal kurulur (set) |
| 1 1 | — | — | **YASAK** |

Devre iki biçimde kurulur: (I) iki **NOR** kapısı çapraz geri beslemeli; (II) iki **NAND** kapısı çapraz geri beslemeli (girişte NOT ile). Çıkışlar birbirini destekler (çapraz geri besleme).

- NOR tablosu: $00 \to 1$, $01 \to 0$, $10 \to 0$, $11 \to 0$ — girişlerde en az bir 1 olması çıkıştan 0 olmasını sağlar.
- NAND tablosu: $00 \to 1$, $01 \to 1$, $10 \to 1$, $11 \to 0$.
- Aynı anda yalnız bir giriş kuralı olduğu için $S$ ve $R$ aynı anda aktif kalamaz.
- Mandal bir önceki girişe ne çıkış verdiyse **onu saklamaya devam eder**.

**Örnek zaman sırası** (NOR mandal): $SR = 01 \to Q=0$; $SR = 00 \to Q=0$ (korunur); $SR = 10 \to Q=1$; $SR = 00 \to Q=1$ (korunur). Defterdeki not: $00$ durumunda mandalın gerçekten önceki durumu verip vermediğini bu sırayla gösteririz.

**R-S mandal grafiği:** $S$, $R$, $Q$ için üç sinyal çizilir. $S$ yükselince $Q$ yükselir; $S$ düşünce $Q$ yüksek kalır (saklama); $R$ yükselince $Q$ düşer; $R$ düşünce $Q$ düşük kalır.

#### D tipi mandal
$D$ = Data. **Tek girişlidir** ve **yasak durum yoktur**. Defterde R-S mandalından türetilir: $S = D$, $R = \overline{D}$ (girişlerden biri bir NOT ile terslenir).

| D | Q | Q' |
|---|---|---|
| 0 | 0 | 1 |
| 1 | 1 | 0 |

**D tipi mandal grafiği:** $Q$, $D$'yi izler (mandal açıkken $Q = D$).

#### JK flip-flop
Mevcut durum $Q(t)$, girişler $J, K$; istenen bir sonraki durum $Q(t+1)$.

| J | K | Q(t) | Q(t+1) | Açıklama |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | Değişmez ($Q(t)$) |
| 0 | 0 | 1 | 1 | Değişmez ($Q(t)$) |
| 0 | 1 | 0 | 0 | **Reset** ($J=0$, $K=1$) |
| 0 | 1 | 1 | 0 | **Reset** |
| 1 | 0 | 0 | 1 | **Set** ($J=1$, $K=0$) |
| 1 | 0 | 1 | 1 | **Set** |
| 1 | 1 | 0 | 1 | **Toggle** (değilini yazar) |
| 1 | 1 | 1 | 0 | **Toggle** |

Özet: $00 \to Q(t)$, $01 \to 0$, $10 \to 1$, $11 \to \overline{Q(t)}$. Karakteristik denklem:
$$Q(t+1) = J\,\overline{Q(t)} + \overline{K}\,Q(t)$$

#### Senkron ve asenkron devreler
**Senkron devre:** Tasarım devrelerinin hepsi **komut (clock) bekler**. Clock sinyali tüm devre elemanlarına **paralel (ortak hat)** bağlanır; komut geldiğinde bütün devre aynı nanosaniyede durum değiştirir. Analoji: **askeri disiplin / kürek takımı** — herkes aynı anda adım atar. Avantaj: yüksek hız ve güvenilirlik; modern bilgisayarlar (CPU) bu prensiple çalışır.

**Asenkron devre:** Taşlar **kendi hızında birbirini tetikleyebilir**. Olaylar zincirleme gelişir: clock sinyali yalnız ilk elemana gider, birinci eleman ikinciyi, ikinci üçüncüyü tetikler. Analoji: **domino etkisi** — ilk taş düşer, diğerleri sırayla düşer. Dezavantaj: **yayılım gecikmesi (propagation delay)** — sinyal son çıkışa ulaşana kadar vakit kaybedilir; yavaştır ve hata (glitch) yapabilir.

| Özellik | Asenkron (Domino) | Senkron (Askerî birlik) |
|---|---|---|
| Clock bağlantısı | Seri (zincirleme) | Paralel (ortak hat) |
| Hız | Yavaş (gecikme birikir) | Çok hızlı |
| Karmaşıklık | Basit, az malzeme | Karmaşık, ekstra lojik / kapı ister |
| Güvenilirlik | Hata yapabilir (glitch) | Hatasız (glitch-free) |
| Analoji | Domino taşları | Kürek takımı / askerler |

### Sık Yapılan Hata
- Mandal ile flip-flop'u karıştırmak: mandalda clock girişi yoktur, flip-flopta vardır.
- R-S mandalında $S = R = 1$ girişini yasak olarak belirtmeyi unutmak.
- JK'da $J = K = 1$ durumunu "değişmez" sanmak; çıkış **toggle** yapar ($\overline{Q(t)}$).
- Senkron/asenkron cevabında yalnız "clock var/yok" demek; clock'un **paralel** ve **seri** dağıtımı ile domino etkisini açıklamak gerekir.

### Aktif Hatırlama Soruları
1. Mandalın (latch) temel özelliklerini ve flip-flop'tan farkını yazınız.
2. R-S mandalının doğruluk tablosunu (S R → Q Q') yazınız ve yasak durumu belirtiniz.
3. $SR$ girişleri sırasıyla $01, 00, 10, 00$ uygulanırsa NOR tipi R-S mandalının $Q$ çıkışı nasıl değişir?
4. D tipi mandalın doğruluk tablosunu yazınız ve R-S mandalıyla ilişkisini söyleyiniz.
5. JK flip-flopun doğruluk tablosunu özetleyiniz ve $Q(t+1)$ denklemini yazınız.
6. Senkron ve asenkron farkını clock sinyali ve domino etkisiyle açıklayınız.

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. Mandal temel bellek hücresidir; ikili bilgiyi saklar; mantık kapılarından oluşur; **clock girişi yoktur**; son değerleri saklar; R-S ve D tipi vardır. Flip-flopta clock girişi mecburen vardır; ikisinin ortak yanı iki kararlı durumda bulunabilmeleridir.
2. $00 \to Q\ Q'$ (önceki durum), $01 \to 0\ 1$ (reset), $10 \to 1\ 0$ (set), $11 \to$ **yasak**.
3. $01 \to Q=0$; $00 \to Q=0$ (korunur); $10 \to Q=1$; $00 \to Q=1$ (korunur). Yani $Q$: $0, 0, 1, 1$.
4. $D=0 \to Q=0,\ Q'=1$; $D=1 \to Q=1,\ Q'=0$. $S = D$ ve $R = \overline{D}$ bağlanarak R-S mandalından elde edilir; tek girişli olduğu için yasak durum yoktur.
5. $00 \to Q(t)$ (değişmez), $01 \to 0$ (reset), $10 \to 1$ (set), $11 \to \overline{Q(t)}$ (toggle). $Q(t+1) = J\overline{Q(t)} + \overline{K}Q(t)$.
6. **Senkron:** tüm devre clock'a paralel bağlıdır, herkes aynı anda adım atar (askerî disiplin); hızlı ve hatasızdır, tasarımı karmaşıktır. **Asenkron:** clock yalnız ilk elemana gider, elemanlar birbirini sırayla tetikler (domino etkisi); basittir ama yayılım gecikmesi yüzünden yavaştır ve hata yapabilir.
</details>

---

## Hafta 11 — Sınav Tipi Soru Provası

Bu bölüm, defterin son sayfalarındaki "1. soru … 6. soru" çözümlerini sınav tipi olarak toplar. Önce soruyu kâğıtta kendin çöz, sonra cevap anahtarına bak.

### Öğrenme Hedefleri
1. Kesirli onluk sayıyı ikilik ve onaltılığa çevirebilmek.
2. Karnaugh ile minterm listesini sadeleştirebilmek.
3. Boolean fonksiyonu MUX ile gerçekleyebilmek (4x1 ve 8x1).
4. JK flip-flop tablosunu ve senkron/asenkron farkını sınav cevabı olarak yazabilmek.

### Soru Tipleri ve Çözüm Şablonları

**Soru 1 — Taban dönüşümü:** $25{,}625$ sayısını önce ikiliğe sonra onaltılığa çevir (ayrıca "ondalık yokmuş gibi" $25625$'i çevirme yöntemi).

**Soru 2 — Karnaugh:** $F(A,B,C,D) = \sum m(1,2,6,7)$; doğruluk tablosunu yaz, haritayı çiz, sadeleştir.

**Soru 3 — MUX (4x1):** $F(A,B,C) = \sum m(1,2,6,7)$ fonksiyonunu seçicileri $S_1 = A$, $S_0 = B$ olan 4x1 MUX ile gerçekle.

**Soru 4 — JK flip-flop:** Doğruluk tablosu ve $Q(t+1)$ denklemi.

**Soru 5 — Senkron / asenkron:** Clock sinyali ve domino etkisiyle farkı açıkla.

**Soru 6 — MUX (8x1):** $F(A,B,C,D) = \sum m(0,2,3,5,8,13,14,15)$ fonksiyonunu 8x1 MUX ile gerçekle ($S_2 = A$, $S_1 = B$, $S_0 = C$).

### Aktif Hatırlama Soruları
1. $(25{,}625)_{10}$ sayısını önce ikilik, sonra onaltılık tabana çeviriniz. Ayrıca $25625$ sayısının onaltılık karşılığını yazınız.
2. $F(A,B,C,D) = \sum m(1,2,6,7)$ fonksiyonunu doğruluk tablosu ve Karnaugh haritasıyla sadeleştiriniz.
3. $F(A,B,C) = \sum m(1,2,6,7)$ fonksiyonunu seçicileri $S_1 = A$, $S_0 = B$ olan 4x1 MUX ile gerçekleyiniz.
4. JK flip-flop için $Q(t) \to Q(t+1)$ doğruluk tablosunu yazınız ve her durumun adını belirtiniz.
5. Senkron ve asenkron devre farkını clock sinyali ve domino etkisiyle açıklayınız.
6. $F(A,B,C,D) = \sum m(0,2,3,5,8,13,14,15)$ fonksiyonunu 8x1 MUX ile gerçekleyiniz ($S_2 = A$, $S_1 = B$, $S_0 = C$).

<details>
<summary>Cevap Anahtarı ve Çözüm Adımları</summary>

1. **Tam kısım:** $25 \to 12\ (r1) \to 6\ (r0) \to 3\ (r0) \to 1\ (r1) \to 0\ (r1)$; sondan başa $(11001)_2$. **Kesir:** $0{,}625 \times 2 = 1{,}25\ (1)$, $0{,}25 \times 2 = 0{,}5\ (0)$, $0{,}5 \times 2 = 1{,}0\ (1)$; $(0{,}101)_2$. Birleşik: $(25{,}625)_{10} = (11001{,}101)_2$. **Onaltılık:** tam kısım sağdan 4'erli $0001\ 1001 \to 1,\ 9$; kesir soldan 4'erli, eksik gruba sağdan 0 eklenir: $1010 \to A$. Cevap: $(19{,}A)_{16}$. **Ondalık yokmuş gibi ($25625$):** 2'ye böle böle $(110010000011001)_2$; sağdan 4'erli $0110\ 0100\ 0001\ 1001 \to 6,\ 4,\ 1,\ 9$. Cevap: $(6419)_{16}$.
2. Doğruluk tablosunda $F=1$ olan satırlar $1, 2, 6, 7$ (diğerleri $0$). Haritada: $m_6, m_7$ ($A=0,B=1,C=1$) → $\overline{A}BC$; $m_2, m_6$ ($A=0, C=1, D=0$) → $\overline{A}C\overline{D}$; $m_1$ tek başına → $\overline{A}\,\overline{B}\,\overline{C}D$. **$F = \overline{A}\,\overline{B}\,\overline{C}D + \overline{A}C\overline{D} + \overline{A}BC$.** Defterdeki çözümde $m_6, m_7$ ikilisi alınıp $m_1$ ve $m_2$ tekil bırakılmıştır: $F = \overline{A}\,\overline{B}\,\overline{C}D + \overline{A}\,\overline{B}C\overline{D} + \overline{A}BC$. Bu da doğrudur ama $m_2$ ile $m_6$ komşu olduğu için yukarıdaki gruplama daha sadedir.
3. $AB=00$: ($m_0 = 0, m_1 = 1$) → $I_0 = C$; $AB=01$: ($m_2 = 1, m_3 = 0$) → $I_1 = \overline{C}$; $AB=10$: ($m_4 = m_5 = 0$) → $I_2 = 0$; $AB=11$: ($m_6 = m_7 = 1$) → $I_3 = 1$. Defterdeki cevapla aynı: $C,\ \overline{C},\ 0,\ 1$.
4. $00 \to Q(t)$ (değişmez); $01 \to 0$ (Reset); $10 \to 1$ (Set); $11 \to \overline{Q(t)}$ (Toggle: değilini yazar). Tablo satırları: $J=0,K=0$: $0\to0$, $1\to1$; $J=0,K=1$: $0\to0$, $1\to0$; $J=1,K=0$: $0\to1$, $1\to1$; $J=1,K=1$: $0\to1$, $1\to0$. $Q(t+1) = J\overline{Q(t)} + \overline{K}Q(t)$.
5. **Senkron:** clock tüm elemanlara paralel gider; tasarımdaki tüm devreler komut bekler ve aynı anda durum değiştirir (askerî disiplin); hızlı, glitch'siz, karmaşık. **Asenkron:** clock ilk elemana gider; her eleman bir sonrakini tetikler (domino etkisi); basit ama yayılım gecikmesi birikir, yavaştır, hata (glitch) yapabilir.
6. Her $(ABC)$ kombinasyonunda iki satıra ($D=0,1$) bakılır: $I_0 = \overline{D}$, $I_1 = 1$, $I_2 = D$, $I_3 = 0$, $I_4 = \overline{D}$, $I_5 = 0$, $I_6 = D$, $I_7 = 1$. Seçiciler $A, B, C$ MUX'un $S_2, S_1, S_0$ girişlerine bağlanır.
</details>

### Çalışma kapanışı
1. Her haftanın aktif hatırlama sorularını cevap anahtarına bakmadan, kâğıt-kalemle çöz.
2. Eksik kalan konuyu o haftanın "Çözümlü Örnekler" bölümüne dönüp kâğıtta yeniden çöz.
3. Sınavdan önce minterm/maxterm tablosunu (Hafta 5), Boolean teoremlerini (Hafta 4) ve MUX denklemlerini (Hafta 8) kâğıda ezbersiz yazabildiğinden emin ol.
