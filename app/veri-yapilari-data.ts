import type { DsKind } from "@/app/veri-yapilari-demo";

// EBLG359 Algoritma Analizi: Python veri yapıları ödevleri. Kod ve açıklamalar content/odevler/eblg359/ altındadır.
export interface DsAssignment {
  id: string;
  week: number; // konu grubu numarası
  no: number;
  section: string;
  title: string;
  brief: string;
  done: boolean;
  file: string;
  steps: string[];
  runCommand: string;
  practice: string[];
  output: string; // public/odevler/ altında gerçek terminal çıktısı
  ds: DsKind;
}

export const dsAssignments: DsAssignment[] = [
  {
    id: "ds1", week: 1, no: 1, section: "Dizi", title: "Statik dizi: erişim, ekleme, silme", done: true, file: "dizi_statik.py", ds: "dizi", output: "eblg359/dizi_statik.txt",
    brief: "Sabit kapasiteli bir dizi sınıfı yaz; indeksle erişimin neden O(1), araya ekleme ve silmenin neden O(n) olduğunu adım sayacıyla göster.",
    steps: [
      "Dizi bellekte ardışık durur: i. elemanın adresi `başlangıç + i * boyut`, bu yüzden `getir(i)` tek adımdır.",
      "`sona_ekle` boş yuvaya yazar (1 adım); dolunca `IndexError` verir, çünkü kapasite sabittir.",
      "`araya_ekle(0, x)` önce bütün elemanları bir sağa kaydırır: n eleman = n adım. Silmede tersi geçerli.",
      "`ara(x)` dizi sıralı olmadığı için baştan sona bakar; en kötü durumda n karşılaştırma.",
      "`main` aynı işi n=100 ve n=1000 için sayar; başa eklemede adım sayısı n ile birlikte büyür.",
    ],
    runCommand: "python dizi_statik.py",
    practice: [
      "`sil(i)` için kaydırma sayısının `n - i - 1` olduğunu assert ile doğrula.",
      "Dizi sıralıysa `ara` yerine ikili arama yaz; adım sayısı n=1000 için kaç olur?",
      "Kapasite dolu iken `sona_ekle` çağrısını dene ve hatayı yakala; vector ödevinde bu sorun nasıl çözülüyor?",
    ],
  },
  {
    id: "ds2", week: 1, no: 2, section: "Dizi", title: "Vector: dinamik dizi ve amortize analiz", done: true, file: "vector_dinamik.py", ds: "vector", output: "eblg359/vector_dinamik.txt",
    brief: "Dolunca kapasiteyi iki katına çıkaran dinamik dizi yaz; tek eklemenin bazen O(n), ortalamasının O(1) olduğunu kopya sayısıyla kanıtla.",
    steps: [
      "Kapasite 1'den başlar. Dizi dolunca yeni (2 katı) bir dizi açılır ve eski elemanlar kopyalanır.",
      "n eleman eklenirken toplam kopya `1 + 2 + 4 + ... < 2n`; bölüşülünce eleman başına O(1) amortize.",
      "Kapasiteyi her seferinde +1 artırırsak toplam kopya `1 + 2 + ... + n = n(n-1)/2`, yani O(n²).",
      "Python `list`, C++ `std::vector` ve Java `ArrayList` bu stratejiyi (çarpan 1.5-2) kullanır.",
    ],
    runCommand: "python vector_dinamik.py",
    practice: [
      "Büyüme çarpanını 2 yerine 1.5 yap; toplam kopya ve boşa giden kapasite nasıl değişiyor?",
      "Eleman silince kapasitenin yarısı boşalırsa küçültmeyi ekle. Ne zaman küçültmek 'thrashing' yaratır?",
      "Toplam kopya < 2n eşitsizliğini muhasebe yöntemiyle kâğıtta ispatla.",
    ],
  },
  {
    id: "ds3", week: 2, no: 1, section: "Bağlı liste", title: "Tek bağlı liste", done: true, file: "bagli_liste_tek.py", ds: "liste1", output: "eblg359/bagli_liste_tek.txt",
    brief: "Düğümleri işaretçiyle bağlayan tek yönlü listeyi yaz: başa/sona ekleme, arama, silme ve yerinde ters çevirme.",
    steps: [
      "Her `Dugum` bir değer ve bir `sonraki` işaretçisi taşır; liste yalnız `bas` ve `son` işaretçilerini bilir.",
      "`basa_ekle` ve `sona_ekle` (son işaretçisiyle) O(1); araya yürümek gerekmez.",
      "`ara` ve `sil(deger)` baştan düğüm düğüm yürür: O(n). Silmek için önceki düğüme de ihtiyaç var.",
      "`ters_cevir` üç işaretçiyle (önceki, şimdiki, sonraki) yerinde çalışır: O(n) zaman, O(1) ek bellek.",
      "Kenar durumlar: boş liste, tek eleman, baş ve son silme `son` işaretçisini bozabilir.",
    ],
    runCommand: "python bagli_liste_tek.py",
    practice: [
      "Listenin ortasındaki düğümü bul (yavaş-hızlı işaretçi, tek geçiş).",
      "Listede döngü var mı? Floyd'un tavşan-kaplumbağa yöntemiyle `dongu_var_mi` yaz.",
      "`ters_cevir`'i özyinelemeli yaz ve yığın derinliğinin O(n) olduğunu açıkla.",
    ],
  },
  {
    id: "ds4", week: 2, no: 2, section: "Bağlı liste", title: "Çift bağlı liste ve nöbetçi düğüm", done: true, file: "bagli_liste_cift.py", ds: "liste2", output: "eblg359/bagli_liste_cift.txt",
    brief: "Önceki ve sonraki işaretçili listeyi nöbetçi düğümlerle yaz; elindeki düğümü O(1) silmenin tek bağlı listeden farkını ölç.",
    steps: [
      "Her düğümde `onceki` ve `sonraki` var; iki uçtaki nöbetçi (sentinel) düğümler boş liste ve uç durumlarını ortadan kaldırır.",
      "`dugumu_sil(dugum)`: komşuların işaretçilerini birbirine bağlamak yeter, arama gerekmez: O(1).",
      "Tek bağlı listede aynı işlem önceki düğümü bulmak için O(n) yürümek ister; bedel: düğüm başına fazladan bir işaretçi.",
      "`sondan_basa_listele` önceki işaretçilerle geriye yürür; tek bağlı listede bu yoktur.",
    ],
    runCommand: "python bagli_liste_cift.py",
    practice: [
      "LRU önbelleği yaz: sözlük + çift bağlı liste ile `al` ve `koy` O(1) olsun.",
      "`araya_ekle(dugum, deger)` ile sıralı bir liste tut (insertion sort) ve maliyetini analiz et.",
      "Nöbetçisiz sürümü yaz; kaç ek `if` gerekiyor?",
    ],
  },
  {
    id: "ds5", week: 3, no: 1, section: "Yığın / Kuyruk", title: "Yığın (stack) ve uygulamaları", done: true, file: "yigin_stack.py", ds: "yigin", output: "eblg359/yigin_stack.txt",
    brief: "LIFO yığını yaz; parantez denetimi ve sonek (postfix) ifade hesabıyla gerçek kullanımını gör.",
    steps: [
      "Yığın yalnız tepeden erişir: `it` (push), `cik` (pop), `tepe` (peek); hepsi O(1).",
      "Dinamik dizinin sonu tepedir: sonuna ekleme/çıkarma ucuz olduğu için dizi ile yığın doğal eşleşir.",
      "Parantez denetimi: açan parantezi it, kapanan gelince tepeyle eşleştir; sonunda yığın boş olmalı.",
      "Sonek hesabı: sayıyı it, operatör gelince iki sayıyı çıkarıp sonucu geri it. Yığın, işlem öncelik kuralını gereksiz kılar.",
      "Bu yapı çağrı yığını (özyineleme), geri al (undo) ve derinlik öncelikli aramanın (DFS) temelidir.",
    ],
    runCommand: "python yigin_stack.py",
    practice: [
      "Ara-ek (infix) ifadeyi sonek biçime çeviren shunting-yard algoritmasını yaz.",
      "`en_kucuk()` O(1) olan bir yığın tasarla (ikinci yardımcı yığınla).",
      "Bir metni yığınla ters çevir; sonra aynısını özyinelemeyle yap, ikisi arasındaki ilişkiyi açıkla.",
    ],
  },
  {
    id: "ds6", week: 3, no: 2, section: "Yığın / Kuyruk", title: "Dairesel kuyruk (circular queue)", done: true, file: "kuyruk_dairesel.py", ds: "kuyruk1", output: "eblg359/kuyruk_dairesel.txt",
    brief: "Sabit dizi üzerinde modulo ile başa saran kuyruk yaz; kaydırmasız FIFO'nun neden O(1) olduğunu göster.",
    steps: [
      "`bas` çıkış yerini, `boy` eleman sayısını tutar; ekleme indeksi `(bas + boy) % kapasite`.",
      "Çıkarmada elemanlar kaydırılmaz, yalnız `bas` bir ilerler: hem ekleme hem çıkarma O(1).",
      "Dolu/boş ayrımı `boy` sayacıyla yapılır; yalnız bas ve son indeksine bakmak ikisini karıştırır.",
      "Karşılaştırma: `list.pop(0)` ile kuyruk her çıkarmada n-1 kaydırma yapar, O(n).",
    ],
    runCommand: "python kuyruk_dairesel.py",
    practice: [
      "`boy` alanını kaldır, bir yuva boş bırakarak dolu/boş ayrımını yap; neden bir yuva feda edilir?",
      "Kapasite dolunca vector gibi iki katına büyüyen dairesel kuyruk yaz.",
      "Kuyrukla BFS (genişlik öncelikli arama) yaz: komşuluk listesi ver, ziyaret sırasını yazdır.",
    ],
  },
  {
    id: "ds7", week: 3, no: 3, section: "Yığın / Kuyruk", title: "İki yığınla kuyruk", done: true, file: "kuyruk_iki_yigin.py", ds: "kuyruk2", output: "eblg359/kuyruk_iki_yigin.txt",
    brief: "İki yığından FIFO kuyruk kur; tek çıkarmanın O(n) olabildiğini ama amortize O(1) kaldığını kanıtla.",
    steps: [
      "Ekleme `gelen` yığınına gider. Çıkarma `giden` yığınından yapılır.",
      "`giden` boşsa `gelen` tamamen ters çevrilerek `giden`'e aktarılır; böylece ilk giren üste gelir.",
      "Her eleman yaşamı boyunca en fazla bir kez aktarıldığı için n işlemde toplam aktarım ≤ n: amortize O(1).",
      "En kötü tek çıkarma O(n) olur; amortize analiz ortalamayı garanti eder, tek işlemin süresini değil.",
    ],
    runCommand: "python kuyruk_iki_yigin.py",
    practice: [
      "Tersini yap: iki kuyrukla yığın kur. Hangi işlem pahalı olur (push mı pop mu)?",
      "Muhasebe yöntemiyle ispat: her eklemeye 2 jeton ver; neden yetiyor?",
      "Her çıkarmadan sonra `aktarim <= eklenen` eşitsizliğini döngü içinde assert et.",
    ],
  },
  {
    id: "ds8", week: 4, no: 1, section: "Hash / Ağaç", title: "Hash tablosu (zincirleme)", done: true, file: "hash_tablosu.py", ds: "hash", output: "eblg359/hash_tablosu.txt",
    brief: "Zincirleme çakışma çözümlü hash tablosu yaz; yük oranının aramanın beklenen maliyetini nasıl belirlediğini ölç.",
    steps: [
      "Anahtar bir sayıya çevrilir (polinom hash), `% kova_sayısı` ile kovaya düşer.",
      "Çakışan anahtarlar aynı kovanın zincirinde saklanır; arama zincirdeki elemanları tek tek karşılaştırır.",
      "Yük oranı `α = n / m`. Basit düzgün hash varsayımıyla başarılı arama beklenen `1 + α/2`, başarısız arama `1 + α` karşılaştırmadır.",
      "α > 0.75 olunca kova sayısı ikiye katlanıp tüm anahtarlar yeniden hash edilir: nadir pahalı, amortize O(1).",
    ],
    runCommand: "python hash_tablosu.py",
    practice: [
      "Zincirleme yerine açık adresleme (doğrusal yoklama) yaz; silme neden 'mezar taşı' ister?",
      "Kötü bir hash fonksiyonu seç (hep 0 döndür) ve aramanın O(n)'e çöktüğünü ölç.",
      "Python `dict` ile bu sınıfın 100000 ekleme/arama süresini karşılaştır.",
    ],
  },
  {
    id: "ds9", week: 4, no: 2, section: "Hash / Ağaç", title: "İkili yığın (min-heap)", done: true, file: "ikili_yigin_heap.py", ds: "heap", output: "eblg359/ikili_yigin_heap.txt",
    brief: "Dizi tabanlı min-heap yaz; ekleme/çıkarmanın O(log n), listeden kurmanın O(n) olduğunu sayaçla göster.",
    steps: [
      "Tam ikili ağaç dizide durur: ebeveyn `(i-1)//2`, çocuklar `2i+1` ve `2i+2`; işaretçi gerekmez.",
      "Heap özelliği: her düğüm çocuklarından küçük/eşit; en küçük eleman her zaman `a[0]`.",
      "`ekle` sona koyup yukarı sızdırır, `en_kucuk_cikar` son elemanı köke koyup aşağı sızdırır: en çok ağaç yüksekliği (log n) adım.",
      "`listeden_kur` aşağıdan yukarı sızdırır (Floyd): çoğu düğüm yaprağa yakın olduğundan toplam O(n).",
      "Heap sıralama: önce kur O(n), sonra n kez çıkar O(n log n).",
    ],
    runCommand: "python ikili_yigin_heap.py",
    practice: [
      "Max-heap yap ve öncelik kuyruğu (priority queue) olarak kullan: en büyük görevi önce çıkar.",
      "Bir listedeki k. en büyük elemanı boyutu k olan min-heap ile bul: O(n log k).",
      "Neden `listeden_kur` O(n log n) değil O(n)? `Σ h/2^h` toplamıyla kâğıtta göster.",
    ],
  },
  {
    id: "ds10", week: 4, no: 3, section: "Hash / Ağaç", title: "İkili arama ağacı (BST)", done: true, file: "ikili_arama_agaci.py", ds: "bst", output: "eblg359/ikili_arama_agaci.txt",
    brief: "BST'ye ekleme, arama ve inorder dolaşım yaz; sıralı eklemede ağacın bağlı listeye dejenere olmasını göster.",
    steps: [
      "Kural: sol alt ağaç < düğüm < sağ alt ağaç; ekleme ve arama kökten başlayıp her adımda bir yöne iner.",
      "Maliyet ağacın yüksekliği `h` kadar: dengeli ağaçta h ≈ log n, sıralı eklemede h = n.",
      "Inorder (sol, kök, sağ) dolaşım anahtarları sıralı verir: ağaçla sıralama O(n log n) ortalama.",
      "AVL ve kırmızı-siyah ağaçlar yüksekliği O(log n) tutmak için dönme yapar; bu ödevde dengeleme yok.",
    ],
    runCommand: "python ikili_arama_agaci.py",
    practice: [
      "Düğüm silme ekle (0, 1 ve 2 çocuklu üç durum) ve ardıl (successor) düğümü kullan.",
      "Her düğümün alt ağaç boyutunu tut; k. küçük elemanı O(h) bul.",
      "100 rastgele anahtar ekle ve ortalama yüksekliği log2(100) ≈ 6,6 ile karşılaştır.",
    ],
  },
  {
    id: "ds11", week: 5, no: 1, section: "Karşılaştırma", title: "Hepsini yarıştır: hangi yapı ne zaman?", done: true, file: "karsilastirma.py", ds: "karsilastirma", output: "eblg359/karsilastirma.txt",
    brief: "list, bağlı liste ve deque'i başa/sona ekleme işinde yarıştır; sayaçla O()'yu, kronometreyle gerçek süreyi karşılaştır.",
    steps: [
      "Aynı iş üç yapıda: n eleman başa ve sona ekleme. `list.insert(0)` n(n-1)/2 kaydırma yapar (O(n²)).",
      "Bağlı liste ve `deque` iki ucu da O(1) ile ekler; toplam n adım.",
      "Sayaç tablosu deterministiktir; süre tablosu makineye ve önbelleğe bağlıdır, assert yalnız sayaçta tutulur.",
      "Seçim kuralı: sıra ve indeks → dizi; uçlarda sık ekleme → deque/liste; anahtarla arama → hash; sıralı veya en küçük → BST/heap.",
    ],
    runCommand: "python karsilastirma.py",
    practice: [
      "Ortaya ekleme/silme işi için tabloyu genişlet: hangi yapı ne kadar adım yer?",
      "n=100000'de `list.insert(0)` süresini ölç; formülle tahmin edilen 4 kat artışla uyuşuyor mu?",
      "Her yapı için 'en çok bunu seç' tek cümle yaz; sonra yanlış seçimin bedelini sayıyla göster.",
    ],
  },
];
