'use strict';
const $ = id => document.getElementById(id);
const audio = $('audio');
const video = $('video');
let songs = [], selected = 0, porchMode = false, lastVolume = 0.22;
audio.volume = 0.22;
const format = seconds => Number.isFinite(seconds) ? Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0') : '–:––';
const message = text => { $('status').textContent = text; };
function sync() {
 const playing = !audio.paused && !audio.ended;
 $('play').textContent = playing ? '❚❚' : '▶';
 $('play').setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + (songs[selected]?.title || 'selected song'));
 $('elapsed').textContent = format(audio.currentTime);
 $('duration').textContent = format(audio.duration);
 $('seek').disabled = !Number.isFinite(audio.duration) || audio.duration <= 0;
 $('seek').value = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
 $('seek').setAttribute('aria-valuetext', format(audio.currentTime) + ' of ' + format(audio.duration));
 $('porch').setAttribute('aria-pressed', String(porchMode && playing));
 $('porch').textContent = porchMode && playing ? '❚❚ Pause the porch music' : '♫ Turn on the porch music';
 if (porchMode) $('porch-note').textContent = playing ? 'Sweet Tea at Sunrise · playing softly on repeat. Adjust the volume below.' : 'Porch music paused. Press the button to start again.';
 else $('porch-note').textContent = 'A little “Sweet Tea at Sunrise,” low and slow.';
}
function volumeSync() {
 $('volume').value = audio.volume;
 $('volume-value').textContent = audio.muted ? 'Muted' : Math.round(audio.volume * 100) + '%';
 $('mute').textContent = audio.muted ? '⊘' : '♫';
 $('mute').setAttribute('aria-pressed', String(audio.muted));
 $('mute').setAttribute('aria-label', audio.muted ? 'Unmute audio' : 'Mute audio');
}
function select(index, porch = false) {
 audio.pause();
 selected = (index + songs.length) % songs.length;
 porchMode = porch;
 audio.loop = porch;
 const song = songs[selected];
 audio.src = song.audio;
 $('listening-title').textContent = song.title;
 $('player-label').textContent = porch ? 'ON THE PORCH · LOW & SLOW' : song.label.toUpperCase();
 $('player-art').src = song.art;
 $('spotify').href = song.spotify;
 $('apple').href = song.apple;
 $('apple').textContent = song.appleLabel + ' ↗';
 document.querySelectorAll('.release').forEach((node, i) => node.classList.toggle('active', i === selected));
 message('Ready to play · ' + song.title);
 sync();
}
async function play() {
 if (!songs.length) return;
 video.pause();
 const title = songs[selected].title;
 try {
  await audio.play();
  message('Now playing · ' + title);
 } catch (error) {
  if (error.name === 'AbortError') return;
  message(error.name === 'NotAllowedError' ? 'Your browser needs a click on Play to start the music.' : 'This song could not load. Try again or listen with the Spotify and Apple Music links.');
  sync();
 }
}
$('play').onclick = () => audio.paused ? play() : audio.pause();
$('previous').onclick = () => { if (songs.length) { select(selected - 1); play(); } };
$('next').onclick = () => { if (songs.length) { select(selected + 1); play(); } };
$('seek').oninput = event => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value) / 100 * audio.duration; sync(); };
$('volume').oninput = event => { audio.volume = Number(event.target.value); audio.muted = audio.volume === 0; if (audio.volume) lastVolume = audio.volume; };
$('mute').onclick = () => { if (audio.volume === 0) audio.volume = lastVolume; audio.muted = !audio.muted; };
$('porch').onclick = () => {
 if (!songs.length) return;
 if (porchMode && !audio.paused) { audio.pause(); return; }
 select(songs.findIndex(song => song.slug === 'sweet-tea-at-sunrise'), true);
 audio.volume = 0.16; audio.muted = false;
 $('porch-note').textContent = 'Sweet Tea at Sunrise · playing softly on repeat. Adjust the volume below.';
 play();
};
['play','pause','timeupdate','loadedmetadata','durationchange','emptied','ended'].forEach(event => audio.addEventListener(event, sync));
audio.addEventListener('volumechange', volumeSync);
audio.addEventListener('pause', () => { if (!audio.ended) message('Paused · ' + (songs[selected]?.title || '')); });
audio.addEventListener('error', () => message('The audio could not load. Please try again or use the streaming links.'));
audio.addEventListener('ended', () => { if (!porchMode) { select(selected + 1); play(); } });
video.addEventListener('play', () => audio.pause());
video.addEventListener('error', () => { $('video-description').textContent = 'The video could not load. You can still hear Sweet Tea at Sunrise in the music player above.'; });
$('watch').onclick = async () => { audio.pause(); video.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'center'}); video.focus(); try { await video.play(); } catch { $('video-description').textContent = 'Use the video’s Play control to begin. The song is also available in the music player.'; } };
const closeMenu = () => { $('navigation').classList.remove('open'); $('menu').setAttribute('aria-expanded','false'); };
$('menu').onclick = () => { const open = $('navigation').classList.toggle('open'); $('menu').setAttribute('aria-expanded', String(open)); };
document.querySelectorAll('#navigation a').forEach(link => link.addEventListener('click',closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('navigation').classList.contains('open')) { closeMenu(); $('menu').focus(); } });
$('year').textContent = new Date().getFullYear();
async function init() {
 ['play','previous','next','porch'].forEach(id => { $(id).disabled = true; });
 try {
  const response = await fetch('catalog.json');
  if (!response.ok) throw new Error('Catalog unavailable');
  songs = await response.json();
  for (const [index,song] of songs.entries()) {
   const article = document.createElement('article'); article.className = 'release';
   const button = document.createElement('button'); button.setAttribute('aria-label','Play ' + song.title);
   const image = document.createElement('img'); image.src = song.art; image.alt = ''; image.width = 640; image.height = 640; image.loading = 'lazy';
   const icon = document.createElement('span'); icon.className='record-play'; icon.textContent='▶'; icon.setAttribute('aria-hidden','true');
   button.append(image,icon); button.onclick = () => { select(index); play(); };
   const h3 = document.createElement('h3'); h3.textContent=song.title;
   const p = document.createElement('p'); p.textContent=song.label;
   const services = document.createElement('div'); services.className='services';
   for (const [name,url] of [['Spotify',song.spotify],[song.appleLabel,song.apple]]) { const link=document.createElement('a');link.href=url;link.textContent=name+' ↗';link.target='_blank';link.rel='noopener';link.setAttribute('aria-label', song.title+' on '+name);services.append(link); }
   article.append(button,h3,p,services); $('releases').append(article);
  }
  select(0);
  message('Press play. Make yourself at home.');
  ['play','previous','next','porch'].forEach(id => { $(id).disabled = false; });
 } catch { message('The song list could not load. Listen using the Spotify and Apple Music links, or reload to try again.'); }
 volumeSync();
}
init();

// Match the glow overlay to the photograph's object-fit: cover crop.
const hero = $('home');
const lightLayer = hero.querySelector('.hero-lights');
function alignPorchLights() {
 const photo = hero.querySelector('.hero-photo');
 const width = hero.clientWidth, height = hero.clientHeight;
 const scale = Math.max(width / 1672, height / 941);
 const position = parseFloat(getComputedStyle(photo).objectPosition) / 100;
 const cropWidth = width / scale, cropHeight = height / scale;
 lightLayer.setAttribute('viewBox', [(1672 - cropWidth) * position, (941 - cropHeight) / 2, cropWidth, cropHeight].join(' '));
}
new ResizeObserver(alignPorchLights).observe(hero);
alignPorchLights();
$('light-toggle').onclick = () => {
 const paused = hero.classList.toggle('lights-paused');
 $('light-toggle').setAttribute('aria-pressed', String(paused));
 $('light-toggle').textContent = paused ? 'Resume cabin animation' : 'Pause cabin animation';
};
