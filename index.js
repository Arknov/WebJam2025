fetch('/api/maps-key')
  .then(res => res.json())
  .then(data => {
    console.log("API key from serverless endpoint:", data.key); // check in console
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initStreetView`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

window.UCI_BOUNDS = {
  north: 33.6535,
  south: 33.6395,
  west: -117.8515,
  east: -117.8335
};

window.getRandomCoord = function() {
  const lat = Math.random() * (window.UCI_BOUNDS.north - window.UCI_BOUNDS.south) + window.UCI_BOUNDS.south;
  const lng = Math.random() * (window.UCI_BOUNDS.east - window.UCI_BOUNDS.west) + window.UCI_BOUNDS.west;
  return { lat, lng };
};

window.newRound = function() {
  window.targetCoord = window.getRandomCoord();
  window.targetLat = window.targetCoord.lat;
  window.targetLng = window.targetCoord.lng;
};
window.newRound();

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


window.currentMarker = null;
window.confirmButton = null;

window.addMarker = function(map, latlng) {
  if (window.currentMarker) {
    map.removeLayer(window.currentMarker);
    if (window.confirmButton) {
      map.getContainer().removeChild(window.confirmButton);
      window.confirmButton = null;
    }
  }

  window.currentMarker = L.marker(latlng).addTo(map).bindPopup("Selected point").openPopup();

  // Create confirm button
  window.confirmButton = document.createElement('button');
  window.confirmButton.innerText = 'Confirm Point';
  window.confirmButton.style.position = 'absolute';
  window.confirmButton.style.top = '10px';
  window.confirmButton.style.left = '50%';
  window.confirmButton.style.transform = 'translateX(-50%)';
  window.confirmButton.style.zIndex = 1000;
  window.confirmButton.style.backgroundColor = 'red';
  window.confirmButton.style.color = 'white';
  window.confirmButton.style.padding = '10px 20px';
  window.confirmButton.style.border = 'none';
  window.confirmButton.style.cursor = 'pointer';
  map.getContainer().appendChild(window.confirmButton);

  window.confirmButton.onclick = function() {
    const d = window.distanceMeters(latlng.lat, latlng.lng, window.targetLat, window.targetLng);
    const score = window.getScore(d);
    alert(`Marker confirmed!\nDistance: ${d.toFixed(1)} meters\nScore: ${score}`);

    // Remove confirm button
    map.getContainer().removeChild(window.confirmButton);
    window.confirmButton = null;
  };
};


window.initStreetView = function() {
  const pano = new google.maps.StreetViewPanorama(
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

  const sv = new google.maps.StreetViewService();
  sv.getPanorama({ location: window.targetCoord, radius: 100 }, (data, status) => {
    if (status === "OK") {
      pano.setPano(data.location.pano);
      pano.setPov({ heading: 100, pitch: 0 });
      pano.setVisible(true);
    } else {
      console.log("No Street View here, retrying...");
    }
  });
};


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
});
