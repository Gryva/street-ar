<h1 align="center">Urban Scout</h1>

<p align="center">
  <img src="./logo.svg" alt="Urban Scout logo" width="220" />
</p>

<p align="center">
  Web AR aplikacija za otkrivanje i mapiranje uličnih vizuala.
</p>

<hr />

<h2>Opis</h2>
<p>
  Urban Scout je web aplikacija koja koristi AR skeniranje (MindAR + A‑Frame)
  i geolokaciju kako bi korisnici mogli:
</p>
<ul>
  <li>skenirati postojeće ulične radove i vidjeti detalje u AR‑u</li>
  <li>slikati nove radove i spremiti ih kao draft</li>
  <li>dovršiti draftove i poslati radove na moderaciju</li>
  <li>pregledati vlastite radove (draft, pending, approved)</li>
  <li>vidjeti odobrene radove na interaktivnoj karti</li>
</ul>

<h2>Demo</h2>
<p>
  GitHub Pages: 
  <code>https://&lt;tvogithub&gt;.github.io/urban-scout/</code>
</p>

<h2>Glavne stranice</h2>
<ul>
  <li><code>index.html</code> – onboarding, unos korisničkog imena</li>
  <li><code>scan.html</code> – AR skeniranje + slikanje i kreiranje drafta</li>
  <li><code>submit.html</code> – unos/uređivanje rada, slanje na moderaciju</li>
  <li><code>my-entries.html</code> – popis draft/pending/approved radova korisnika</li>
  <li><code>map.html</code> – mapa s odobrenim radovima i popup detaljima</li>
  <li><code>detail.html</code> – detalji pojedinog rada</li>
</ul>

<h2>Tehnologije</h2>
<ul>
  <li>A‑Frame + MindAR (AR skeniranje)</li>
  <li>Leaflet (interaktivna karta)</li>
  <li>Supabase (Auth, baza, storage)</li>
  <li>Vanilla HTML/CSS/JS</li>
</ul>

<h2>Pokretanje lokalno</h2>
<ol>
  <li>Postavi Supabase URL i anon key u <code>auth.js</code>.</li>
  <li>Pokreni lokalni server (npr. Python):<br />
    <code>python -m http.server 8000</code>
  </li>
  <li>Otvori <code>http://localhost:8000/index.html</code> u browseru.</li>
</ol>
