// audio.js — shared dynamic audio for all pages
let audio = window.bgAudio;

if (!audio) {
    audio = new Audio("your-audio.mp3");
    audio.loop = true;
    window.bgAudio = audio; 
}


const savedVolume = localStorage.getItem("siteVolume");
audio.volume = savedVolume ? parseFloat(savedVolume) : 1;

if (!window.__audioInitialized) {
    document.addEventListener("click", () => {
        audio.play().catch(err => console.log("Autoplay blocked:", err));
    }, { once: true });

    window.__audioInitialized = true;
}
