# Adding the Kasheeda font (italic Urdu)

1. Get "Jameel Noori Nastaleeq Kasheeda" (urdufonts.com, search "Kasheeda"). Check its license before committing it to a public repo.
2. Shrink it to a web font (the original is ~13 MB / 19,000 glyphs). Needs `pip install fonttools brotli`:

       pyftsubset JameelNooriNastaleeqKasheeda.ttf \
         --unicodes="U+0020,U+00A0,U+200C,U+200D,U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF" \
         --layout-features='*' --flavor=woff2 --output-file=kasheeda.woff2

3. Put it at `public/fonts/kasheeda.woff2`.
4. Write a note with `*italic urdu*` and adjust `size-adjust` on the "Kasheeda" @font-face in `src/app/globals.css`
   until it matches the size of the normal Urdu around it.

If the file is missing, italic Urdu just falls back to normal Mehr.
