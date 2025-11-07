// audio-controller.js
(function() {
  // Check if audio element already exists
  let audio = document.getElementById('bgAudio');
  
  if (!audio) {
    // Create audio element if it doesn't exist
    audio = document.createElement('audio');
    audio.id = 'bgAudio';
    audio.src = 'your-audio.mp3';  // ← CHANGE THIS to your real audio file!
    audio.loop = true;
    document.body.appendChild(audio);
  }
  
  // Load saved volume from localStorage
  let savedVolume = localStorage.getItem('siteVolume');
  if (savedVolume !== null) {
    audio.volume = parseFloat(savedVolume);
  } else {
    audio.volume = 1;
  }
  
  // Auto-start music on first user interaction
  let hasStarted = false;
  function startAudio() {
    if (!hasStarted) {
      audio.play().catch(e => console.log('Autoplay prevented:', e));
      hasStarted = true;
    }
  }
  
  // Try to start on any user interaction
  document.addEventListener('click', startAudio, { once: true });
  document.addEventListener('keydown', startAudio, { once: true });
  document.addEventListener('touchstart', startAudio, { once: true });
  
  // Listen for volume changes from other pages
  window.addEventListener('storage', function(e) {
    if (e.key === 'siteVolume' && e.newValue !== null) {
      audio.volume = parseFloat(e.newValue);
    }
  });
  
  // Expose audio element globally so other scripts can access it
  window.siteAudio = audio;
  
  // ADD THIS: Log when audio is ready for debugging
  console.log('Audio controller loaded. Audio element:', audio);
})();
