"use strict";


// =====================================
// SERVICE WORKER
// =====================================

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("service-worker.js")
      .catch(error => {

        console.error(
          "Service Worker registration failed:",
          error
        );

      });

  });

}


// =====================================
// ELEMENTS
// =====================================

const list =
  document.getElementById("data-list");

const input1 =
  document.getElementById("input1");

const note =
  document.getElementById("myInput");

const saveButton =
  document.getElementById("myButton");

const locationButton =
  document.getElementById("alertBtn");
const locationButton =
  document.getElementById("alertBtn");


// =====================================
// MAP
// =====================================

const map = L.map("map").setView(
  [41.7151, 44.8271],
  13
);

L.tileLayer(
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      "&copy; OpenStreetMap contributors"
  }
).addTo(map);

let pulseMarker = null;


// =====================================
// STORAGE
// =====================================

function saveList() {

  const data = [];

  list
    .querySelectorAll("li")
    .forEach(li => {

      const textElement =
        li.querySelector(".item-text");

      data.push({
        text: textElement
          ? textElement.textContent
          : "",

        coords:
          li.dataset.coords || ""
      });

    });

  localStorage.setItem(
    "savefoun",
    JSON.stringify(data)
  );

}


function loadList() {

  let data = [];

  try {

    data = JSON.parse(
      localStorage.getItem("savefoun") || "[]"
    );

  } catch (error) {

    console.error(
      "Saved data could not be read:",
      error
    );

    data = [];

  }

  if (!Array.isArray(data)) {
    return;
  }

  data.forEach(item => {

    addItem(
      String(item.text || ""),
      String(item.coords || "")
    );

  });

}


// =====================================
// COORDINATES
// =====================================

function parseCoordinates(coords) {

  const parts = coords
    .split(",")
    .map(value => Number(value.trim()));

  if (parts.length !== 2) {
    return null;
  }

  const lat = parts[0];
  const lon = parts[1];

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }

  if (
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  return {
    lat,
    lon
  };

}


// =====================================
// SHOW POINT ON MAP
// =====================================

function showPulse(lat, lon) {

  lat = Number(lat);
  lon = Number(lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return;
  }

  if (pulseMarker) {
    map.removeLayer(pulseMarker);
  }

  const divIcon = L.divIcon({
    className: "",
    html:
      '<div class="pulse-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  pulseMarker = L.marker(
    [lat, lon],
    {
      icon: divIcon
    }
  ).addTo(map);

  map.setView(
    [lat, lon],
    15
  );

}


// =====================================
// OPEN GOOGLE MAPS
// =====================================

function openGoogleMaps(coords) {

  const point =
    parseCoordinates(coords);

  if (!point) {
    return;
  }

  const url =
    "https://www.google.com/maps/dir/" +
    "?api=1" +
    `&destination=${point.lat},${point.lon}`;

  window.open(
    url,
    "_blank",
    "noopener"
  );

}


// =====================================
// SHARE
// =====================================

async function shareItem(
  text,
  coords
) {

  let message = text;

  const point =
    parseCoordinates(coords);

  if (point) {

    const link =
      "https://maps.google.com/" +
      `?q=${point.lat},${point.lon}`;

    message =
      `${link}\n${text}`;

  }

  try {

    if (navigator.share) {

      await navigator.share({
        title: "fix pin",
        text: message
      });

      return;
    }

    if (navigator.clipboard) {

      await navigator.clipboard.writeText(
        message
      );

      alert("Link copied!");

      return;
    }

    alert(message);

  } catch (error) {

    if (error.name !== "AbortError") {

      console.error(
        "Share failed:",
        error
      );

    }

  }

}


// =====================================
// ADD ITEM
// =====================================

function addItem(
  text,
  coords = ""
) {

  const li =
    document.createElement("li");

  li.dataset.coords = coords;

  const left =
    document.createElement("div");

  left.className = "left";

  const textElement =
    document.createElement("span");

  textElement.className =
    "item-text";

  textElement.textContent = text;

  left.appendChild(textElement);


  // GOOGLE MAPS BUTTON

  if (parseCoordinates(coords)) {

    const mapButton =
      document.createElement("button");

    mapButton.type = "button";

    mapButton.className =
      "mini map-inline";

    mapButton.textContent = "⦿";

    mapButton.setAttribute(
      "aria-label",
      "Open in Google Maps"
    );

    mapButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        openGoogleMaps(coords);

      }
    );

    left.appendChild(mapButton);

  }


  // SHARE BUTTON

  const shareButton =
    document.createElement("button");

  shareButton.type = "button";

  shareButton.className =
    "mini share-btn";

  shareButton.textContent = "🔗";

  shareButton.setAttribute(
    "aria-label",
    "Share point"
  );

  shareButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      shareItem(
        text,
        coords
      );

    }
  );


  // DELETE BUTTON

  const deleteButton =
    document.createElement("button");

  deleteButton.type = "button";

  deleteButton.className =
    "mini del-btn";

  deleteButton.textContent = "✖";

  deleteButton.setAttribute(
    "aria-label",
    "Delete point"
  );

  deleteButton.addEventListener(
    "click",
    () => {

      li.remove();

      saveList();

    }
  );


  li.appendChild(left);
  li.appendChild(shareButton);
  li.appendChild(deleteButton);

  list.appendChild(li);

}


// =====================================
// SAVE BUTTON
// =====================================

saveButton.addEventListener(
  "click",
  () => {

    const text =
      note.value.trim();

    const coords =
      input1.value.trim();

    if (!text) {

      alert("Write a note");

      note.focus();

      return;
    }

    if (
      coords &&
      !parseCoordinates(coords)
    ) {

      alert("Invalid coordinates");

      input1.focus();

      return;
    }

    addItem(
      text,
      coords
    );

    note.value = "";
    input1.value = "";

    saveList();

  }
);


// =====================================
// GEOLOCATION
// =====================================

locationButton.addEventListener(
  "click",
  () => {

    if (!navigator.geolocation) {

      alert(
        "Geolocation is not supported"
      );

      return;
    }

    locationButton.disabled = true;
    locationButton.textContent = "…";

    navigator.geolocation
      .getCurrentPosition(

        position => {

          const lat =
            position.coords.latitude
              .toFixed(6);

          const lon =
            position.coords.longitude
              .toFixed(6);

          input1.value =
            `${lat},${lon}`;

          showPulse(
            lat,
            lon
          );

          locationButton.disabled =
            false;

          locationButton.textContent =
            "⦿";

        },

        error => {

          console.error(
            "Geolocation error:",
            error
          );

          locationButton.disabled =
            false;

          locationButton.textContent =
            "⦿";

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {

            alert(
              "Location permission denied"
            );

          } else if (
            error.code ===
            error.TIMEOUT
          ) {

            alert(
              "Location request timed out"
            );

          } else {

            alert(
              "Could not get location"
            );

          }

        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }

      );

  }
);
function openSavedPoints() {

    window.location.href =
        "saved.html";

}

// =====================================
// START
// =====================================

loadList();
