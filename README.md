# Geo B.V. — demo-website

Ongevraagd ontwerpvoorstel voor Geo B.V. (oliehandel en bunkerservice, Barendrecht / Stellendam / Scheveningen).

Losse HTML, CSS en JavaScript zonder framework of buildstap. Tweetalig (Nederlands en Engels) via een
clientside taalswitcher met vertaalbestanden in `i18n/`. Gepubliceerd via GitHub Pages en bewust op
`noindex, nofollow` gezet.

## Structuur

```
index.html          Homepage
diensten.html       Wat Geo B.V. levert
kwaliteit.html      Kwaliteit, certificering en documenten
vestigingen.html    Drie vestigingen en bunkerlocaties
contact.html        Contactgegevens en formulier
privacy.html        Privacyverklaring
404.html            Foutpagina
style.css           Huisstijl blauw, rood en wit
js/script.js        Menu, taalswitcher, tellers, formulier
components/         Header en footer, ingeladen via fetch()
i18n/               nl.json en en.json
assets/images/      Foto's en certificaten, aangeleverd door de klant
```
