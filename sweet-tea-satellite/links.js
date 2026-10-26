// Campaign labels describe traffic; they do not collect analytics.
const incoming = new URLSearchParams(location.search);
const allowed = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const campaign = Object.fromEntries(allowed.map(key => [key, incoming.get(key)]).filter(([, value]) => value && /^[a-zA-Z0-9_.-]{1,120}$/.test(value)));
const catalog = {"porch-light-goes-out": {"title": "Porch Light Goes Out", "spotify": "https://open.spotify.com/track/5bZQUNRDWtI1Pmm9BlDwT7", "apple": "https://music.apple.com/us/album/porch-light-goes-out/6819980176?i=6819980177", "appleLabel": "Apple Music"}, "hayride-to-nowhere": {"title": "Hayride to Nowhere", "spotify": "https://open.spotify.com/track/7BwHNmDPwtHaADWZeqd8cq", "apple": "https://music.apple.com/us/album/hayride-to-nowhere/6819980176?i=6819980178", "appleLabel": "Apple Music"}, "scarecrow-waltz": {"title": "Scarecrow Waltz", "spotify": "https://open.spotify.com/track/5F7adfazIa5qQbi3yUcv5Y", "apple": "https://music.apple.com/us/album/scarecrow-waltz/6819980176?i=6819980179", "appleLabel": "Apple Music"}, "brown-mountain-lights": {"title": "Brown Mountain Lights", "spotify": "https://open.spotify.com/track/35n16v966SJAPj0fI5nLtx", "apple": "https://music.apple.com/us/album/holler-moon-ep/6819980176", "appleLabel": "Apple Music · EP"}, "dead-mans-honky-tonk": {"title": "Dead Man’s Honky-Tonk", "spotify": "https://open.spotify.com/track/0yDZIvNQv1idNGkipm0hP5", "apple": "https://music.apple.com/us/album/dead-mans-honky-tonk/6819980176?i=6819980181", "appleLabel": "Apple Music"}, "sweet-tea-at-sunrise": {"title": "Sweet Tea at Sunrise", "spotify": "https://open.spotify.com/track/0WKz3bULeba0BTbNx9BQSp", "apple": "https://music.apple.com/us/album/sweet-tea-at-sunrise/6819980176?i=6819980182", "appleLabel": "Apple Music"}};
const slug = Object.hasOwn(catalog, incoming.get('song')) ? incoming.get('song') : 'porch-light-goes-out';
const selected = catalog[slug];
document.querySelector('#featured-title').textContent = selected.title;
document.querySelector('#featured-spotify').href = selected.spotify;
document.querySelector('#featured-apple').href = selected.apple;
document.querySelector('#featured-apple-label').textContent = selected.appleLabel;
document.title = selected.title + ' — Sweet Tea Satellite';
for (const link of document.querySelectorAll('a[data-destination]')) {
  const target = new URL(link.href);
  for (const [key, value] of Object.entries(campaign)) target.searchParams.set(key, value);
  link.href = target.toString();
}
for (const article of document.querySelectorAll('[data-song]')) {
  const active = article.dataset.song === slug;
  article.classList.toggle('featured', active);
  const chooser = article.querySelector('.feature-link');
  const target = new URL(chooser.href);
  for (const [key, value] of Object.entries(campaign)) target.searchParams.set(key, value);
  chooser.href = target.toString();
  if (active) chooser.setAttribute('aria-current', 'true');
}
