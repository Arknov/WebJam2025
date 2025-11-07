// -------------------------
// UCI Random Coordinate Logic
// -------------------------
window.UCI_BOUNDS = { north: 33.6535, south: 33.6395, west: -117.8515, east: -117.8335 };

window.getRandomCoord = function() {
  const lat = Math.random() * (window.UCI_BOUNDS.north - window.UCI_BOUNDS.south) + window.UCI_BOUNDS.south;
  const lng = Math.random() * (window.UCI_BOUNDS.east - window.UCI_BOUNDS.west) + window.UCI_BOUNDS.west;
  return { lat, lng };
};

// -------------------------
// Distance & Scoring
// -------------------------
window.distanceMeters = function(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

window.getScore = function(distance) {
  return Math.round(1000 * Math.exp(-distance / 150));
};

// -------------------------
// Game State
// -------------------------
window.round = 1;
window.maxRounds = 3;
window.totalScore = 0;

// Target coordinates
window.setNewTarget = function() {
  window.targetCoord = window.getRandomCoord();
  window.targetLat = window.targetCoord.lat;
  window.targetLng = window.targetCoord.lng;
};
window.setNewTarget();

// -------------------------
// Leaflet Map Initialization
// -------------------------
const lat = 33.645805, lng = -117.842722;
const map = L.map('map').setView([lat, lng], 16);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Marker logic
window.currentMarker = null;
window.confirmButton = null;
window.actualMarker = null;
window.lineToTarget = null;

map.on('click', function(e) {
  if (window.currentMarker) {
    map.removeLayer(window.currentMarker);
    if (window.confirmButton) {
      map.getContainer().removeChild(window.confirmButton);
      window.confirmButton = null;
    }
  }

  window.currentMarker = L.marker(e.latlng).addTo(map).bindPopup("Selected point").openPopup();

  // Create confirm button
  window.confirmButton = document.createElement('button');
  window.confirmButton.innerText = 'Confirm Point';
  window.confirmButton.className = 'confirm-button';
  window.confirmButton.style.position = 'absolute';
  window.confirmButton.style.top = '10px';
  window.confirmButton.style.left = '50%';
  window.confirmButton.style.transform = 'translateX(-50%)';
  window.confirmButton.style.zIndex = 1000;
  map.getContainer().appendChild(window.confirmButton);

  window.confirmButton.onclick = function() {
    const d = window.distanceMeters(e.latlng.lat, e.latlng.lng, window.targetLat, window.targetLng);
    const score = window.getScore(d);
    window.totalScore += score;

    // Show actual location and line
    if (window.actualMarker) map.removeLayer(window.actualMarker);
    if (window.lineToTarget) map.removeLayer(window.lineToTarget);

    window.actualMarker = L.marker([window.targetLat, window.targetLng])
      .addTo(map)
      .bindPopup("Actual location")
      .openPopup();

    window.lineToTarget = L.polyline([e.latlng, [window.targetLat, window.targetLng]], { color: '#003262' })
      .addTo(map);

    // Remove confirm button
    map.getContainer().removeChild(window.confirmButton);
    window.confirmButton = null;

    // Show score info
    document.getElementById("score-display").innerText =
      `Round ${window.round} Score: ${score} | Total: ${window.totalScore}`;

    if (window.round < window.maxRounds) {
      document.getElementById("next-round-btn").style.display = 'inline-block';
    } else {
      document.getElementById("next-round-btn").style.display = 'none';
      alert(`Game Over! Total Score: ${window.totalScore}`);
    }
  };
});

// -------------------------
// Google Street View
// -------------------------
window.initStreetView = function() {
  window.pano = new google.maps.StreetViewPanorama(
    document.getElementById("street-view"),
    {
      addressControl: false,
      linksControl: false,
      panControl: true,
      enableCloseButton: false,
      clickToGo: false,
      motionTracking: false
    }
  );

  window.sv = new google.maps.StreetViewService();
  window.loadStreetView();
};

window.loadStreetView = function() {
  if (!window.sv || !window.pano) return;
  window.sv.getPanorama({ location: window.targetCoord, radius: 100 }, (data, status) => {
    if (status === "OK") {
      window.pano.setPano(data.location.pano);
      window.pano.setPov({ heading: 100, pitch: 0 });
      window.pano.setVisible(true);
    } else {
      console.log("No Street View here, retrying...");
      window.loadStreetView();
    }
  });
};

// -------------------------
// Next Round
// -------------------------
window.startNextRound = function() {
  window.round++;
  window.setNewTarget();

  if (window.currentMarker) { map.removeLayer(window.currentMarker); window.currentMarker = null; }
  if (window.actualMarker) { map.removeLayer(window.actualMarker); window.actualMarker = null; }
  if (window.lineToTarget) { map.removeLayer(window.lineToTarget); window.lineToTarget = null; }

  document.getElementById("next-round-btn").style.display = 'none';
  window.loadStreetView();
  document.getElementById("score-display").innerText = `Round ${window.round} Score: 0 | Total: ${window.totalScore}`;
};

// -------------------------
// Load Google Maps API securely
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  fetch('/api/maps-key')
    .then(res => res.json())
    .then(data => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initStreetView`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });

  document.getElementById("next-round-btn").onclick = () => {
    window.startNextRound();
  };
});
