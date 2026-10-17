## Hafta 1: Görüntü Okuma, Griye Çevirme ve Kaydetme

### Somut Amaç
Çok kanallı renkli bir test görüntüsünü diskten okumak, OpenCV ve NumPy dizi (`ndarray`) bellek yapısını incelemek, BGR renk uzayından tek kanallı 8-bit gri tonlamaya dönüştürüp diske kaydetmek.

### Gerçek Girdi Görüntüsü
Girdi panosu, renk kanallarını test etmek amacıyla mavi, yeşil, kırmızı daireler, sarı dikdörtgen ve referans ızgara çizgileri içeren 400x300 boyutunda 3 kanallı (BGR) sentetik kalibrasyon görüntüsüdür.

![Hafta 1 Girdi Görüntüsü](/study-guide-images/eblg351/hafta01_input.png)

### Python Kurulum ve Çalıştırma Adımları
Gerekli kütüphaneleri kurmak için terminalden pip komutunu çalıştırın:

```bash
python -m pip install opencv-python numpy
```

Bu haftanın kodunu proje kökünde `hafta01.py` adıyla kaydedin. `public/study-guide-images/eblg351` klasörünün proje kökünde bulunduğundan emin olun ve betiği şu komutla çalıştırın:

```bash
python hafta01.py
```

Diğer haftalarda da ilgili kodları `hafta02.py` ... `hafta16.py` adıyla kaydedip `python haftaNN.py` komutuyla doğrudan proje kökünden çalıştırabilirsiniz.

### Python Kod Örneği
```python
import sys
import cv2

# 1. Görüntüyü 3 kanallı renkli (BGR) modda oku
input_path = "public/study-guide-images/eblg351/hafta01_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_COLOR)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

yukseklik, genislik, kanal = input_img.shape
print(f"Genişlik: {genislik} px, Yükseklik: {yukseklik} px, Kanal: {kanal}")

# 2. Renk dönüşümü: BGR -> Tek kanallı Gri Tonlama
output_img = cv2.cvtColor(input_img, cv2.COLOR_BGR2GRAY)

# 3. Sonucu diske yaz
output_path = "public/study-guide-images/eblg351/hafta01_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.imread(dosya_yolu, cv2.IMREAD_COLOR)`: Dosyayı BGR formatında 8-bit 3 kanal NumPy dizisi olarak yükler.
- `cv2.cvtColor(input_img, cv2.COLOR_BGR2GRAY)`: 3 kanallı BGR piksellerini algısal ağırlıklarla tek kanallı gri tonlamaya çevirir.
- `cv2.imwrite(hedef_yol, output_img)`: NumPy dizisini PNG formatında diske kaydeder.

### Gerçek Çıktı Görüntüsü
Mavi, yeşil ve kırmızı renkli bölgelerin parlaklık eşdeğerlerine dönüştüğü, tek kanallı 400x300 boyutundaki gri tonlama görüntüsüdür.

![Hafta 1 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta01_output.png)

### Gözle Farkı
Renkli bantlar ve daireler renk bilgilerini kaybederek algısal yansıma parlaklıklarına göre gri tonlarına dönüşmüştür. Dosya veri boyutu 3 kanaldan tek kanala inmiştir.

### Küçük Parametre Denemesi
`cv2.IMREAD_GRAYSCALE` bayrağı doğrudan `cv2.imread` içinde kullanıldığında renk dönüşümü adımına gerek kalmadan dosya doğrudan tek kanal olarak okunabilir: `cv2.imread(yol, cv2.IMREAD_GRAYSCALE)`.

---

## Hafta 2: Temel Görüntü İşlemleri, Piksel Erişimi ve ROI

### Somut Amaç
Görüntü matrisi üzerinde belirli bir ilgi alanını (ROI - Region of Interest) sınırlandırmak, kırpmak ve doğrusal enterpolasyonla (`cv2.INTER_LINEAR`) hedef çözünürlüğe yeniden boyutlandırmak.

### Gerçek Girdi Görüntüsü
Merkezinde hedef dairesi, haç işaretçisi ve köşe geometrik referansları barındıran 400x300 boyutundaki test sahnesidir.

![Hafta 2 Girdi Görüntüsü](/study-guide-images/eblg351/hafta02_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta02_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_COLOR)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Merkezdeki hedef bölgesini ROI olarak dilimle [y: 60-220, x: 120-280]
roi = input_img[60:220, 120:280].copy()

# 2. Kırpılan bölgeyi 400x300 tam ekran çözünürlüğüne büyüt
output_img = cv2.resize(roi, (400, 300), interpolation=cv2.INTER_LINEAR)

output_path = "public/study-guide-images/eblg351/hafta02_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `input_img[y1:y2, x1:x2].copy()`: NumPy dizi dilimleme ile hedef ilgi bölgesini bağımsız bir dizi olarak ayırır.
- `cv2.resize(src, dsize, interpolation=cv2.INTER_LINEAR)`: Görüntüyü yeni piksel boyutuna ölçekler. `cv2.INTER_LINEAR` çift doğrusal enterpolasyon uygulayarak yumuşak geçiş sağlar.

### Gerçek Çıktı Görüntüsü
Merkezdeki hedef sembolünün ve "TARGET ROI" yazısının 400x300 boyutuna büyütülmüş detay görüntüsüdür.

![Hafta 2 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta02_output.png)

### Gözle Farkı
Çevreleyen gereksiz arka plan elenmiş; yalnızca odaklanılan hedef nesnesi yakınlaştırılarak tüm çerçeveyi kaplayacak hale getirilmiştir.

### Küçük Parametre Denemesi
`cv2.INTER_NEAREST` kullanıldığında pikseller basamaklı (piksel piksel) görünür; `cv2.INTER_CUBIC` veya `cv2.INTER_LANCZOS4` kullanıldığında ise daha keskin kenar enterpolasyonu elde edilir.

---

## Hafta 3: Parlaklık, Kontrast ve Histogram Eşitleme

### Somut Amaç
Düşük kontrastlı, koyu ve dinamik aralığı dar bir gri tonlama görüntüsünün histogramını `cv2.equalizeHist` API çağrısıyla tüm [0, 255] aralığına yayarak gizli detayları belirginleştirmek.

### Gerçek Girdi Görüntüsü
Piksel parlaklıkları 25 ile 110 arasında sıkışmış, gölgeli ve karanlık detaylar barındıran 400x300 gri tonlama test görüntüsüdür.

![Hafta 3 Girdi Görüntüsü](/study-guide-images/eblg351/hafta03_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta03_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# Kümülatif histogram eşitleme uygula
output_img = cv2.equalizeHist(input_img)

output_path = "public/study-guide-images/eblg351/hafta03_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.equalizeHist(src)`: Tek kanallı 8-bit gri görüntünün parlaklık dağılımını kümülatif olasılık fonksiyonu üzerinden düzleştirir; koyu alanları açar ve kontrastı maksimize eder.

### Gerçek Çıktı Görüntüsü
Histogram eşitleme sonrası dinamik aralığı [0, 255] aralığına açılmış, gizli metinlerin ve şekillerin net biçimde görünür olduğu görüntüdür.

![Hafta 3 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta03_output.png)

### Gözle Farkı
Girdide neredeyse görünmez olan "HIDDEN DETAIL" yazısı ve daire konturları net bir şekilde okunabilir seviyeye gelmiştir.

### Küçük Parametre Denemesi
Aşırı parlama ve gürültü artışını önlemek için yerel adaptif kontrast sınırlamalı histogram eşitleme `cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))` nesnesiyle uygulanabilir.

---

## Hafta 4: Uzamsal Filtreleme, Yumuşatma ve Kenar Tespiti

### Somut Amaç
Gürültülü bir görüntüdeki yüksek frekanslı parazitleri `cv2.GaussianBlur` çekirdeği ile bastırmak ve ardından `cv2.Sobel` gradyan operatörü ile nesne sınırlarını çıkarmak.

### Gerçek Girdi Görüntüsü
Geometrik şekiller üzerine eklenmiş Gauss gürültüsü içeren 400x300 boyutundaki gri tonlama görüntüsüdür.

![Hafta 4 Girdi Görüntüsü](/study-guide-images/eblg351/hafta04_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta04_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Gauss filtresi ile parazitleri yumuşat (Çekirdek: 5x5, Sigma: 1.5)
blurred = cv2.GaussianBlur(input_img, (5, 5), 1.5)

# 2. Yatay ve dikey Sobel gradyanlarını hesapla
grad_x = cv2.Sobel(blurred, cv2.CV_32F, 1, 0, ksize=3)
grad_y = cv2.Sobel(blurred, cv2.CV_32F, 0, 1, ksize=3)

# 3. Gradyan genliğini hesapla ve 8-bit aralığına normalize et
mag = cv2.magnitude(grad_x, grad_y)
output_img = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)

output_path = "public/study-guide-images/eblg351/hafta04_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.GaussianBlur(src, ksize, sigmaX)`: Belirtilen çekirdek boyutu (5x5) ve standart sapma ile pikselleri ağırlıklı ortalamayla yumuşatır.
- `cv2.Sobel(src, ddepth, dx, dy, ksize)`: Belirtilen yönde (1,0 yatay; 0,1 dikey) birinci türev gradyanını çıkarır.
- `cv2.magnitude(x, y)`: Kartezyen gradyan bileşenlerinden bileşke kenar kuvvetini üretir.
- `cv2.normalize(src, dst, alpha, beta, norm_type, dtype)`: Değer aralığını görselleştirilebilir [0, 255] 8-bit aralığına dönüştürür.

### Gerçek Çıktı Görüntüsü
Gürültünün bastırıldığı, dikdörtgen, daire ve çizgi sınırlarının beyaz hatlar halinde parladığı kenar haritasıdır.

![Hafta 4 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta04_output.png)

### Gözle Farkı
Homojen alanlardaki rastgele kumlanma yok edilmiş, sadece geometrik nesnelerin gerçek sınır çizgileri filtrelenerek korunmuştur.

### Küçük Parametre Denemesi
Çekirdek boyutu `(3, 3)` yapıldığında daha ince kenarlar çıkar; `(9, 9)` yapıldığında ise kenarlar kalınlaşır ve küçük detaylar kaybolur.

---

## Hafta 5: DFT ve FFT Spektrum Analizi API Uygulaması

### Somut Amaç
2D Ayrık Fourier Dönüşümü (`cv2.dft`) API çağrısı ile uzamsal görüntü verisini frekans domenine aktarmak, logaritmik genlik spektrumunu hesaplamak ve merkezlenmiş spektrumu görselleştirmek.

### Gerçek Girdi Görüntüsü
Yatay ve dikey periyodik çizgiler ile merkezde dolu bir elips içeren 400x300 boyutundaki test desenidir.

![Hafta 5 Girdi Görüntüsü](/study-guide-images/eblg351/hafta05_input.png)

### Python Kod Örneği
```python
import sys
import numpy as np
import cv2

input_path = "public/study-guide-images/eblg351/hafta05_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Görüntüyü float32 türüne dönüştür ve 2 kanallı DFT uygula
f_img = np.float32(input_img)
dft = cv2.dft(f_img, flags=cv2.DFT_COMPLEX_OUTPUT)

# 2. Düşük frekansları merkeze kaydır (DC bileşeni merkezde)
dft_shift = np.fft.fftshift(dft)

# 3. Reel ve imajiner kanallardan genliği hesapla
mag = cv2.magnitude(dft_shift[:, :, 0], dft_shift[:, :, 1])

# 4. Dinamik aralığı sıkıştırmak için logaritmik ölçekleme uygula
spec = cv2.log(mag + 1.0)

# 5. [0, 255] aralığına normalize ederek 8-bit çıktı oluştur
output_img = cv2.normalize(spec, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)

output_path = "public/study-guide-images/eblg351/hafta05_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.dft(src, flags=cv2.DFT_COMPLEX_OUTPUT)`: Hızlı Fourier dönüşümü algoritmasıyla uzamsal pikselleri frekans katsayılarına dönüştürür.
- `np.fft.fftshift(dft)`: Frekans uzayında dört köşede bulunan sıfır frekansını (DC) görüntünün tam merkezine taşır.
- `cv2.magnitude(x, y)`: Karmaşık frekans bileşenlerinin mutlak genliğini hesaplar.
- `cv2.log(mag + 1.0)`: Dinamik aralığı çok geniş olan Fourier genliklerini görselleştirilebilir seviyeye sıkıştırır.

### Gerçek Çıktı Görüntüsü
Merkezde parlayan parlak DC noktası ve uzamsal çizgilerin periyoduna dik açıyla yayılan parlak frekans tepe noktalarıdır.

![Hafta 5 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta05_output.png)

### Gözle Farkı
Girdi görüntüsündeki uzamsal konumlar yerine, desenin yönelimi ve frekans sıklığı merkezden dışa doğru yayılan simetrik ışınlar olarak belirmiştir.

### Küçük Parametre Denemesi
`cv2.log` adımı uygulanmadığında en büyük DC katsayısı tüm görüntüyü domine eder ve merkez dışındaki tüm yüksek frekans katsayıları tamamen siyah kalır.

---

## Hafta 6: Frekans Domeni Filtreleme API Uygulaması

### Somut Amaç
Frekans domeninde 2D Gaussian Alçak Geçiren Filtre (Low-Pass Filter) maskesi oluşturup DFT spektrumu ile çarpmak ve ters DFT (`cv2.idft`) ile uzamsal domene dönerek yüksek frekanslı dalgalanmaları filtrelemek.

### Gerçek Girdi Görüntüsü
Temel geometrik şekiller üzerine yüksek frekanslı sinüzoidal dalgalı ızgara paraziti bindirilmiş 400x300 boyutundaki test görüntüsüdür.

![Hafta 6 Girdi Görüntüsü](/study-guide-images/eblg351/hafta06_input.png)

### Python Kod Örneği
```python
import sys
import numpy as np
import cv2

input_path = "public/study-guide-images/eblg351/hafta06_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. İki kanallı karmaşık matris kur ve DFT al
float_img = np.float32(input_img)
complex_i = cv2.merge([float_img, np.zeros_like(float_img)])
dft = cv2.dft(complex_i)

# Kuadrant kaydırma fonksiyonu
def fft_shift(mat):
    cx = mat.shape[1] // 2
    cy = mat.shape[0] // 2
    out = np.zeros_like(mat)
    out[0:cy, 0:cx] = mat[cy:, cx:]
    out[cy:, cx:] = mat[0:cy, 0:cx]
    out[0:cy, cx:] = mat[cy:, 0:cx]
    out[cy:, 0:cx] = mat[0:cy, cx:]
    return out

shifted = fft_shift(dft)

# 2. Gaussian Alçak Geçiren Filtre maskesi oluştur (D0 = 15.0)
h, w = input_img.shape[:2]
cx, cy = w / 2.0, h / 2.0
d0 = 15.0
y_idx, x_idx = np.indices((h, w))
dist_sq = (x_idx - cx)**2 + (y_idx - cy)**2
mask = np.exp(-dist_sq / (2.0 * d0 * d0)).astype(np.float32)

complex_mask = cv2.merge([mask, np.zeros_like(mask)])

# 3. Frekansta spektral çarpma uygula
filtered = cv2.mulSpectrums(shifted, complex_mask, 0)

# 4. Ters kaydırma ve ters DFT ile uzamsal domene dön
ishift = fft_shift(filtered)
img_back = cv2.idft(ishift, flags=cv2.DFT_SCALE | cv2.DFT_REAL_OUTPUT)
output_img = np.clip(img_back, 0, 255).astype(np.uint8)

output_path = "public/study-guide-images/eblg351/hafta06_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.mulSpectrums(A, B, 0)`: İki spektrum matrisini eleman bazında çarparak frekans filtrelemesi uygular.
- `cv2.idft(..., flags=cv2.DFT_SCALE | cv2.DFT_REAL_OUTPUT)`: Frekans bileşenlerini ölçekleyerek uzamsal alana geri taşır ve yalnızca reel çıktıyı döner.
- Kesim yarıçapı parametresi (`d0 = 15.0`): Hangi frekans eşiğinin altındaki bileşenlerin geçeceğini belirler.

### Gerçek Çıktı Görüntüsü
Dalgalı parazit çizgilerinin belirgin biçimde azaldığı, şekillerin ve kenarlarının yumuşadığı çıktıdır.

![Hafta 6 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta06_output.png)

### Gözle Farkı
Girdideki sık dalgalı çizgiler belirgin biçimde bastırılmış; şekillerin kenarları da yumuşamıştır.

### Küçük Parametre Denemesi
`d0` değerini 8'e düşürerek kenarların daha çok yumuşadığını, 45'e çıkararak parazit çizgilerinin görünür kaldığını karşılaştırabilirsiniz.

---

## Hafta 7: Görüntü Onarımı, Gürültü Temizleme ve Inpainting

### Somut Amaç
Çizilmiş veya deforme olmuş bir görüntüdeki hasar maskesini çıkarıp `cv2.inpaint` (Telea algoritması) ile çevre dokulardan faydalanarak pürüzsüzce onarmak.

### Gerçek Girdi Görüntüsü
Üzerinde kalın beyaz çizikler, lekeler ve hasarlı pikseller bulunan 400x300 boyutundaki renkli test görüntüsüdür.

![Hafta 7 Girdi Görüntüsü](/study-guide-images/eblg351/hafta07_input.png)

### Python Kod Örneği
```python
import sys
import numpy as np
import cv2

input_path = "public/study-guide-images/eblg351/hafta07_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_COLOR)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Beyaz çizik piksellerini [250, 250, 250] - [255, 255, 255] aralığında maskele
lower_white = np.array([250, 250, 250], dtype=np.uint8)
upper_white = np.array([255, 255, 255], dtype=np.uint8)
mask = cv2.inRange(input_img, lower_white, upper_white)

# 2. Telea algoritması ile çizikleri çevre piksellerden onar (Yarıçap: 3)
output_img = cv2.inpaint(input_img, mask, 3, cv2.INPAINT_TELEA)

output_path = "public/study-guide-images/eblg351/hafta07_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.inRange(src, alt_sinir, ust_sinir)`: Hasarlı bölgenin renk aralığını ikili bir maskeye (beyaz pikseller) çevirir.
- `cv2.inpaint(src, inpaintMask, inpaintRadius, flags)`: Hızlı yürüyen yöntem (Fast Marching Method - `cv2.INPAINT_TELEA`) ile maskelenen pikselleri çevre komşuluk dokusunun gradyanına göre doldurur.

### Gerçek Çıktı Görüntüsü
Beyaz çiziklerin ve parazit lekelerinin tamamen doldurulduğu, altındaki orijinal renk geçişlerinin korunduğu onarılmış görüntüdür.

![Hafta 7 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta07_output.png)

### Gözle Farkı
Resmin ortasından geçen beyaz çizgi ve lekeler silinmiş; daire ve dikdörtgen bölgelerin renk bütünlüğü yeniden sağlanmıştır.

### Küçük Parametre Denemesi
`cv2.INPAINT_NS` (Navier-Stokes akışkan mekaniği algoritması) bayrağı kullanıldığında daha geniş hasarlı doku geçişlerinde yumuşak gradyanlar elde edilir.

---

## Hafta 8: Uygulamalı Tekrar ve Bütünleşik Görüntü Boru Hattı

### Somut Amaç
Çok aşamalı bir görüntü işleme boru hattı kurarak: gürültülü ve düşük kontrastlı bir görüntüde kenar koruyucu ikili filtreleme (`cv2.bilateralFilter`), yerel kontrast artırma (`cv2.createCLAHE`) ve `cv2.Canny` kenar çıkarımını uçtan uca zincirlemek.

### Gerçek Girdi Görüntüsü
Düşük kontrastlı, kenarlı ve eklenmiş Gauss gürültüsü içeren 400x300 boyutundaki teknik test sahnesidir.

![Hafta 8 Girdi Görüntüsü](/study-guide-images/eblg351/hafta08_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta08_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# Adım 1: Kenarları koruyarak gürültüyü temizle (Bilateral filtre: d=9, sigmaColor=75, sigmaSpace=75)
denoised = cv2.bilateralFilter(input_img, 9, 75, 75)

# Adım 2: CLAHE ile yerel kontrastı güçlendir (clipLimit=2.5, grid=8x8)
clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
enhanced = clahe.apply(denoised)

# Adım 3: Çift eşikli Canny kenar tespiti (Alt eşik: 50, Üst eşik: 140)
output_img = cv2.Canny(enhanced, 50, 140)

output_path = "public/study-guide-images/eblg351/hafta08_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.bilateralFilter(src, d, sigmaColor, sigmaSpace)`: Piksel yakınlığına ek olarak piksel yoğunluk farkını da ağırlıklandırır; kenarları bulanıklaştırmadan gürültüyü siler.
- `cv2.createCLAHE(clipLimit, tileGridSize)`: Kontrastı 8x8 ızgara bloklarında dengeler, gürültünün aşırı yükselmesini sınırlar.
- `cv2.Canny(image, threshold1, threshold2)`: Gradyan histerezisi ile güçlü kenarları izler ve zayıf parazitleri eler.

### Gerçek Çıktı Görüntüsü
Gürültüden kaynaklanan sahte kenarların bulunmadığı, yalnızca asıl nesne sınırlarının net 1-piksel kalınlığında beyaz çizgilerle temsil edildiği kenar haritasıdır.

![Hafta 8 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta08_output.png)

### Gözle Farkı
Doğrudan Canny uygulandığında tüm yüzey parazit çizgileriyle dolacakken, bilateral filtreleme ve CLAHE ön işlemleri sayesinde sadece gerçek yapısal kenarlar ayrıştırılmıştır.

### Küçük Parametre Denemesi
Canny üst eşiği 200'e çıkarıldığında yalnızca en keskin dış sınırlar kalır; alt eşik 20'ye düşürüldüğünde ise hafif gölge geçişleri de kenar olarak eklenir.

---

## Hafta 9: Renk Uzayları, Dönüşümler ve Renk Maskeleme

### Somut Amaç
BGR formatındaki renkli görüntüyü ışık değişimlerinden bağımsız HSV uzayına (`cv2.COLOR_BGR2HSV`) dönüştürmek, ton (Hue) ve doygunluk (Saturation) aralığıyla hedef yeşil rengi maskelemek ve `cv2.bitwise_and` ile izole etmek.

### Gerçek Girdi Görüntüsü
Kırmızı, yeşil ve mavi renkli geometrik nesnelerin yer aldığı 400x300 boyutundaki çok renkli test sahnesidir.

![Hafta 9 Girdi Görüntüsü](/study-guide-images/eblg351/hafta09_input.png)

### Python Kod Örneği
```python
import sys
import numpy as np
import cv2

input_path = "public/study-guide-images/eblg351/hafta09_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_COLOR)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. BGR uzayından HSV uzayına geç
hsv = cv2.cvtColor(input_img, cv2.COLOR_BGR2HSV)

# 2. Yeşil renk için HSV aralık sınırlarını belirle [H: 35-85, S: 60-255, V: 40-255]
lower_green = np.array([35, 60, 40], dtype=np.uint8)
upper_green = np.array([85, 255, 255], dtype=np.uint8)
mask = cv2.inRange(hsv, lower_green, upper_green)

# 3. Orijinal görüntü ile maskeyi bit düzeyinde VE (AND) işlemine sok
output_img = cv2.bitwise_and(input_img, input_img, mask=mask)

output_path = "public/study-guide-images/eblg351/hafta09_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.cvtColor(input_img, cv2.COLOR_BGR2HSV)`: Renk tonunu (0-179), doygunluğu (0-255) ve parlaklığı (0-255) birbirinden ayırır.
- `cv2.inRange(hsv, lower, upper)`: Yalnızca yeşil tona karşılık gelen pikselleri beyaz (255), diğer pikselleri siyah (0) yapar.
- `cv2.bitwise_and(src1, src2, mask=mask)`: Maskenin beyaz olduğu yerlerdeki orijinal pikselleri geçirir, siyah bölgeleri sıfırlar.

### Gerçek Çıktı Görüntüsü
Yalnızca ortadaki yeşil renkli dikdörtgen nesnenin korunduğu, kırmızı ve mavi daireler ile arka planın tamamen siyah maskelendiği görüntüdür.

![Hafta 9 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta09_output.png)

### Gözle Farkı
Hedef renk dışındaki tüm diğer renkler ve arka plan tamamen elenmiş, yeşil nesne tek başına segmentlere ayrılmıştır.

### Küçük Parametre Denemesi
Mavi renk tespiti için HSV aralığı [100, 100, 50] ile [130, 255, 255] olarak değiştirildiğinde sağdaki mavi daire izole edilir.

---

## Hafta 10: Görüntü Piramitleri ve Geometrik Afin Dönüşümler

### Somut Amaç
Görüntü koordinatlarını merkez etrafında afin döndürme matrisi (`cv2.getRotationMatrix2D`) ve afin sarma (`cv2.warpAffine`) çağrısıyla 30 derece döndürüp 0.85 oranında ölçeklendirmek.

### Gerçek Girdi Görüntüsü
Geometrik ızgara hatları, çerçeve ve referans metinleri içeren 400x300 boyutundaki koordinat kalibrasyon panosudur.

![Hafta 10 Girdi Görüntüsü](/study-guide-images/eblg351/hafta10_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta10_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_COLOR)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Dönme merkezini (200, 150), açıyı (30 derece) ve ölçeği (0.85) belirle
h, w = input_img.shape[:2]
center = (w / 2.0, h / 2.0)
angle = 30.0
scale = 0.85

# 2. 2x3 boyutundaki afin dönüşüm matrisini oluştur
rot_mat = cv2.getRotationMatrix2D(center, angle, scale)

# 3. Afin dönüşümü uygula (boş kalan sınırlara koyu gri dolgu: BORDER_CONSTANT)
output_img = cv2.warpAffine(
    input_img, rot_mat, (w, h),
    borderMode=cv2.BORDER_CONSTANT, borderValue=(40, 40, 40)
)

output_path = "public/study-guide-images/eblg351/hafta10_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.getRotationMatrix2D(center, angle, scale)`: Verilen merkez koordinatı etrafında saat yönünün tersine dönme ve ölçekleme katsayılarını içeren 2x3 afin matrisini üretir.
- `cv2.warpAffine(src, M, dsize, borderMode, borderValue)`: Her piksel koordinatını afin matrisiyle eşler ve hedef çözünürlüğe enterpolasyonla yazar.

### Gerçek Çıktı Görüntüsü
Merkez etrafında 30 derece saat yönünün tersine döndürülmüş ve kenarları koyu gri dolguyla sarılmış afin dönüşüm görüntüsüdür.

![Hafta 10 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta10_output.png)

### Gözle Farkı
Tüm ızgara çizgileri ve metinler düz hatlarını koruyarak açısal olarak eğilmiş; görüntü alanı dışına taşan kısımlar sınır dolgusuyla çerçevelenmiştir.

### Küçük Parametre Denemesi
`cv2.BORDER_REFLECT` sınır bayrağı kullanıldığında dönme sonucu açıkta kalan köşe üçgenleri görüntünün kenar pikselleriyle ayna gibi yansıtılarak doldurulur.

---

## Hafta 11: Görüntü Sıkıştırma ve Sayısal Filigran Ekleme

### Somut Amaç
Renkli bir referans görüntünün sağ alt köşesine `cv2.addWeighted` ile yarı saydam bir filigran (su damgası) yerleştirmek ve `cv2.imencode` ile düşük JPEG kalitesinde sıkıştırarak DCT blok artefaktlarını gözlemlemek.

### Gerçek Girdi Görüntüsü
Zengin renk geçişleri, sinüzoidal gradyanlar ve merkezinde halka deseni içeren 400x300 boyutundaki referans görüntüdür.

![Hafta 11 Girdi Görüntüsü](/study-guide-images/eblg351/hafta11_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta11_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_COLOR)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Sağ alt köşeye yarı saydam filigran katmanı hazırla
watermarked = input_img.copy()
overlay = input_img.copy()
cv2.rectangle(overlay, (220, 220), (380, 280), (30, 30, 30), -1)
cv2.putText(overlay, "(C) EBLG351", (235, 258), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 230, 255), 2)

# Alfa harmanlama: %60 overlay + %40 orijinal
cv2.addWeighted(overlay, 0.6, watermarked, 0.4, 0.0, watermarked)

# 2. Düşük kaliteli JPEG sıkıştırması uygula (Kalite faktörü: 12)
encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 12]
success, encimg = cv2.imencode(".jpg", watermarked, encode_param)

# 3. Sıkıştırılmış bayt dizisini bellekten geri aç
output_img = cv2.imdecode(encimg, cv2.IMREAD_COLOR)

output_path = "public/study-guide-images/eblg351/hafta11_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.addWeighted(src1, alpha, src2, beta, gamma[, dst])`: İki diziyi doğrusal ağırlıklarla harmanlayarak şeffaflık etkisi yaratır.
- `cv2.imencode(ext, img, params)`: Görüntüyü bellek üzerindeki bir bayt dizisine sıkıştırır. `cv2.IMWRITE_JPEG_QUALITY` parametresi sıkıştırma kalitesini belirler.
- `cv2.imdecode(buf, flags)`: Bellekteki sıkıştırılmış bayt dizisini çözerek yeniden NumPy dizisi haline getirir.

### Gerçek Çıktı Görüntüsü
Sağ alt köşesinde yarı saydam telif filigranı bulunan ve JPEG sıkıştırmasından kaynaklanan belirgin 8x8 piksel bloklaşmalarını içeren görüntüdür.

![Hafta 11 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta11_output.png)

### Gözle Farkı
Pürüzsüz sinüs gradyanları yerini basamaklı 8x8 kare bloklara bırakmış, dosya boyutu ciddi oranda düşürülmüş ve telif filigranı görüntüye kazınmıştır.

### Küçük Parametre Denemesi
`cv2.IMWRITE_JPEG_QUALITY` değeri 95 yapıldığında bloklaşma tamamen kaybolur; değer 5 yapıldığında ise metin kenarlarında belirgin halkalanma artefaktı oluşur.

---

## Hafta 12: Morfolojik Görüntü İşleme ve Şekil Filtreleme

### Somut Amaç
Yapılandırıcı eleman (`cv2.getStructuringElement`) kullanarak gürültülü ikili bir görüntüde Açma (`cv2.MORPH_OPEN`) ile arka plandaki küçük beyaz parazitleri silmek ve Kapama (`cv2.MORPH_CLOSE`) ile nesne içindeki delikleri kapatmak.

### Gerçek Girdi Görüntüsü
İki katı nesne içeren ancak üzerinde siyah delikler ve çevresinde beyaz tuz gürültü noktacıkları bulunan 400x300 boyutundaki ikili görüntüdür.

![Hafta 12 Girdi Görüntüsü](/study-guide-images/eblg351/hafta12_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta12_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. 7x7 dikdörtgen yapılandırıcı eleman oluştur
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))

# 2. Açma (Opening: Erozyon ardından Genişletme) -> Dış parazitleri siler
opened = cv2.morphologyEx(input_img, cv2.MORPH_OPEN, kernel)

# 3. Kapama (Closing: Genişletme ardından Erozyon) -> İç delikleri doldurur
output_img = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)

output_path = "public/study-guide-images/eblg351/hafta12_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.getStructuringElement(shape, ksize)`: Morfolojik kaydırma filtresi için çekirdek maskesi (`cv2.MORPH_RECT`, `cv2.MORPH_ELLIPSE`, `cv2.MORPH_CROSS`) üretir.
- `cv2.morphologyEx(src, cv2.MORPH_OPEN, kernel)`: Çekirdek boyutundan küçük izole beyaz nesneleri yok eder.
- `cv2.morphologyEx(src, cv2.MORPH_CLOSE, kernel)`: Çekirdek boyutundan küçük siyah boşlukları ve delikleri birleştirerek doldurur.

### Gerçek Çıktı Görüntüsü
Tüm parazit beyaz noktaların elendiği, nesnelerin içindeki deliklerin tamamen kapatıldığı pürüzsüz ve temiz ikili silüet görüntüsüdür.

![Hafta 12 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta12_output.png)

### Gözle Farkı
Arka plandaki rastgele parazit kirlilikleri temizlenmiş, dikdörtgen ve dairenin gövde bütünlüğü kusursuz bir şekilde onarılmıştır.

### Küçük Parametre Denemesi
`cv2.MORPH_GRADIENT` uygulandığında nesnelerin sadece dış sınır çizgisi (genişletme eksi erozyon) elde edilir.

---

## Hafta 13: Görüntü Bölütleme, Otsu Eşikleme ve Kontur Analizi

### Somut Amaç
Farklı gri seviyelerindeki nesneleri barındıran bir görüntüde Otsu otomatik eşikleme yöntemiyle (`cv2.THRESH_OTSU`) ikili bölütleme yapmak, nesne sınırlarını `cv2.findContours` ile tespit edip yeşil kontur çizgileriyle çizmek.

### Gerçek Girdi Görüntüsü
Gri tonlamalı arka plan üzerinde daire, dikdörtgen ve üçgen nesnelerin bulunduğu 400x300 boyutundaki test sahnesidir.

![Hafta 13 Girdi Görüntüsü](/study-guide-images/eblg351/hafta13_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta13_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Otsu algoritması ile ikili bölütleme yap
otsu_thresh, binary = cv2.threshold(
    input_img, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU
)
print(f"Otomatik Hesaplanan Otsu Eşiği: {otsu_thresh}")

# 2. Dış konturları bul
contours, hierarchy = cv2.findContours(
    binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
)

# 3. Konturları orijinal sahne üzerine yeşil renkte çiz (Kalınlık: 2)
output_img = cv2.cvtColor(input_img, cv2.COLOR_GRAY2BGR)
cv2.drawContours(output_img, contours, -1, (0, 255, 0), 2)

output_path = "public/study-guide-images/eblg351/hafta13_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.threshold(..., cv2.THRESH_OTSU)`: Sınıflar arası varyansı maksimize eden eşik değerini histogram üzerinden otomatik hesaplar; manuel eşik denemesi ihtiyacını ortadan kaldırır.
- `cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)`: İkili piksellerin sınır koordinatlarını hiyerarşik diziler olarak ayıklar.
- `cv2.drawContours(image, contours, contourIdx, color, thickness)`: Tespit edilen kontur koordinatlarını renkli çizgilerle matrise işler.

### Gerçek Çıktı Görüntüsü
Her üç nesnenin (daire, dikdörtgen, üçgen) sınırlarının yeşil renkli kontur çizgileriyle çevrelendiği bölütleme çıktısıdır.

![Hafta 13 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta13_output.png)

### Gözle Farkı
Sürekli tonlu gri pikseller nesne bazında ayrıklaştırılmış, geometrik sınırları vektörel koordinat dizileri olarak yakalanmıştır.

### Küçük Parametre Denemesi
`cv2.RETR_TREE` parametresi seçildiğinde nesnelerin içindeki deliklerin iç konturları da hiyerarşik olarak listelenir.

---

## Hafta 14: Öznitelik Çıkarımı, Köşe ve ORB Anahtar Noktaları

### Somut Amaç
Görüntü üzerindeki belirgin köşeleri, desenleri ve kenar kesişimlerini ölçek ve yönelim duyarlı ORB (`cv2.ORB_create`) öznitelik dedektörü ile saptamak ve `cv2.drawKeypoints` ile zengin çemberler halinde görselleştirmek.

### Gerçek Girdi Görüntüsü
Çapraz çizgiler, yıldız çokgeni ve dama tahtası deseni içeren 400x300 boyutundaki öznitelik test panosudur.

![Hafta 14 Girdi Görüntüsü](/study-guide-images/eblg351/hafta14_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta14_input.png"
input_img = cv2.imread(input_path, cv2.IMREAD_COLOR)

if input_img is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

gray = cv2.cvtColor(input_img, cv2.COLOR_BGR2GRAY)

# 1. En güçlü 250 anahtar noktayı hedefleyen ORB dedektörü oluştur
orb = cv2.ORB_create(nfeatures=250)

# 2. Anahtar noktaları ve tanımlayıcıları (descriptor) hesapla
keypoints, descriptors = orb.detectAndCompute(gray, None)

# 3. Noktaları boyut ve yönelim açılarıyla zengin görselleştir
output_img = cv2.drawKeypoints(
    input_img, keypoints, None,
    color=(0, 0, 255),
    flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS
)

output_path = "public/study-guide-images/eblg351/hafta14_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.ORB_create(nfeatures)`: FAST köşe dedektörü ve BRIEF tanımlayıcısını yönelim ve ölçek piramidiyle birleştiren patent kısıtlamasız öznitelik nesnesi kurar.
- `orb.detectAndCompute(gray, mask)`: Köşe noktalarının (x,y) koordinatlarını, ölçek yarıçapını ve açı yönünü tek adımda çıkarır.
- `cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS`: Anahtar noktanın sadece merkezini değil, yerel ölçeğini temsil eden daireyi ve yönelme açısını gösteren yarıçap çizgisini çizer.

### Gerçek Çıktı Görüntüsü
Yıldız köşelerinde ve dama tahtası kesişimlerinde yoğunlaşan, yön ve ölçek çemberleri içeren kırmızı anahtar noktalarıdır.

![Hafta 14 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta14_output.png)

### Gözle Farkı
Düz ve homojen yüzeylerde nokta üretilmezken; yön değiştiren köşeler ve yoğun doku kesişimleri büyüklük ve açı bilgisiyle haritalanmıştır.

### Küçük Parametre Denemesi
`nfeatures` sayısı 50'ye indirildiğinde yalnızca en keskin dış köşeler kalır; 1000'e çıkarıldığında ise daha zayıf doku değişimleri de listelenir.

---

## Hafta 15: Örüntü Tanıma, Sınıflandırma ve Şablon Eşleme

### Somut Amaç
Geniş bir arama sahnesi içinde referans olarak verilen küçük bir hedef şablonu normalize çapraz korelasyon yöntemiyle (`cv2.matchTemplate`) aramak, tepe korelasyon noktasını `cv2.minMaxLoc` ile bularak hedefi çerçeve içine almak.

### Gerçek Girdi Görüntüsü
Çeşitli çipler ve devre hatları barındıran, içinde aranan özel hedef mikrodenetleyicinin de bulunduğu 400x300 boyutundaki arama sahnesidir.

![Hafta 15 Girdi Görüntüsü](/study-guide-images/eblg351/hafta15_input.png)

### Python Kod Örneği
```python
import sys
import cv2

input_path = "public/study-guide-images/eblg351/hafta15_input.png"
scene = cv2.imread(input_path, cv2.IMREAD_COLOR)

if scene is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Hedef çip bölgesini şablon olarak dilimle [x=175, y=115, w=60, h=60]
target_x, target_y = 175, 115
w, h = 60, 60
tpl = scene[target_y:target_y + h, target_x:target_x + w].copy()

# 2. Normalize çapraz korelasyon ile eşleme haritası üret
res = cv2.matchTemplate(scene, tpl, cv2.TM_CCOEFF_NORMED)

# 3. En yüksek korelasyon değerini ve konumunu bul
min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
print(f"En Yüksek Eşleşme Skoru: {max_val:.2f} Konum: {max_loc}")

# 4. Bulunan konumu kırmızı çerçeve ve skor yazısıyla işaretle
output_img = scene.copy()
bottom_right = (max_loc[0] + w, max_loc[1] + h)
cv2.rectangle(output_img, max_loc, bottom_right, (0, 0, 255), 3)
cv2.putText(
    output_img, f"MATCH: {max_val:.2f}", (max_loc[0] - 10, max_loc[1] - 10),
    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2
)

output_path = "public/study-guide-images/eblg351/hafta15_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.matchTemplate(image, templ, method)`: Şablon matrisini sahne üzerinde kaydırarak benzerlik matrisi üretir. `cv2.TM_CCOEFF_NORMED` normalize korelasyon katsayısı kullanır (1.0 mükemmel eşleşme).
- `cv2.minMaxLoc(src)`: Matris içindeki en küçük ve en büyük piksel değerlerini ve piksel koordinatlarını döndürür.

### Gerçek Çıktı Görüntüsü
Sahnedeki benzer yanıltıcı çipler arasından asıl aranan çipin tam konumu bulunarak kırmızı kalın çerçeveyle işaretlenmiş çıktıdır.

![Hafta 15 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta15_output.png)

### Gözle Farkı
Gözle arama yapmaya gerek kalmadan, şablonun piksel deseniyle birebir eşleşen koordinat otomatik olarak lokalize edilmiştir.

### Küçük Parametre Denemesi
`cv2.TM_SQDIFF_NORMED` yöntemi seçildiğinde mükemmel eşleşme maksimum tepe noktası yerine sıfıra en yakın minimum noktada (`min_loc`) aranır.

---

## Hafta 16: Uçtan Uca Belge Tarayıcı ve Perspektif Düzeltme Projesi

### Somut Amaç
Masa üzerinde yamuk ve açılı duran bir belgenin dört köşe koordinatını belirlemek, `cv2.getPerspectiveTransform` ve `cv2.warpPerspective` çağrılarıyla dik A4 oranına dönüştürmek ve `cv2.adaptiveThreshold` ile taranmış temiz belge formuna kavuşturmak.

### Gerçek Girdi Görüntüsü
Koyu masa yüzeyinde yamuk perspektif açısıyla duran beyaz bir belge ve üzerindeki metin satırlarını içeren 400x300 boyutundaki test sahnesidir.

![Hafta 16 Girdi Görüntüsü](/study-guide-images/eblg351/hafta16_input.png)

### Python Kod Örneği
```python
import sys
import numpy as np
import cv2

input_path = "public/study-guide-images/eblg351/hafta16_input.png"
scene = cv2.imread(input_path, cv2.IMREAD_COLOR)

if scene is None:
    print(f"Hata: Girdi görüntüsü yüklenemedi: {input_path}")
    sys.exit(1)

# 1. Belgenin tespit edilen 4 kaynak köşe noktası (sol-üst, sağ-üst, sağ-alt, sol-alt)
src_pts = np.float32([[80, 50], [310, 30], [350, 260], [60, 220]])

# 2. Hedef düzeltilmiş dikdörtgen koordinatları (300x400 dikey belge)
dst_w, dst_h = 300, 400
dst_pts = np.float32([[0, 0], [dst_w - 1, 0], [dst_w - 1, dst_h - 1], [0, dst_h - 1]])

# 3. 3x3 homografi perspektif matrisini hesapla ve perspektifi düzelt
M = cv2.getPerspectiveTransform(src_pts, dst_pts)
warped = cv2.warpPerspective(scene, M, (dst_w, dst_h))

# 4. Griye çevir ve yerel gölgeleri temizlemek için adaptif eşikleme uygula
warped_gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
scanned = cv2.adaptiveThreshold(
    warped_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8
)

# 5. Belgeyi 400x300 boyutundaki tuvalde ortalayarak kaydet
output_img = np.full((300, 400), 40, dtype=np.uint8)
preview = cv2.resize(scanned, (210, 280), interpolation=cv2.INTER_AREA)
output_img[10:290, 95:305] = preview

output_path = "public/study-guide-images/eblg351/hafta16_output.png"
cv2.imwrite(output_path, output_img)
```

### İşlem Çağrıları ve Parametrelerin Anlamı
- `cv2.getPerspectiveTransform(src, dst)`: Düzlemdeki 4 serbest noktayı hedef dikdörtgenin 4 köşesine eşleyen 3x3 homografi dönüşüm matrisini üretir.
- `cv2.warpPerspective(src, M, dsize)`: Homografi projeksiyonu uygulayarak kameranın bakış açısını dik üstten bakışa dönüştürür.
- `cv2.adaptiveThreshold(src, maxValue, adaptiveMethod, thresholdType, blockSize, C)`: Işık dengesizliklerini ve masa gölgelerini yerel blok pencerelerinde ortalama hesaplayarak eler; kağıdı saf beyaz, yazıları saf siyah yapar.

### Gerçek Çıktı Görüntüsü
Yamuk ve açılı belge görüntüsünün dik açıyla taranmış, gölgelerden arındırılmış ve net ikili belge formuna dönüştürülmüş nihai çıktısıdır.

![Hafta 16 Çıktı Görüntüsü](/study-guide-images/eblg351/hafta16_output.png)

### Gözle Farkı
Eğik duruş, perspektif bozulması ve zemin renkleri tamamen yok edilmiş; fiziksel tarayıcıdan çıkmış gibi düzgün ve okunabilir bir dijital belge elde edilmiştir.

### Küçük Parametre Denemesi
Adaptif eşikleme blok boyutu 15 yerine 31 yapıldığında geniş harf gövdelerinin içleri daha temiz beyaz kalır; `C` sabiti 8 yerine 2 yapıldığında ise soluk kalem yazıları daha belirginleşir.
