/* BLOOM — Luxury Rose Gold interactions
   - audio control
   - pause bg audio while YouTube iframes play
   - mood tracker with localStorage 14-day history
   - simple print/save hooks
*/

// --- audio toggle
const bgAudio = document.getElementById('bgAudio');
const audioToggle = document.getElementById('audioToggle');

function setAudioStateUI(isPlaying){
  audioToggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  audioToggle.textContent = isPlaying ? '♪' : '♫';
}

audioToggle.addEventListener('click', () => {
  if (bgAudio.paused) {
    bgAudio.play().catch(()=>{}); // play may require user interaction
    setAudioStateUI(true);
  } else {
    bgAudio.pause();
    setAudioStateUI(false);
  }
});

// Start audio on first interaction (user gesture needed by browsers)
document.addEventListener('click', function initPlay(){ 
  if(bgAudio.paused) {
    bgAudio.play().catch(()=>{}); 
    setAudioStateUI(true);
  }
  document.removeEventListener('click', initPlay);
}, { once: true });

// --- YouTube API integration: pause bgAudio when videos play
// Both iframes on the page use ?enablejsapi=1 in URL
let ytPlayers = [];

function onYouTubeIframeAPIReady(){
  const ids = ['scriptureVideo','songVideo'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    ytPlayers.push(new YT.Player(id, {
      events: {
        'onStateChange': function(e){
          // 1 = playing, 2 = paused, 0 = ended
          if(e.data === 1) { // playing
            if(!bgAudio.paused) bgAudio.pause();
          } else if (e.data === 2 || e.data === 0) { // paused or ended
            // resume bg audio gently
            setTimeout(()=> {
              if(bgAudio.paused) {
                bgAudio.play().catch(()=>{});
                setAudioStateUI(true);
              }
            }, 250);
          }
        }
      }
    }));
  });
}

// --- Mood tracker
const moodButtons = document.querySelectorAll('.mood-btn');
const moodResult = document.getElementById('moodResult');
const HISTORY_KEY = 'bloom:moodHistory';

const moodMap = {
  joy: "Your joy is a soft light — contagious and holy.",
  calm: "Calm doesn't mean small; it means steady. Keep breathing.",
  tired: "Rest is holy. Your body and soul are not measures of laziness.",
  anxious: "Anxiety is temporary. You're walking toward clarity — one breath at a time.",
  grateful: "Gratitude changes the shape of a day. Let small thanksgivings grow."
};

function loadHistory(){
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveMoodToHistory(key){
  const hist = loadHistory();
  hist.push({ key, at: new Date().toISOString() });
  // keep last 100 entries (plenty)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-100)));
}
function renderMoodQuote(key){
  const text = moodMap[key] || "Feeling seen.";
  moodResult.style.display = 'block';
  moodResult.textContent = text;
}

moodButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    renderMoodQuote(key);
    saveMoodToHistory(key);
  });
});

// history view / clear handlers
document.getElementById('viewHistory').addEventListener('click', () => {
  const hist = loadHistory();
  if(!hist.length) {
    alert('No mood history yet.');
    return;
  }
  const last14 = hist.slice(-14).reverse();
  const summary = last14.map(h => {
    const d = new Date(h.at);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — ${h.key}`;
  }).join('\n');
  // small modal-like alert; replace with custom UI if desired
  alert('Last moods:\n\n' + summary);
});

document.getElementById('clearHistory').addEventListener('click', () => {
  if(confirm('Clear all local mood history? This cannot be undone.')) {
    localStorage.removeItem(HISTORY_KEY);
    alert('Mood history cleared.');
  }
});

// --- message print/save (simple)
document.getElementById('printMessage').addEventListener('click', () => {
  window.print();
});

document.getElementById('saveMessage').addEventListener('click', () => {
  const content = document.getElementById('customMessage').innerText.trim();
  if(!content) { alert('No message to save.'); return; }
  localStorage.setItem('bloom:favoriteMessage', content);
  alert('Message saved to browser favorites.');
});
