"use strict";

/*
=========================================
FIX-PIN
map.js
Работа с картой Leaflet
=========================================
*/


const FixPinMap = (() => {

    // =====================================
    // CONFIG
    // =====================================

    const DEFAULT_CENTER = [
        41.7151,
        44.8271
    ];

    const DEFAULT_ZOOM = 12;

    const CURRENT_LOCATION_ZOOM = 17;

    const TILE_URL =
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const TILE_OPTIONS = {
        maxZoom: 19,
        attribution:
            "&copy; OpenStreetMap contributors"
    };


    // =====================================
    // STATE
    // =====================================

    let map = null;

    let currentLocationMarker = null;

    let currentAccuracyCircle = null;

    const savedMarkers = new Map();


    // =====================================
    // INITIALIZATION
    // =====================================

    function initMap() {

        if (map) {
            return map;
        }

        const mapElement =
            document.getElementById("map");

        if (!mapElement) {

            console.error(
                "FixPinMap: element #map was not found."
            );

            return null;
        }

        if (typeof L === "undefined") {

            console.error(
                "FixPinMap: Leaflet library is not loaded."
            );

            return null;
        }

        map = L.map(
            mapElement,
            {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                zoomControl: true
            }
        );

        L.tileLayer(
            TILE_URL,
            TILE_OPTIONS
        ).addTo(map);

        setTimeout(() => {

            if (map) {
                map.invalidateSize();
            }

        }, 0);

        return map;
    }


    // =====================================
    // MAP INSTANCE
    // =====================================

    function getMap() {

        return map;
    }


    function isInitialized() {

        return map !== null;
    }


    function refreshMapSize() {

        if (!map) {
            return;
        }

        map.invalidateSize();
    }


    // =====================================
    // GPS
    // =====================================

    function getCurrentPosition(options = {}) {

        return new Promise((resolve, reject) => {

            if (!navigator.geolocation) {

                reject(
                    new Error(
                        "Geolocation is not supported by this device."
                    )
                );

                return;
            }

            const geolocationOptions = {

                enableHighAccuracy:
                    options.enableHighAccuracy ?? true,

                timeout:
                    options.timeout ?? 15000,

                maximumAge:
                    options.maximumAge ?? 0
            };

            navigator.geolocation.getCurrentPosition(
                position => {

                    resolve({
                        lat:
                            position.coords.latitude,

                        lng:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy,

                        altitude:
                            position.coords.altitude,

                        altitudeAccuracy:
                            position.coords.altitudeAccuracy,

                        heading:
                            position.coords.heading,

                        speed:
                            position.coords.speed,

                        timestamp:
                            position.timestamp
                    });

                },
                error => {

                    reject(
                        createGeolocationError(error)
                    );

                },
                geolocationOptions
            );

        });

    }


    function createGeolocationError(error) {

        let message =
            "Unable to get the current location.";

        switch (error.code) {

            case 1:

                message =
                    "Location permission was denied.";

                break;

            case 2:

                message =
                    "Location information is unavailable.";

                break;

            case 3:

                message =
                    "Location request timed out.";

                break;

        }

        const locationError =
            new Error(message);

        locationError.code =
            error.code;

        return locationError;
    }


    // =====================================
    // CURRENT LOCATION
    // =====================================

    function showCurrentLocation(location) {

        if (!ensureMap()) {
            return null;
        }

        const coordinates =
            normalizeCoordinates(location);

        if (!coordinates) {

            console.error(
                "FixPinMap: invalid current location."
            );

            return null;
        }

        removeCurrentLocation();

        currentLocationMarker =
            L.marker(
                [
                    coordinates.lat,
                    coordinates.lng
                ],
                {
                    title:
                        "Current location",

                    keyboard:
                        true,

                    riseOnHover:
                        true
                }
            );

        currentLocationMarker
            .addTo(map)
            .bindPopup("Current location");

        const accuracy =
            Number(location.accuracy);

        if (
            Number.isFinite(accuracy) &&
            accuracy > 0
        ) {

            currentAccuracyCircle =
                L.circle(
                    [
                        coordinates.lat,
                        coordinates.lng
                    ],
                    {
                        radius:
                            accuracy,

                        weight:
                            1,

                        opacity:
                            0.7,

                        fillOpacity:
                            0.08
                    }
                );

            currentAccuracyCircle.addTo(map);
        }

        return currentLocationMarker;
    }


    function moveToCurrentLocation(
        location,
        zoom = CURRENT_LOCATION_ZOOM
    ) {

        if (!ensureMap()) {
            return;
        }

        const coordinates =
            normalizeCoordinates(location);

        if (!coordinates) {
            return;
        }

        map.setView(
            [
                coordinates.lat,
                coordinates.lng
            ],
            normalizeZoom(
                zoom,
                CURRENT_LOCATION_ZOOM
            )
        );

    }


    function showAndMoveToCurrentLocation(
        location,
        zoom = CURRENT_LOCATION_ZOOM
    ) {

        const marker =
            showCurrentLocation(location);

        if (!marker) {
            return null;
        }

        moveToCurrentLocation(
            location,
            zoom
        );

        return marker;
    }


    function removeCurrentLocation() {

        if (!map) {
            return;
        }

        if (currentLocationMarker) {

            map.removeLayer(
                currentLocationMarker
            );

            currentLocationMarker = null;
        }

        if (currentAccuracyCircle) {

            map.removeLayer(
                currentAccuracyCircle
            );

            currentAccuracyCircle = null;
        }

    }


    function getCurrentLocationMarker() {

        return currentLocationMarker;
    }


    // =====================================
    // SAVED MARKERS
    // =====================================

    function addSavedMarker(point) {

        if (!ensureMap()) {
            return null;
        }

        if (!point || point.id === undefined) {

            console.error(
                "FixPinMap: saved point must have an id."
            );

            return null;
        }

        const coordinates =
            normalizeCoordinates(point);

        if (!coordinates) {

            console.error(
                "FixPinMap: invalid saved point coordinates."
            );

            return null;
        }

        const pointId =
            String(point.id);

        removeSavedMarker(pointId);

        const marker =
            L.marker(
                [
                    coordinates.lat,
                    coordinates.lng
                ],
                {
                    title:
                        normalizeNote(point.note),

                    keyboard:
                        true,

                    riseOnHover:
                        true
                }
            );

        marker.pointId =
            pointId;

        marker.pointData = {
            ...point,
            id:
                pointId,
            lat:
                coordinates.lat,
            lng:
                coordinates.lng
        };

        marker.bindPopup(
            createMarkerPopup(marker.pointData)
        );

        marker.addTo(map);

        savedMarkers.set(
            pointId,
            marker
        );

        return marker;
    }


    function updateSavedMarker(point) {

        return addSavedMarker(point);
    }


    function addSavedMarkers(points) {

        if (!Array.isArray(points)) {
            return [];
        }

        const markers = [];

        points.forEach(point => {

            const marker =
                addSavedMarker(point);

            if (marker) {
                markers.push(marker);
            }

        });

        return markers;
    }


    function removeSavedMarker(pointId) {

        const id =
            String(pointId);

        const marker =
            savedMarkers.get(id);

        if (!marker) {
            return false;
        }

        if (map) {
            map.removeLayer(marker);
        }

        savedMarkers.delete(id);

        return true;
    }


    function clearSavedMarkers() {

        savedMarkers.forEach(marker => {

            if (map) {
                map.removeLayer(marker);
            }

        });

        savedMarkers.clear();
    }


    function getSavedMarker(pointId) {

        return (
            savedMarkers.get(
                String(pointId)
            ) || null
        );

    }


    function getSavedMarkers() {

        return Array.from(
            savedMarkers.values()
        );

    }


    function hasSavedMarker(pointId) {

        return savedMarkers.has(
            String(pointId)
        );

    }


    function openSavedMarkerPopup(pointId) {

        const marker =
            getSavedMarker(pointId);

        if (!marker || !map) {
            return false;
        }

        map.panTo(
            marker.getLatLng()
        );

        marker.openPopup();

        return true;
    }


    // =====================================
    // MAP VIEW
    // =====================================

    function fitAllMarkers(options = {}) {

        if (!ensureMap()) {
            return false;
        }

        const coordinates = [];

        if (
            options.includeCurrent !== false &&
            currentLocationMarker
        ) {

            coordinates.push(
                currentLocationMarker.getLatLng()
            );

        }

        savedMarkers.forEach(marker => {

            coordinates.push(
                marker.getLatLng()
            );

        });

        if (coordinates.length === 0) {
            return false;
        }

        if (coordinates.length === 1) {

            map.setView(
                coordinates[0],
                normalizeZoom(
                    options.singlePointZoom,
                    CURRENT_LOCATION_ZOOM
                )
            );

            return true;
        }

        const bounds =
            L.latLngBounds(coordinates);

        map.fitBounds(
            bounds,
            {
                padding:
                    options.padding || [30, 30],

                maxZoom:
                    normalizeZoom(
                        options.maxZoom,
                        CURRENT_LOCATION_ZOOM
                    )
            }
        );

        return true;
    }


    function moveToPoint(
        point,
        zoom = CURRENT_LOCATION_ZOOM
    ) {

        if (!ensureMap()) {
            return false;
        }

        const coordinates =
            normalizeCoordinates(point);

        if (!coordinates) {
            return false;
        }

        map.setView(
            [
                coordinates.lat,
                coordinates.lng
            ],
            normalizeZoom(
                zoom,
                CURRENT_LOCATION_ZOOM
            )
        );

        return true;
    }


    function getMapCenter() {

        if (!map) {
            return null;
        }

        const center =
            map.getCenter();

        return {
            lat:
                center.lat,
            lng:
                center.lng
        };

    }


    function getMapZoom() {

        if (!map) {
            return null;
        }

        return map.getZoom();
    }


    function resetMapView() {

        if (!ensureMap()) {
            return;
        }

        map.setView(
            DEFAULT_CENTER,
            DEFAULT_ZOOM
        );

    }


    // =====================================
    // MAP EVENTS
    // =====================================

    function onMapClick(callback) {

        if (!ensureMap()) {
            return;
        }

        if (typeof callback !== "function") {
            return;
        }

        map.on(
            "click",
            event => {

                callback({
                    lat:
                        event.latlng.lat,

                    lng:
                        event.latlng.lng,

                    originalEvent:
                        event
                });

            }
        );

    }


    // =====================================
    // HELPERS
    // =====================================

    function ensureMap() {

        if (!map) {
            initMap();
        }

        return map !== null;
    }


    function normalizeCoordinates(value) {

        if (!value) {
            return null;
        }

        const lat =
            Number(
                value.lat ??
                value.latitude
            );

        const lng =
            Number(
                value.lng ??
                value.lon ??
                value.longitude
            );

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            return null;
        }

        if (
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return null;
        }

        return {
            lat,
            lng
        };

    }


    function normalizeZoom(
        zoom,
        fallback
    ) {

        const value =
            Number(zoom);

        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.min(
            19,
            Math.max(
                1,
                value
            )
        );

    }


    function normalizeNote(note) {

        const value =
            String(note || "").trim();

        return value || "Saved point";
    }


    function createMarkerPopup(point) {

        const wrapper =
            document.createElement("div");

        const noteElement =
            document.createElement("strong");

        noteElement.textContent =
            normalizeNote(point.note);

        const coordinatesElement =
            document.createElement("div");

        coordinatesElement.textContent =
            `${formatCoordinate(point.lat)}, ` +
            `${formatCoordinate(point.lng)}`;

        wrapper.appendChild(
            noteElement
        );

        wrapper.appendChild(
            document.createElement("br")
        );

        wrapper.appendChild(
            coordinatesElement
        );

        return wrapper;
    }


    function formatCoordinate(value) {

        const number =
            Number(value);

        if (!Number.isFinite(number)) {
            return "";
        }

        return number.toFixed(6);
    }


    // =====================================
    // PUBLIC API
    // =====================================

    return {

        initMap,
        getMap,
        isInitialized,
        refreshMapSize,

        getCurrentPosition,

        showCurrentLocation,
        moveToCurrentLocation,
        showAndMoveToCurrentLocation,
        removeCurrentLocation,
        getCurrentLocationMarker,

        addSavedMarker,
        updateSavedMarker,
        addSavedMarkers,
        removeSavedMarker,
        clearSavedMarkers,
        getSavedMarker,
        getSavedMarkers,
        hasSavedMarker,
        openSavedMarkerPopup,

        fitAllMarkers,
        moveToPoint,
        getMapCenter,
        getMapZoom,
        resetMapView,

        onMapClick

    };

})();


window.FixPinMap =
    FixPinMap;
