"use strict";

/*
=========================================
FIX-PIN
app.js
=========================================
*/


// =====================================
// ELEMENTS
// =====================================

const list =
    document.getElementById("data-list");

const coordinatesInput =
    document.getElementById("input1");

const noteInput =
    document.getElementById("myInput");

const saveButton =
    document.getElementById("myButton");

const locationButton =
    document.getElementById("alertBtn");
const goToButton =
    document.getElementById("gotoButton");

const shareSelectedButton =
    document.getElementById("shareButton");

const deleteSelectedButton =
    document.getElementById("deleteButton");


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
        maxZoom: 19
    }
).addTo(map);

let pulseMarker = null;


// =====================================
// SERVICE WORKER
// =====================================

registerServiceWorker();

function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {
        return;
    }

    navigator.serviceWorker
        .register("service-worker.js")
        .catch(error => {
            console.error(
                "Service Worker registration failed:",
                error
            );
        });
}


// =====================================
// STORAGE
// =====================================

function saveList() {

    const data = [];

    list
        .querySelectorAll("li")
        .forEach(item => {

            const textElement =
                item.querySelector(".item-text");

            data.push({
                text: textElement
                    ? textElement.textContent
                    : "",
                coords:
                    item.dataset.coords || ""
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
            localStorage.getItem("savefoun") ||
            "[]"
        );

    } catch (error) {

        console.error(
            "Saved data could not be read:",
            error
        );

        localStorage.removeItem("savefoun");
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
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);

    if (parts.length !== 2) {
        return null;
    }

    const [lat, lon] = parts;

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
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
        html: '<div class="pulse-marker"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
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
// ADD SAVED ITEM
// =====================================

function addItem(text, coords = "") {

    const listItem =
        document.createElement("li");

    listItem.dataset.coords = coords;


    // CHECKBOX

    const checkbox =
        document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "point-checkbox";

    checkbox.setAttribute(
        "aria-label",
        "Select saved point"
    );


    // TEXT AREA

    const left =
        document.createElement("div");

    left.className = "left";

    const textElement =
        document.createElement("span");

    textElement.className = "item-text";
    textElement.textContent = text;

    left.appendChild(textElement);


    listItem.appendChild(checkbox);
    listItem.appendChild(left);

    list.appendChild(listItem);
}


    // =================================
    // GOOGLE MAPS BUTTON
    // =================================

    if (coords) {

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

                const point =
                    parseCoordinates(coords);

                if (!point) {
                    alert("Invalid coordinates");
                    return;
                }

                const url =
                    "https://www.google.com/maps/dir/" +
                    "?api=1" +
                    `&destination=${point.lat},${point.lon}`;

                window.open(
                    url,
                    "_blank",
                    "noopener,noreferrer"
                );

            }
        );

        left.appendChild(mapButton);
    }


    // =================================
    // SHARE BUTTON
    // =================================

    const shareButton =
        document.createElement("button");

    shareButton.type = "button";
    shareButton.className =
        "mini share-btn";

    shareButton.textContent = "↗";

    shareButton.setAttribute(
        "aria-label",
        "Share location"
    );

    shareButton.addEventListener(
        "click",
        async event => {

            event.stopPropagation();

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
                        title: "Fix-Pin",
                        text: message
                    });

                    return;
                }

                await navigator.clipboard.writeText(
                    message
                );

                alert("Link copied!");

            } catch (error) {

                if (error.name !== "AbortError") {
                    console.error(
                        "Share failed:",
                        error
                    );
                }

            }

        }
    );


    // =================================
    // DELETE BUTTON
    // =================================

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className =
        "mini del-btn";

    deleteButton.textContent = "×";

    deleteButton.setAttribute(
        "aria-label",
        "Delete saved point"
    );

    deleteButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            listItem.remove();

            saveList();

        }
    );


    listItem.appendChild(left);
    listItem.appendChild(shareButton);
    listItem.appendChild(deleteButton);

    list.appendChild(listItem);
}


// =====================================
// SAVE POINT
// =====================================

function savePoint() {

    const text =
        noteInput.value.trim();

    const coords =
        coordinatesInput.value.trim();

    if (!text) {

        alert("Enter a note");

        noteInput.focus();

        return;
    }

    if (coords) {

        const point =
            parseCoordinates(coords);

        if (!point) {

            alert("Invalid coordinates");

            coordinatesInput.focus();

            return;
        }

    }

    addItem(
        text,
        coords
    );

    noteInput.value = "";
    coordinatesInput.value = "";

    saveList();

    noteInput.focus();
}


// =====================================
// GEOLOCATION
// =====================================

function getCurrentLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;
    }

    locationButton.disabled = true;

    navigator.geolocation.getCurrentPosition(

        position => {

            const lat =
                position.coords.latitude;

            const lon =
                position.coords.longitude;

            coordinatesInput.value =
                `${lat.toFixed(6)},${lon.toFixed(6)}`;

            showPulse(
                lat,
                lon
            );

            locationButton.disabled = false;

        },

        error => {

            locationButton.disabled = false;

            switch (error.code) {

                case error.PERMISSION_DENIED:
                    alert(
                        "Location permission was denied."
                    );
                    break;

                case error.POSITION_UNAVAILABLE:
                    alert(
                        "Location is unavailable."
                    );
                    break;

                case error.TIMEOUT:
                    alert(
                        "Location request timed out."
                    );
                    break;

                default:
                    alert(
                        "Could not get your location."
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


// =====================================
// EVENTS
// =====================================

saveButton.addEventListener(
    "click",
    savePoint
);

locationButton.addEventListener(
    "click",
    getCurrentLocation
);

noteInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            savePoint();
        }

    }
);


// =====================================
// START
// =====================================

loadList();
