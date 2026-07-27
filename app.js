"use strict";

/*
=========================================
FIX-PIN
app.js
Application Coordinator
=========================================
*/


// =====================================
// STATE
// =====================================

let currentLocation = null;

let searchText = "";


// =====================================
// ELEMENTS
// =====================================

const elements = {

    coordinatesInput: null,

    noteInput: null,

    gpsButton: null,

    saveButton: null,

    openFileButton: null,

    saveFileButton: null,

    searchInput: null,

    fileInput: null,

    dataList: null

};


// =====================================
// START
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

    if (!checkModules()) {
        return;
    }

    getElements();

    if (!checkElements()) {
        return;
    }

    FixPinMap.initMap();

    bindEvents();

    renderAll();

    registerServiceWorker();

}


// =====================================
// MODULE CHECK
// =====================================

function checkModules() {

    const modulesAvailable =
        typeof FixPinMap !== "undefined" &&
        typeof FixPinStorage !== "undefined" &&
        typeof FixPinFiles !== "undefined";

    if (!modulesAvailable) {

        console.error(
            "Fix-Pin: one or more modules are unavailable."
        );

        window.alert(
            "The application could not start."
        );

        return false;

    }

    return true;

}


// =====================================
// ELEMENTS
// =====================================

function getElements() {

    elements.coordinatesInput =
        document.getElementById("input1");

    elements.noteInput =
        document.getElementById("myInput");

    elements.gpsButton =
        document.getElementById("alertBtn");

    elements.saveButton =
        document.getElementById("myButton");

    elements.openFileButton =
        document.getElementById("openFileBtn");

    elements.saveFileButton =
        document.getElementById("saveFileBtn");

    elements.searchInput =
        document.getElementById("searchInput");

    elements.fileInput =
        document.getElementById("fileInput");

    elements.dataList =
        document.getElementById("data-list");

}


function checkElements() {

    const missingElements =
        Object.entries(elements)
            .filter(([, element]) => !element)
            .map(([name]) => name);

    if (missingElements.length === 0) {
        return true;
    }

    console.error(
        "Fix-Pin: missing HTML elements:",
        missingElements
    );

    window.alert(
        "The application interface is incomplete."
    );

    return false;

}


// =====================================
// EVENTS
// =====================================

function bindEvents() {

    elements.gpsButton.addEventListener(
        "click",
        getCurrentLocation
    );

    elements.saveButton.addEventListener(
        "click",
        saveCurrentPoint
    );

    elements.openFileButton.addEventListener(
        "click",
        openFileDialog
    );

    elements.saveFileButton.addEventListener(
        "click",
        savePointsToFile
    );

    elements.fileInput.addEventListener(
        "change",
        openSelectedFile
    );

    elements.searchInput.addEventListener(
        "input",
        handleSearch
    );

    elements.noteInput.addEventListener(
        "keydown",
        handleNoteKeydown
    );

}


// =====================================
// GPS
// =====================================

async function getCurrentLocation() {

    setButtonBusy(
        elements.gpsButton,
        true
    );

    try {

        const location =
            await FixPinMap.getCurrentPosition();

        currentLocation = {

            lat: Number(location.lat),

            lng: Number(location.lng),

            accuracy:
                Number(location.accuracy),

            altitude:
                location.altitude,

            timestamp:
                location.timestamp

        };

        elements.coordinatesInput.value =
            formatCoordinates(
                currentLocation
            );

        FixPinMap.showAndMoveToCurrentLocation(
            currentLocation
        );

        elements.noteInput.focus();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to get GPS location."
        );

    } finally {

        setButtonBusy(
            elements.gpsButton,
            false
        );

    }

}


// =====================================
// SAVE POINT
// =====================================

function saveCurrentPoint() {

    if (!currentLocation) {

        showMessage(
            "Get the GPS location first."
        );

        return;

    }

    const note =
        elements.noteInput.value.trim();

    try {

        const point =
            FixPinStorage.createPoint(
                currentLocation.lat,
                currentLocation.lng,
                note
            );

        FixPinStorage.save(point);

        elements.noteInput.value = "";

        renderAll();

        FixPinMap.moveToPoint(point);

        FixPinMap.openSavedMarkerPopup(
            point.id
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to save the point."
        );

    }

}


// =====================================
// SEARCH
// =====================================

function handleSearch(event) {

    searchText =
        String(event.target.value || "")
            .trim()
            .toLowerCase();

    renderList();

}


// =====================================
// RENDER
// =====================================

function renderAll() {

    renderMarkers();

    renderList();

}


function renderMarkers() {

    const points =
        FixPinStorage.getAll();

    FixPinMap.clearSavedMarkers();

    FixPinMap.addSavedMarkers(
        points
    );

}


function renderList() {

    const points =
        FixPinStorage.getAll();

    const filteredPoints =
        filterPoints(
            points,
            searchText
        );

    elements.dataList.replaceChildren();

    if (points.length === 0) {

        elements.dataList.appendChild(
            createEmptyItem(
                "No saved points."
            )
        );

        return;

    }

    if (filteredPoints.length === 0) {

        elements.dataList.appendChild(
            createEmptyItem(
                "No matching points."
            )
        );

        return;

    }

    filteredPoints.forEach(
        (point, index) => {

            const listItem =
                createListItem(
                    point,
                    index
                );

            elements.dataList.appendChild(
                listItem
            );

        }
    );

}


function filterPoints(
    points,
    query
) {

    if (!query) {
        return points;
    }

    return points.filter(point => {

        const note =
            String(point.note || "")
                .toLowerCase();

        return note.includes(query);

    });

}


// =====================================
// LIST ITEM
// =====================================

function createListItem(
    point,
    index
) {

    const listItem =
        document.createElement("li");

    listItem.className =
        "saved-point";

    listItem.dataset.pointId =
        point.id;


    const row =
        document.createElement("div");

    row.className =
        "row";


    const content =
        document.createElement("div");

    content.className =
        "saved-point-content";


    const title =
        document.createElement("div");

    title.className =
        "note";

    title.textContent =
        getPointTitle(
            point,
            index
        );


    const time =
        document.createElement("div");

    time.className =
        "time";

    time.textContent =
        formatDate(
            point.created
        );


    const actions =
        document.createElement("div");

    actions.className =
        "point-actions";


    const gotoButton =
        createIconButton({

            icon:
                "ph-navigation-arrow",

            label:
                "Open in Google Maps",

            onClick:
                () => openPointInGoogleMaps(
                    point
                )

        });


    const mapButton =
        createIconButton({

            icon:
                "ph-map-pin",

            label:
                "Show on map",

            onClick:
                () => showPointOnMap(
                    point
                )

        });


    const deleteButton =
        createIconButton({

            icon:
                "ph-trash",

            label:
                "Delete point",

            onClick:
                () => deletePoint(
                    point
                )

        });


    content.appendChild(title);

    content.appendChild(time);


    actions.appendChild(
        mapButton
    );

    actions.appendChild(
        gotoButton
    );

    actions.appendChild(
        deleteButton
    );


    row.appendChild(content);

    row.appendChild(actions);

    listItem.appendChild(row);


    listItem.addEventListener(
        "dblclick",
        () => showPointOnMap(point)
    );

    return listItem;

}


function createIconButton({
    icon,
    label,
    onClick
}) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "icon-btn";

    button.setAttribute(
        "aria-label",
        label
    );

    button.title =
        label;


    const iconElement =
        document.createElement("i");

    iconElement.className =
        `ph ${icon}`;

    iconElement.setAttribute(
        "aria-hidden",
        "true"
    );


    button.appendChild(
        iconElement
    );


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            onClick();

        }
    );

    return button;

}


function createEmptyItem(message) {

    const listItem =
        document.createElement("li");

    listItem.className =
        "empty-list-message";

    listItem.textContent =
        message;

    return listItem;

}


function getPointTitle(
    point,
    index
) {

    const note =
        String(point.note || "")
            .trim();

    return note ||
        `Point ${index + 1}`;

}


// =====================================
// SHOW POINT ON MAP
// =====================================

function showPointOnMap(point) {

    FixPinMap.moveToPoint(
        point
    );

    FixPinMap.openSavedMarkerPopup(
        point.id
    );

    scrollToMap();

}


function scrollToMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        return;
    }

    mapElement.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


// =====================================
// GOOGLE MAPS
// =====================================

function openPointInGoogleMaps(point) {

    const latitude =
        Number(point.lat);

    const longitude =
        Number(point.lng);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        showMessage(
            "Invalid point coordinates."
        );

        return;

    }

    const destination =
        encodeURIComponent(
            `${latitude},${longitude}`
        );

    const url =
        "https://www.google.com/maps/dir/" +
        `?api=1&destination=${destination}`;

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


// =====================================
// DELETE
// =====================================

function deletePoint(point) {

    const pointName =
        String(point.note || "Point");

    const confirmed =
        window.confirm(
            `Delete "${pointName}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        FixPinStorage.remove(
            point.id
        );

        FixPinMap.removeSavedMarker(
            point.id
        );

        renderList();

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to delete the point."
        );

    }

}


// =====================================
// SAVE TO FILE
// =====================================

async function savePointsToFile() {

    const points =
        FixPinStorage.getAll();

    if (points.length === 0) {

        showMessage(
            "There are no points to save."
        );

        return;

    }

    setButtonBusy(
        elements.saveFileButton,
        true
    );

    try {

        const result =
            await FixPinFiles.exportPoints(
                points
            );

        if (
            result &&
            result.cancelled
        ) {

            return;

        }

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to save the file."
        );

    } finally {

        setButtonBusy(
            elements.saveFileButton,
            false
        );

    }

}


// =====================================
// OPEN FILE
// =====================================

function openFileDialog() {

    elements.fileInput.value = "";

    elements.fileInput.click();

}


async function openSelectedFile(event) {

    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }

    setButtonBusy(
        elements.openFileButton,
        true
    );

    try {

        const importedPoints =
            await FixPinFiles.importPoints(
                file
            );

        const confirmed =
            window.confirm(
                "Opening this file will replace all currently saved points. Continue?"
            );

        if (!confirmed) {
            return;
        }

        FixPinStorage.replaceAll(
            importedPoints
        );

        currentLocation = null;

        elements.coordinatesInput.value = "";

        elements.noteInput.value = "";

        elements.searchInput.value = "";

        searchText = "";

        FixPinMap.removeCurrentLocation();

        renderAll();

        FixPinMap.fitAllMarkers({

            includeCurrent: false,

            maxZoom: 17

        });

        showMessage(
            `${importedPoints.length} points opened.`
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to open the file."
        );

    } finally {

        event.target.value = "";

        setButtonBusy(
            elements.openFileButton,
            false
        );

    }

}


// =====================================
// NOTE INPUT
// =====================================

function handleNoteKeydown(event) {

    if (
        event.key !== "Enter" ||
        event.shiftKey
    ) {

        return;

    }

    event.preventDefault();

    saveCurrentPoint();

}


// =====================================
// FORMAT
// =====================================

function formatCoordinates(location) {

    const latitude =
        Number(location.lat);

    const longitude =
        Number(location.lng);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return "";

    }

    return (
        `${latitude.toFixed(6)}, ` +
        `${longitude.toFixed(6)}`
    );

}


function formatDate(value) {

    const timestamp =
        Number(value);

    if (!Number.isFinite(timestamp)) {
        return "";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }

    return date.toLocaleString();

}


// =====================================
// BUTTON STATE
// =====================================

function setButtonBusy(
    button,
    isBusy
) {

    if (!button) {
        return;
    }

    button.disabled =
        Boolean(isBusy);

    button.setAttribute(
        "aria-busy",
        String(Boolean(isBusy))
    );

}


// =====================================
// MESSAGE
// =====================================

function showMessage(message) {

    window.alert(
        String(message)
    );

}


// =====================================
// SERVICE WORKER
// =====================================

function registerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {

        return;

    }

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "service-worker.js"
                )
                .catch(error => {

                    console.error(
                        "Fix-Pin: service worker registration failed.",
                        error
                    );

                });

        }
    );

}
