# Portfolio zawodowe — STAN (2026-11-08)

Uporządkowany 8.11 (kopia: `D:\Projects\_stan\kopie\portfolio-STAN-20261108-*-przedPorzadkiem.md`).

## Założenia (decyzje użytkownika)
- Portfolio ZAWODOWE (świat zawodowy: nazwisko, LinkedIn). Oddzielenie od 3EN zniesione 2026-11-07 („nie ma co z tym przesadzać”); marka 3EN4ALL dozwolona.
- Oba kierunki usług: A (administracja/wsparcie IT, bezpieczeństwo) i B (automatyzacja, lokalne AI).
- Zawartość: przykładowe projekty stron (fikcyjne, bez linków), PhishingInspector i BlokerDanych z linkami do Microsoft Store (nie Google).

## Stan strony
- OPUBLIKOWANE 2026-11-05 (zgoda użytkownika): publiczne repo https://github.com/3en4all/portfolio , strona https://3en4all.github.io/portfolio/ . Gałąź `main`; commity z `-c user.name=3en4all -c user.email=3en4all@gmail.com`. Docelowo ewentualnie konto pod nazwiskiem.
- `index.html` (jedna strona: hero, usługi, 3 studia przypadków, demo 3D, galeria koncepcji, proces, stos) + `koncepcje\{kancelaria,serwis,gabinet,eventy,remonty}.html`. Galeria pokazuje `koncepcje\img\*.png` (1280×800), kliknięcie otwiera żywy HTML. PNG odświeżać po zmianie koncepcji: Chrome `--headless=new --window-size=1280,800 --screenshot=...` (Edge nie jest zainstalowany).
- Podstrona bez linku w menu: `p/anndecor-xh4sjo/` (3 PNG wariantów A/B/C), tylko dla zleceniodawcy Oferia 1072.
- Ukryte w wersji publicznej: CV, LinkedIn, e-mail, sekcja Kontakt, formularz; linki Store = „wkrótce”; placeholder „Efekt”. Do przywrócenia: LinkedIn `jacek-grodnicki-0a68a7170`, mail 243dom@protonmail.com — wersja z nimi w commicie bfbec39.
- 2026-11-06 OPUBLIKOWANE: sekcja „Demo 3D” (#demo3d) — serwerownia + karta graficzna z idol3D (`js/demo3d.js`, `assets/3d/*.splat` ok. 10 MB, ładowane po kliknięciu). Commity beea3fd, e130414. Pułapka: GitHub Pages podaje gzip z Content-Length mniejszym niż dane → GaussianSplats3D się wykłada; dlatego fetch → blob URL. Po zmianie JS podbić `?v=` w `index.html`.
- Sprawdzone: telefon 375 px (bez przewijania w bok) i desktop (7.11).
- Podgląd: `.claude\launch.json` (konfiguracje `portfolio` 8799, `idol3dPodglad` 8797, `hunyuanPodglad` 8798) albo `python -m http.server 8799 --bind 127.0.0.1 --directory E:\glowny3EN4ALL\projekty\portfolio`.

## Wizualizacje produktów 3D (od 2026-11-07)
**Cel:** PRÓBNE ZLECENIE od briefu do dostawy (przyjęcie → dobór metody → produkcja i korekty → uwagi „klienta” = użytkownik → dostawa GLB/USDZ/strona + test na telefonie → rozliczenie: czas, próby, koszty, w co inwestować). Pilotaż MUSI objąć zmianę po pierwszej prezentacji („zmień etykietę, zachowaj kształt, drugi wariant”). Sprzętu nie kupujemy przed pilotażem. Nie podajemy klientom czasu produkcji.

**Zrobione 7.11 (próbki z obrazów Gemini, `I:\foty\opakowania`, marka 3EN4ALL):**
- idol3D, 3 obiekty × 2 tryby, ok. 2 min/obiekt (`idol3D\generuj-opakowania.ps1`). Wybór po ocenie: butelka REAL (synthetic: czarny pas na bokach), pudełko i saszetka SYNTHETIC (real: zmyślona taśma z tyłu). Tył etykiet zmyślony, przód czytelny.
- Sekcja `#produkty` + `js\produkty3d.js` (karta = zdjęcie + model 3D; jedna przeglądarka naraz; `dispose()` w GaussianSplats3D 0.4.6 rzuca removeChild — przechwycone), `.splat` ok. 7,7 MB każdy. Sprawdzone: desktop, telefon, przełączanie modeli.
- Commit `39195a0` opublikowany 8.11 razem z przebudową (stare modele z napisami są w nim, na stronie już zielona seria).
- Postrzępione napisy to granica modelu idol: 1 mln Gaussianów (31 MB) wygląda tak samo jak 262 tys. (7,8 MB); próg alfa bez znaczenia. Zostajemy przy 262 tys.
- Hunyuan3D-2: na tym komputerze tylko kształt (szare GLB), tekstura przekracza 20 GB RAM; 19:41 bez limitu zawiesił system. Koniec prób tutaj (decyzja użytkownika). Szczegóły: `E:\glowny3EN4ALL\projekty\hunyuan3D\STAN.md`.

**Następne:** zdjęcia prawdziwej butelki z Galaxy (+ film obrotu) → Brush (skan) i parametryczna bryła w Blenderze z etykietą 1:1 → porównanie pełnego kosztu obu. Obrazy Gemini zostają na kolekcję portfolio.

**Materiały dla klienta** (folder `oferty` = nie commitować): formy wejścia (zdjęcia / pliki produkcyjne → Blender, etykieta 1:1 / fizyczny produkt / inne po uzgodnieniu), brief i klauzula: `oferty\produkty3D\ZAMOWIENIE.md`; instrukcja zdjęć: `oferty\produkty3D\INSTRUKCJA-ZDJEC.md`.

**Narzędzia:** idol3D (splat, tylko WWW), Blender (jest), kandydat na siatkę z teksturą: TRELLIS.2 fork StableProjectorz (repo i licencja do sprawdzenia przed propozycją instalacji), Brush (skan z wielu zdjęć). Hunyuan3D-2mv odpada z powodu RAM (licencja wykluczająca UE — użytkownik akceptuje na demo). TripoSR odłożony.

## Przebudowa 2026-11-08 — OPUBLIKOWANA 8.11 (zgoda użytkownika: „jest dobrze publikuj”), commit 41e2388 na `main` (gałąź `przebudowa` = to samo)
- Wzór układu: jsystems.pl/pakiet-AI, kierunek zatwierdzony przez użytkownika: grafit + morski akcent + jasne sekcje, złoto oszczędnie; wycena indywidualna (bez cen).
- Menu: Usługi · Realizacje (podział: Aplikacje / Strony / 3D) · Jak pracuję · Kontakt. Bez liczników.
- Tło CAŁEJ strony (decyzja użytkownika 8.11: na cały ekran, nieruchome przy przewijaniu, obraca się całe, realistyczne): `js/bg3d.js`, canvas `#bg3d` position:fixed. Scena three.js generowana w kodzie: płytka PCB (tekstury canvas: maska, ścieżki fan-out 45°, pady ENIG, przelotki, sitodruk), układ QFP „3EN4ALL” z nóżkami, elementy SMD, elektrolity, LED, światło PBR (RoomEnvironment) + cienie (bez cieni na telefonie), impulsy na ścieżkach; obrót ok. 3 min. Sekcje półprzezroczyste nad tłem (jasne .9, ciemne .62). Importmap ma `three/addons/`. Panel hero rgba .72 + blur. Kolaż prac z hero usunięty; `assets/hero/phishing.webp` zostaje w Realizacjach.
- 8.11 (2): płyta oddalona i rozbudowana (S=128: CPU + 5–8 układów z fan-outami, magistrale, ścieżki zasilania, sloty RAM, listwy goldpin, elektrolity, dławiki, kwarce, LED), maska granatowa z połyskiem (clearcoat). Kolorystyka strony: grafit + granat, akcent niebieski #3d7ff0, złoto oszczędnie. Hero: „szyba” (`.glass`: blur 18px, refleks, przesuwający się odblask). Motyw: dół domyślnie ciemny, przycisk księżyc/słońce w menu, wybór w localStorage `motyw`; menu, hero i „Jak pracuję” zawsze ciemne.
- 8.11 (3): płyta „bez końca” (21 kopii kafla 128 obróconych o 90°·k, grupa `world` się obraca), kamera ok. 1,8× dalej, mgła 130–330, granat nasycony (maska #0a2163, tokeny CSS granatowe). Logo 3EN4ALL: kształt z obrazu użytkownika (3 czworokąty, SVG viewBox `150 65 155 137`) w menu (srebrny gradient) + favicon; na procesorze wytłoczone metalowe logo 3D (ExtrudeGeometry). „Na obu stronach” = jasny i ciemny motyw (użytkownik 8.11); menu jest zawsze ciemne, więc srebrne logo pasuje do obu, favicon niebieski.
- Pudełka do renderu: kierunek Blender — bryła parametryczna + etykiety 1:1 z plików graficznych (płaskie PNG/PDF frontu, tyłu, boków), nie zdjęcia bez liter.
- 8.11 (4): opakowania na stronie podmienione na zieloną serię bez napisów (Gemini 8.11: butelka `brz987`, pudełko z wieczkiem `prvpcs`, saszetka `vclqt8` z `I:oty\opakowania`). idol3D → `idol3D\outputs\opakowania2\{synthetic,real}` (wejście `wejscie\opakowania2`). Wybór: butelka i pudełko REAL, saszetka SYNTHETIC. Tył pudełka zmyślony (zapięcie). Zdjęcia 960 px w `assets/produkty`, splaty w `assets/3d/opakowania` (stare nadpisane; poprzednie są w commicie 39195a0). Pułapka: pętla trybów w `uruchom.ps1` przerywa się na stderr Pythona → uruchamiać przez `.cmd` z `2>&1`.
- Pułapka podglądu: gdy panel przeglądarki jest ukryty, animacje i przejście opacity stoją — oglądać przy widocznym panelu. 5 etapów widocznych + 3 pytania w akordeonie.
- Kontakt: e-mail `jacek.grodnicki@proton.me` (podany przez użytkownika 8.11) przez mailto, LinkedIn `jacek-grodnicki-0a68a7170` — LinkedIn do potwierdzenia przy przeglądzie. Formularz-atrapa usunięty.
- Sprawdzone 8.11: desktop 1280 i telefon 375 (bez przewijania w bok).
- Do decyzji: pasek kontaktowy na dole (po ocenie). `STRATEGIA.md`, `.claude/`, `.gitignore`, `oferty/` celowo nie commitowane (publiczne repo).

## Do zrobienia (strona)
1. Placeholdery: `[Imię Nazwisko]`, `[e-mail zawodowy]`, LinkedIn, CV (PDF), efekt BlokerDanych w liczbach.
2. Linki Microsoft Store = `#` „wkrótce” (oba produkty nieopublikowane); działa tylko GitHub PhishingInspectora.
3. Formularz = atrapa (alert) — podłączyć (np. Supabase, osobny projekt/tabela) lub usunąć. Wezwanie do kontaktu w sekcji produktów nie ma linku (Kontakt ukryty).
4. Nierozstrzygnięte: nazwa EN „DataBlocker” vs „BlokerDanych”; referencje (brak — sekcja pominięta).
5. Następnie: poprawki tekstu z użytkownikiem → wersja EN → hosting (GitHub Pages pod nazwiskiem, opcjonalnie domena). Strategia: `STRATEGIA.md` (kroki 2–7).

## Oferty i zlecenia
- Szablon one page: `oferty\SZABLON-useme-onepage.md` (650–700 zł netto, 4–5 dni, 2 rundy poprawek).
- Useme 5.11: 5 ofert gotowych, NIC nie wysłane — stan i uwagi do każdej: koniec `oferty\USEME-szybkie-20261105.md`. Oferia: `oferty\OFERIA-otwarte-20261105.md`. Praca 6.11: `oferty\LISTY-praca-20261106.md`, `oferty\USEME-automatyzacja-20261106.md`, `oferty\PRACA-zdalna-20261106.md`.
- Pliki ofert są nieśledzone w PUBLICZNYM repo — nie commitować.
