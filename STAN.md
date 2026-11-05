# Portfolio zawodowe — STAN (2026-11-05)

## Założenia (decyzje użytkownika)
- Portfolio ZAWODOWE (świat zawodowy: nazwisko, LinkedIn) — oddzielne od 3EN, bez linków do kanałów i strony 3EN.
- Oba kierunki usług: A (administracja/wsparcie IT, bezpieczeństwo) i B (automatyzacja, lokalne AI).
- Zawartość: przykładowe projekty stron (fikcyjne, bez linków), PhishingInspector i BlokerDanych z linkami do Microsoft Store (nie Google — korekta Claude).

## Stan
- Makieta robocza, NIEOPUBLIKOWANA. Od 2026-11-05 git: prywatne repo https://github.com/3en4all/tmp (gałąź main; commity z `-c user.name=3en4all -c user.email=3en4all@gmail.com`). Docelowo przenieść na konto pod nazwiskiem. `index.html` (jedna strona: hero, usługi, 3 studia przypadków, galeria, proces, stos, kontakt) + `koncepcje\{kancelaria,serwis,gabinet}.html` (miniatury iframe skalowane JS, powiększenie w `<dialog>`).
- 2026-11-05: dodane koncepcje `eventy` (dekoracje, pod zlecenia typu AnnDecor z Useme) i `remonty`. Galeria pokazuje teraz obrazy `koncepcje\img\*.png` (1280×800), kliknięcie otwiera żywy HTML. PNG odświeżać po zmianie koncepcji: Chrome `--headless=new --window-size=1280,800 --screenshot=...` (Edge nie jest zainstalowany).
- Szablon oferty na zlecenia one page: `oferty\SZABLON-useme-onepage.md` (cena 650–700 zł netto, 4–5 dni, 2 rundy poprawek, PNG koncepcji w załączniku).
- 2026-11-05: podstrona `anndecor.html` — tylko 3 PNG wariantów (A ciepła, B wieczorowa, C jasna) z `koncepcje\anndecor\`; bez linku z index. Na górze zamiast nazwiska link LinkedIn (`jacek-grodnicki-0a68a7170`, najnowszy adres z historii strony 3EN); kontakt: 243dom@protonmail.com (decyzja użytkownika — ten sam mail co na stronie 3EN); „Współpraca → Rozmowa” linkuje LinkedIn.
- Sprawdzone: widok telefonu (miniatury, brak przewijania w bok). Desktop niesprawdzony.
- Podgląd: `python -m http.server 8799 --bind 127.0.0.1 --directory E:\glowny3EN4ALL\projekty\portfolio` (port 8765 zajęty przez inny serwer).

## Do zrobienia
1. Placeholdery: `[Imię Nazwisko]`, `[e-mail zawodowy]`, LinkedIn, CV (PDF), efekt BlokerDanych w liczbach.
2. Linki Microsoft Store = `#` „wkrótce” (oba produkty nieopublikowane); działa tylko GitHub PhishingInspectora.
3. Formularz = atrapa (alert) — podłączyć (np. Supabase jak na stronie 3EN, ale osobny projekt/tabela) lub usunąć.
4. Nierozstrzygnięte: nazwa EN „DataBlocker” vs „BlokerDanych”; referencje (brak — sekcja pominięta).
5. Następnie: poprawki tekstu z użytkownikiem → wersja EN → hosting (GitHub Pages pod nazwiskiem, opcjonalnie domena).
