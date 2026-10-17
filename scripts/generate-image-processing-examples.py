"""
EBLG351 Görüntü İşleme Dersi - Yeniden Üretilebilir Görsel Örnek Üreticisi
Tüm 16 hafta için sentetik/gerçek OpenCV girdi ve çıktı PNG görüntülerini üretir.
Python: 3.14+, OpenCV: cv2 (4.15+), NumPy: 2.x
"""

import os
import sys
import numpy as np
import cv2

np.random.seed(42)

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "study-guide-images", "eblg351"))
os.makedirs(OUT_DIR, exist_ok=True)

def save_png(filename, img):
    path = os.path.join(OUT_DIR, filename)
    success = cv2.imwrite(path, img)
    if not success:
        raise RuntimeError(f"Görsel kaydedilemedi: {path}")
    size = os.path.getsize(path)
    h, w = img.shape[:2]
    print(f"[OK] {filename:22s} -> {w}x{h} ({size} bayt)")
    return path

# ----------------------------------------------------------------------
# HAFTA 1: Giriş, Mat Yapısı ve BGR -> Gri Tonlama
# ----------------------------------------------------------------------
def generate_week01():
    # Girdi: Sentetik BGR test kalibrasyon panosu
    img = np.zeros((300, 400, 3), dtype=np.uint8)
    img[:] = (240, 240, 240) # Açık gri zemin
    
    # Izgara çizgileri
    for x in range(0, 400, 40):
        cv2.line(img, (x, 0), (x, 300), (210, 210, 210), 1)
    for y in range(0, 300, 40):
        cv2.line(img, (0, y), (400, y), (210, 210, 210), 1)
        
    # Renkli geometrik bloklar (Mavi, Yeşil, Kırmızı, Sarı)
    cv2.circle(img, (100, 100), 55, (220, 50, 50), -1)   # Mavi (BGR)
    cv2.circle(img, (220, 100), 55, (50, 190, 50), -1)   # Yeşil
    cv2.circle(img, (340, 100), 55, (50, 50, 220), -1)   # Kırmızı
    cv2.rectangle(img, (70, 190), (330, 260), (30, 200, 240), -1) # Sarı dikdörtgen
    
    cv2.putText(img, "OPENCV BGR INPUT", (95, 235), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (20, 20, 20), 2, cv2.LINE_AA)
    
    save_png("hafta01_input.png", img)
    
    # Çıktı: BGR'den tek kanallı Gri Tonlamaya dönüştürme
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    save_png("hafta01_output.png", gray)

# ----------------------------------------------------------------------
# HAFTA 2: Temel Görüntü İşlemleri, ROI Kırpma ve Boyutlandırma
# ----------------------------------------------------------------------
def generate_week02():
    # Girdi: Çoklu nesneler içeren 400x300 sahne
    img = np.full((300, 400, 3), 45, dtype=np.uint8)
    
    # Odak bölgesi nesneleri (merkezde detaylı hedef sembolü)
    cv2.rectangle(img, (120, 60), (280, 220), (70, 70, 70), -1)
    cv2.circle(img, (200, 140), 65, (40, 140, 240), -1) # Turuncu daire
    cv2.circle(img, (200, 140), 45, (240, 240, 240), -1) # Beyaz iç halka
    cv2.circle(img, (200, 140), 20, (180, 40, 40), -1)   # Koyu mavi merkez
    cv2.drawMarker(img, (200, 140), (20, 20, 20), cv2.MARKER_CROSS, 80, 2)
    cv2.putText(img, "TARGET ROI", (140, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Çevre semboller
    cv2.rectangle(img, (20, 20), (70, 70), (50, 180, 80), 2)
    cv2.rectangle(img, (330, 220), (380, 270), (200, 50, 180), 2)
    
    save_png("hafta02_input.png", img)
    
    # Çıktı: ROI [60:220, 120:280] (160x160) kırpılıp 400x300 boyutuna INTER_LINEAR ile büyütüldü
    roi = img[60:220, 120:280]
    resized = cv2.resize(roi, (400, 300), interpolation=cv2.INTER_LINEAR)
    save_png("hafta02_output.png", resized)

# ----------------------------------------------------------------------
# HAFTA 3: Parlaklık, Kontrast ve Histogram Eşitleme (cv::equalizeHist)
# ----------------------------------------------------------------------
def generate_week03():
    # Girdi: Koyu, dar dinamik aralıklı (düşük kontrastlı) gri tonlama görüntü
    y_coords, x_coords = np.indices((300, 400))
    pattern = 65.0 + 30.0 * np.sin(x_coords / 40.0) + 20.0 * np.cos(y_coords / 30.0)
    base = np.clip(pattern, 25, 110).astype(np.uint8)
            
    # Gizli nesneler ekle (karanlıkta gizlenmiş şekiller)
    cv2.circle(base, (130, 150), 50, 75, -1)
    cv2.rectangle(base, (230, 100), (320, 200), 85, -1)
    cv2.putText(base, "HIDDEN DETAIL", (100, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 95, 2)
    
    input_img = np.clip(base, 25, 110).astype(np.uint8)
    save_png("hafta03_input.png", input_img)
    
    # Çıktı: Histogram eşitleme ile kontrastı [0, 255] aralığına açma
    equalized = cv2.equalizeHist(input_img)
    save_png("hafta03_output.png", equalized)

# ----------------------------------------------------------------------
# HAFTA 4: Uzamsal Filtreleme (cv::GaussianBlur ve cv::Sobel Kenar Tespiti)
# ----------------------------------------------------------------------
def generate_week04():
    # Girdi: Temiz geometrik şekiller üzerine Gauss ve tuz-biber gürültüsü
    clean = np.full((300, 400), 120, dtype=np.uint8)
    cv2.rectangle(clean, (50, 60), (170, 230), 220, -1)
    cv2.circle(clean, (280, 150), 70, 40, -1)
    cv2.line(clean, (30, 270), (370, 270), 240, 5)
    
    # Gauss gürültüsü ekle
    noise = np.random.normal(0, 22, clean.shape).astype(np.float32)
    noisy = np.clip(clean.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    save_png("hafta04_input.png", noisy)
    
    # Çıktı: GaussianBlur(5x5, 1.5) ardından Sobel gradyan genliği
    blurred = cv2.GaussianBlur(noisy, (5, 5), 1.5)
    grad_x = cv2.Sobel(blurred, cv2.CV_32F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(blurred, cv2.CV_32F, 0, 1, ksize=3)
    mag = cv2.magnitude(grad_x, grad_y)
    output = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    save_png("hafta04_output.png", output)

# ----------------------------------------------------------------------
# HAFTA 5: DFT / FFT API Spektrum Analizi (cv::dft, cv::magnitude, cv::log)
# ----------------------------------------------------------------------
def generate_week05():
    # Girdi: Periyodik çizgiler ve merkezi elips içeren test deseni
    img = np.zeros((300, 400), dtype=np.uint8)
    # Yatay ve dikey periyodik şeritler
    for x in range(0, 400, 20):
        cv2.line(img, (x, 0), (x, 300), 180, 2)
    for y in range(0, 300, 25):
        cv2.line(img, (0, y), (400, y), 180, 2)
    cv2.ellipse(img, (200, 150), (90, 50), 0, 0, 360, 255, -1)
    save_png("hafta05_input.png", img)
    
    # Çıktı: cv::dft, merkezleme (fftshift), logaritmik spektrum
    f_img = np.float32(img)
    dft = cv2.dft(f_img, flags=cv2.DFT_COMPLEX_OUTPUT)
    dft_shift = np.fft.fftshift(dft)
    mag = cv2.magnitude(dft_shift[:, :, 0], dft_shift[:, :, 1])
    spec = cv2.log(mag + 1.0)
    spectrum_img = cv2.normalize(spec, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    save_png("hafta05_output.png", spectrum_img)

# ----------------------------------------------------------------------
# HAFTA 6: Frekans Filtreleme API Uygulaması (Gaussian Low-Pass Filter)
# ----------------------------------------------------------------------
def generate_week06():
    # Girdi: Şekiller üzerine bindirilmiş yüksek frekanslı sinüzoidal dalgalı desen
    base = np.full((300, 400), 100, dtype=np.float32)
    cv2.circle(base, (150, 150), 60, 210, -1)
    cv2.rectangle(base, (240, 80), (340, 220), 30, -1)
    
    # Yüksek frekanslı sinüzoidal gürültü ekle: sin(0.8*x) * 45
    y_coords, x_coords = np.indices((300, 400))
    hf_noise = 40.0 * np.sin(0.7 * x_coords) + 30.0 * np.cos(0.7 * y_coords)
    noisy = np.clip(base + hf_noise, 0, 255).astype(np.uint8)
    save_png("hafta06_input.png", noisy)
    
    # Çıktı: DFT -> Gaussian Alçak Geçiren Filtre (D0=15) -> Ters DFT
    float_img = np.float32(noisy)
    complex_i = cv2.merge([float_img, np.zeros_like(float_img)])
    dft = cv2.dft(complex_i)
    
    def cpp_fftshift(mat):
        cx = mat.shape[1] // 2
        cy = mat.shape[0] // 2
        out = np.zeros_like(mat)
        out[0:cy, 0:cx] = mat[cy:, cx:]
        out[cy:, cx:] = mat[0:cy, 0:cx]
        out[0:cy, cx:] = mat[cy:, 0:cx]
        out[cy:, 0:cx] = mat[0:cy, cx:]
        return out
        
    shifted = cpp_fftshift(dft)
    
    mask = np.zeros((300, 400), dtype=np.float32)
    cx, cy = 200.0, 150.0
    d0 = 15.0
    for y in range(300):
        for x in range(400):
            dist_sq = (x - cx)**2 + (y - cy)**2
            mask[y, x] = np.exp(-dist_sq / (2.0 * d0 * d0))
            
    complex_mask = cv2.merge([mask, np.zeros_like(mask)])
    filtered = cv2.mulSpectrums(shifted, complex_mask, 0)
    ishift = cpp_fftshift(filtered)
    img_back = cv2.idft(ishift, flags=cv2.DFT_SCALE | cv2.DFT_REAL_OUTPUT)
    output = np.clip(img_back, 0, 255).astype(np.uint8)
    save_png("hafta06_output.png", output)

# ----------------------------------------------------------------------
# HAFTA 7: Görüntü Onarımı (cv::inpaint ve Restorasyon)
# ----------------------------------------------------------------------
def generate_week07():
    # Temiz referans sahne
    clean = np.zeros((300, 400, 3), dtype=np.uint8)
    # Gradyan zemin
    for y in range(300):
        clean[y, :] = (int(160 - y*0.3), int(190 - y*0.2), int(220 - y*0.1))
    cv2.circle(clean, (150, 150), 65, (50, 120, 210), -1)
    cv2.circle(clean, (270, 130), 45, (80, 200, 80), -1)
    cv2.rectangle(clean, (80, 210), (320, 270), (220, 150, 60), -1)
    
    # Yapay hasar: beyaz çizikler ve lekeler ekle
    corrupted = clean.copy()
    mask = np.zeros((300, 400), dtype=np.uint8)
    cv2.line(corrupted, (40, 50), (360, 250), (255, 255, 255), 4)
    cv2.line(mask, (40, 50), (360, 250), 255, 4)
    cv2.line(corrupted, (80, 240), (320, 70), (255, 255, 255), 3)
    cv2.line(mask, (80, 240), (320, 70), 255, 3)
    cv2.circle(corrupted, (150, 150), 12, (255, 255, 255), -1)
    cv2.circle(mask, (150, 150), 12, 255, -1)
    
    save_png("hafta07_input.png", corrupted)
    
    # Çıktı: cv::inpaint (Telea) ile hasar maskesini onarma
    restored = cv2.inpaint(corrupted, mask, 3, cv2.INPAINT_TELEA)
    save_png("hafta07_output.png", restored)

# ----------------------------------------------------------------------
# HAFTA 8: Uygulamalı Tekrar (Bilateral Filter + CLAHE + Canny)
# ----------------------------------------------------------------------
def generate_week08():
    # Girdi: Düşük kontrastlı, kenarlı ve Gauss gürültülü test sahnesi
    img = np.full((300, 400), 70, dtype=np.uint8)
    cv2.rectangle(img, (60, 60), (180, 230), 120, -1)
    cv2.rectangle(img, (90, 90), (150, 200), 90, -1)
    cv2.circle(img, (290, 150), 65, 140, -1)
    cv2.circle(img, (290, 150), 35, 105, -1)
    
    noise = np.random.normal(0, 16, img.shape).astype(np.float32)
    noisy = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    save_png("hafta08_input.png", noisy)
    
    # Çıktı: Bilateral filter -> CLAHE -> Canny
    denoised = cv2.bilateralFilter(noisy, 9, 75, 75)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(denoised)
    edges = cv2.Canny(clahe, 50, 140)
    save_png("hafta08_output.png", edges)

# ----------------------------------------------------------------------
# HAFTA 9: Renk Uzayları ve Renk Maskeleme (cv::cvtColor, cv::inRange, cv::bitwise_and)
# ----------------------------------------------------------------------
def generate_week09():
    # Girdi: Çok renkli nesneler içeren BGR sahne
    img = np.full((300, 400, 3), 235, dtype=np.uint8)
    cv2.circle(img, (90, 140), 55, (40, 40, 220), -1)   # Kırmızı (BGR)
    cv2.rectangle(img, (170, 85), (270, 195), (40, 190, 50), -1) # Yeşil kare
    cv2.circle(img, (330, 140), 45, (220, 60, 40), -1)  # Mavi daire
    cv2.putText(img, "COLOR SPACES", (110, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    save_png("hafta09_input.png", img)
    
    # Çıktı: HSV uzayında yeşil rengi maskeleme ve ayıklama
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_green = np.array([35, 60, 40])
    upper_green = np.array([85, 255, 255])
    mask = cv2.inRange(hsv, lower_green, upper_green)
    isolated_green = cv2.bitwise_and(img, img, mask=mask)
    save_png("hafta09_output.png", isolated_green)

# ----------------------------------------------------------------------
# HAFTA 10: Görüntü Piramitleri ve Geometrik Dönüşümler (cv::pyrDown, cv::warpAffine)
# ----------------------------------------------------------------------
def generate_week10():
    # Girdi: Geometrik referans ızgarası ve işaretçiler
    img = np.full((300, 400, 3), 245, dtype=np.uint8)
    for i in range(20, 380, 40):
        cv2.line(img, (i, 20), (i, 280), (200, 200, 200), 1)
    for j in range(20, 280, 40):
        cv2.line(img, (20, j), (380, j), (200, 200, 200), 1)
    cv2.rectangle(img, (140, 90), (260, 210), (180, 80, 50), 3)
    cv2.putText(img, "AFFINE 30 DEG", (110, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 50, 180), 2)
    save_png("hafta10_input.png", img)
    
    # Çıktı: Merkez etrafında 30 derece döndürme ve 0.85 ölçekleme
    center = (200, 150)
    matrix = cv2.getRotationMatrix2D(center, 30.0, 0.85)
    transformed = cv2.warpAffine(img, matrix, (400, 300), borderMode=cv2.BORDER_CONSTANT, borderValue=(40, 40, 40))
    save_png("hafta10_output.png", transformed)

# ----------------------------------------------------------------------
# HAFTA 11: Sıkıştırma ve Filigran (cv::imencode JPEG ve cv::addWeighted Filigran)
# ----------------------------------------------------------------------
def generate_week11():
    # Girdi: Yüksek kaliteli renkli gradyan ve ince desenler
    img = np.zeros((300, 400, 3), dtype=np.uint8)
    for y in range(300):
        for x in range(400):
            img[y, x] = [int(120 + 80 * np.sin(x / 25.0)),
                         int(120 + 80 * np.cos(y / 25.0)),
                         int(140 + 70 * np.sin((x + y) / 30.0))]
    cv2.circle(img, (200, 150), 70, (255, 255, 255), 2)
    save_png("hafta11_input.png", img)
    
    # Çıktı: Sağ alt köşeye yarı saydam filigran ekle + Düşük kaliteli JPEG sıkıştırması uygula
    watermarked = img.copy()
    overlay = img.copy()
    cv2.rectangle(overlay, (220, 220), (380, 280), (30, 30, 30), -1)
    cv2.putText(overlay, "(C) EBLG351", (235, 258), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 230, 255), 2)
    cv2.addWeighted(overlay, 0.6, watermarked, 0.4, 0, watermarked)
    
    # JPEG Q=12 sıkıştırma döngüsü (bloklaşma görünür olsun)
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 12]
    _, encimg = cv2.imencode(".jpg", watermarked, encode_param)
    compressed = cv2.imdecode(encimg, cv2.IMREAD_COLOR)
    save_png("hafta11_output.png", compressed)

# ----------------------------------------------------------------------
# HAFTA 12: Morfolojik Görüntü İşleme (cv::morphologyEx Açma ve Kapama)
# ----------------------------------------------------------------------
def generate_week12():
    # Girdi: İkili nesneler üzerinde gürültü noktaları ve iç delikler
    img = np.zeros((300, 400), dtype=np.uint8)
    # İki ana katı nesne
    cv2.rectangle(img, (70, 70), (190, 220), 255, -1)
    cv2.circle(img, (280, 150), 65, 255, -1)
    
    # Nesne içine siyah delikler aç
    cv2.circle(img, (130, 140), 12, 0, -1)
    cv2.circle(img, (280, 150), 15, 0, -1)
    cv2.rectangle(img, (100, 85), (120, 105), 0, -1)
    
    # Arka plana beyaz tuz gürültü noktacıkları saç
    np.random.seed(123)
    for _ in range(120):
        rx, ry = np.random.randint(0, 400), np.random.randint(0, 300)
        img[ry, rx] = 255
    save_png("hafta12_input.png", img)
    
    # Çıktı: MORPH_OPEN (noktaları siler) ardından MORPH_CLOSE (delikleri kapatır)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    opened = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)
    save_png("hafta12_output.png", closed)

# ----------------------------------------------------------------------
# HAFTA 13: Görüntü Bölütleme (Otsu Eşikleme ve cv::findContours)
# ----------------------------------------------------------------------
def generate_week13():
    # Girdi: Çoklu gri tonlamalı nesneler içeren sahne
    img = np.full((300, 400), 50, dtype=np.uint8)
    cv2.circle(img, (100, 100), 45, 180, -1)
    cv2.rectangle(img, (220, 60), (320, 160), 210, -1)
    
    pts = np.array([[150, 260], [250, 260], [200, 190]], np.int32)
    cv2.fillPoly(img, [pts], 160)
    
    noise = np.random.normal(0, 8, img.shape).astype(np.float32)
    noisy = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    save_png("hafta13_input.png", noisy)
    
    # Çıktı: Otsu eşikleme ile ikili bölütleme ve yeşil kontur sınırları çizimi
    _, thresh = cv2.threshold(noisy, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    color_out = cv2.cvtColor(noisy, cv2.COLOR_GRAY2BGR)
    cv2.drawContours(color_out, contours, -1, (0, 255, 0), 2)
    save_png("hafta13_output.png", color_out)

# ----------------------------------------------------------------------
# HAFTA 14: Öznitelik Çıkarımı (cv::ORB Dedektörü ve Zengin Noktalar)
# ----------------------------------------------------------------------
def generate_week14():
    # Girdi: Zengin köşelere sahip dişli, yıldız ve desenli kutu
    img = np.full((300, 400, 3), 230, dtype=np.uint8)
    cv2.rectangle(img, (60, 60), (180, 180), (60, 60, 60), 3)
    cv2.line(img, (60, 60), (180, 180), (60, 60, 60), 2)
    cv2.line(img, (60, 180), (180, 60), (60, 60, 60), 2)
    
    # Yıldız benzeri çokgen
    pts = np.array([[280, 60], [300, 110], [350, 110], [310, 140],
                    [325, 190], [280, 160], [235, 190], [250, 140],
                    [210, 110], [260, 110]], np.int32)
    cv2.polylines(img, [pts], True, (20, 20, 20), 2)
    cv2.fillPoly(img, [pts], (180, 180, 180))
    
    # Izgara dama tahtası deseni
    for y in range(210, 280, 14):
        for x in range(120, 280, 16):
            if ((x // 16) + (y // 14)) % 2 == 0:
                cv2.rectangle(img, (x, y), (x + 16, y + 14), (40, 40, 40), -1)
                
    save_png("hafta14_input.png", img)
    
    # Çıktı: ORB ile anahtar noktaların tespiti ve DRAW_RICH_KEYPOINTS ile çizimi
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(nfeatures=250)
    keypoints, _ = orb.detectAndCompute(gray, None)
    output = cv2.drawKeypoints(img, keypoints, None, color=(0, 0, 255), flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
    save_png("hafta14_output.png", output)

# ----------------------------------------------------------------------
# HAFTA 15: Örüntü Sınıflandırma ve Şablon Eşleme (cv::matchTemplate)
# ----------------------------------------------------------------------
def generate_week15():
    # Girdi: Devre kartı benzeri karmaşık arama sahnesi
    scene = np.full((300, 400, 3), 40, dtype=np.uint8)
    
    # Baskılı devre hatları
    for y in range(40, 280, 35):
        cv2.line(scene, (20, y), (380, y), (50, 120, 60), 2)
    for x in range(50, 380, 45):
        cv2.line(scene, (x, 20), (x, 280), (50, 120, 60), 2)
        
    # Yanıltıcı çipler
    cv2.rectangle(scene, (60, 80), (110, 130), (80, 80, 80), -1)
    cv2.rectangle(scene, (270, 150), (320, 200), (90, 90, 90), -1)
    
    # Hedef özel çip (şablon nesnesi: altın pinli mavi mikrodenetleyici)
    target_x, target_y = 175, 115
    w, h = 60, 60
    cv2.rectangle(scene, (target_x, target_y), (target_x + w, target_y + h), (140, 70, 40), -1)
    cv2.circle(scene, (target_x + 30, target_y + 30), 16, (230, 230, 230), -1)
    cv2.drawMarker(scene, (target_x + 30, target_y + 30), (20, 20, 20), cv2.MARKER_CROSS, 20, 2)
    
    save_png("hafta15_input.png", scene)
    
    # Çıktı: Hedef çipi şablon olarak ara ve bulunan konumu kırmızı kutuyla işaretle
    tpl = scene[target_y:target_y + h, target_x:target_x + w].copy()
    res = cv2.matchTemplate(scene, tpl, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(res)
    
    matched = scene.copy()
    bottom_right = (max_loc[0] + w, max_loc[1] + h)
    cv2.rectangle(matched, max_loc, bottom_right, (0, 0, 255), 3)
    cv2.putText(matched, f"MATCH: {max_val:.2f}", (max_loc[0] - 10, max_loc[1] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
    save_png("hafta15_output.png", matched)

# ----------------------------------------------------------------------
# HAFTA 16: Uçtan Uca Belge Tarayıcı ve Perspektif Düzeltme
# ----------------------------------------------------------------------
def generate_week16():
    # Girdi: Koyu masa üzerinde eğik duran beyaz belge
    scene = np.full((300, 400, 3), (35, 45, 60), dtype=np.uint8) # Koyu ahşap masa
    
    # Masaya ahşap damarları
    for y in range(0, 300, 15):
        cv2.line(scene, (0, y), (400, y), (30, 40, 55), 1)
        
    # Açılı duran 4 köşe (yamuk belge koordinatları)
    doc_pts = np.array([[80, 50], [310, 30], [350, 260], [60, 220]], np.int32)
    cv2.fillPoly(scene, [doc_pts], (235, 235, 235)) # Beyaz belge
    
    # Belge içi sahte metin satırları (açılı)
    pts_lines = [
        ([[100, 80], [290, 65]], 3),
        ([[95, 110], [305, 95]], 2),
        ([[90, 140], [315, 125]], 2),
        ([[85, 170], [325, 155]], 2),
        ([[80, 200], [220, 185]], 2),
    ]
    for (p1, p2), thickness in pts_lines:
        cv2.line(scene, tuple(p1), tuple(p2), (60, 60, 60), thickness)
        
    save_png("hafta16_input.png", scene)
    
    # Çıktı: Belgeyi 4 köşesinden düzeltip 300x400 dik A4 oranına getir ve adaptif eşikle
    src_pts = np.float32([[80, 50], [310, 30], [350, 260], [60, 220]])
    dst_w, dst_h = 300, 400
    dst_pts = np.float32([[0, 0], [dst_w - 1, 0], [dst_w - 1, dst_h - 1], [0, dst_h - 1]])
    
    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    warped = cv2.warpPerspective(scene, M, (dst_w, dst_h))
    warped_gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    scanned = cv2.adaptiveThreshold(warped_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8)
    
    # 400x300 boyutuna sığdırmak için (300, 400) dikey çıktıyı yatay tuvalde ortala
    final_canvas = np.full((300, 400), 40, dtype=np.uint8)
    # Ölçeklendir: 210x280 olarak ortala
    preview = cv2.resize(scanned, (210, 280), interpolation=cv2.INTER_AREA)
    final_canvas[10:290, 95:305] = preview
    
    save_png("hafta16_output.png", final_canvas)

def main():
    print("=" * 60)
    print("EBLG351 Görüntü İşleme: 16 Haftalık Örnek Üretimi Başlıyor...")
    print(f"Çıktı Dizini: {OUT_DIR}")
    print("=" * 60)
    
    generators = [
        generate_week01, generate_week02, generate_week03, generate_week04,
        generate_week05, generate_week06, generate_week07, generate_week08,
        generate_week09, generate_week10, generate_week11, generate_week12,
        generate_week13, generate_week14, generate_week15, generate_week16
    ]
    
    for i, gen in enumerate(generators, 1):
        print(f"\n--- Hafta {i} İşleniyor ---")
        gen()
        
    print("\n" + "=" * 60)
    print("Tüm 16 haftalık girdi ve çıktı görselleri başarıyla üretildi!")
    print("=" * 60)

if __name__ == "__main__":
    main()

