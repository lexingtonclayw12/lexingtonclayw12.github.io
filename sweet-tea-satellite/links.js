// Campaign labels travel with outbound links. This script does not collect analytics.
const incoming = new URLSearchParams(location.search);
const allowed = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const campaign = Object.fromEntries(allowed.map(key => [key, incoming.get(key)]).filter(([, value]) => value && value.length <= 120));
for (const link of document.querySelectorAll('a[data-destination]')) {
  const target = new URL(link.href);
  for (const [key, value] of Object.entries(campaign)) target.searchParams.set(key, value);
  link.href = target.toString();
}
// Make a campaign's named track easy to find without changing its destination.
const song = incoming.get('song');
const track = [...document.querySelectorAll('[data-song]')].find(link => link.dataset.song === song);
if (track) track.classList.add('featured');
