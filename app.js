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

const selectedPoints = new Set();


// =====================================
// ELEMENTS
// =====================================

const elements = {
    noteInput: null,
    gpsButton: null,
    saveButton: null,
    gotoButton: null,
    importButton: null,
    exportButton: null,
    deleteButton: null,
    importFileInput: null,
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

    renderList();

    updateSelection();

}


// =====================================
// MODULE CHECK
// =====================================

function checkModules() {

    if (
        typeof FixPinMap === "undefined" ||
        typeof FixPinStorage === "undefined" ||
        typeof FixPinFiles === "undefined"
    ) {

        console.error(
            "Fix-Pin: one or more modules are unavailable."
        );

        alert(
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

    elements.noteInput =
        document.getElementById("myInput");

    elements.gpsButton =
        document.getElementById("alertBtn");

    elements.saveButton =
        document.getElementById("myButton");

    elements.gotoButton =
        document.getElementById("gotoButton");

    elements.importButton =
        document.getElementById("importButton");

    elements.exportButton =
        document.getElementById("exportButton");

    elements.deleteButton =
        document.getElementById("deleteButton");

    elements.importFileInput =
        document.getElementById(
            "importFileInput"
        );

    elements.dataList =
        document.getElementById("data-list");

}


function checkElements() {

    const missingElements = [];

    Object.entries(elements).forEach(
        ([name, element]) => {

            if (!element) {
                missingElements.push(name);
            }

        }
    );

    if (missingElements.length === 0) {
        return true;
    }

    console.error(
        "Fix-Pin: missing HTML elements:",
        missingElements
    );

    alert(
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

    elements.gotoButton.addEventListener(
        "click",
        gotoSelectedPoints
    );

    elements.importButton.addEventListener(
        "click",
        openImportDialog
    );

    elements.exportButton.addEventListener(
        "click",
        exportPoints
    );

    elements.deleteButton.addEventListener(
        "click",
        deleteSelectedPoints
    );

    elements.importFileInput.addEventListener(
        "change",
        importPoints
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
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy
        };

        FixPinMap.showAndMoveToCurrentLocation(
            currentLocation
        );

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
// SAVE
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

    const point =
        FixPinStorage.createPoint(
            currentLocation.lat,
            currentLocation.lng,
            note
        );

    if (!isValidPoint(point)) {

        showMessage(
            "Unable to create the point."
        );

        return;
    }

    try {

        FixPinStorage.save(point);

        FixPinMap.addSavedMarker(point);

        elements.noteInput.value = "";

        renderList();

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to save the point."
        );

    }

}


// =====================================
// RENDER LIST
// =====================================

function renderList() {

    const points =
        FixPinStorage.getAll();

    removeMissingSelections(points);

    elements.dataList.replaceChildren();

    FixPinMap.clearSavedMarkers();

    if (points.length === 0) {

        const emptyItem =
            document.createElement("li");

        emptyItem.className =
            "empty-list-message";

        emptyItem.textContent =
            "No saved points.";

        elements.dataList.appendChild(
            emptyItem
        );

        updateSelection();

        return;
    }

    points.forEach((point, index) => {

        if (!isValidPoint(point)) {
            return;
        }

        FixPinMap.addSavedMarker(point);

        const listItem =
            createListItem(
                point,
                index
            );

        elements.dataList.appendChild(
            listItem
        );

    });

    updateSelection();

}


// =====================================
// CREATE LIST ITEM
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


    const label =
        document.createElement("label");

    label.className =
        "saved-point-label";


    const checkbox =
        document.createElement("input");

    checkbox.type =
        "checkbox";

    checkbox.className =
        "saved-point-checkbox";

    checkbox.value =
        point.id;

    checkbox.checked =
        selectedPoints.has(point.id);

    checkbox.setAttribute(
        "aria-label",
        `Select point ${index + 1}`
    );

    checkbox.addEventListener(
        "change",
        () => {

            togglePointSelection(
                point.id,
                checkbox.checked
            );

        }
    );


    const content =
        document.createElement("span");

    content.className =
        "saved-point-content";


    const title =
        document.createElement("strong");

    title.className =
        "saved-point-note";

    title.textContent =
        point.note || `Point ${index + 1}`;


    const coordinates =
        document.createElement("span");

    coordinates.className =
        "saved-point-coordinates";

    coordinates.textContent =
        `${formatCoordinate(point.lat)}, ` +
        `${formatCoordinate(point.lng)}`;


    content.appendChild(title);

    content.appendChild(coordinates);

    label.appendChild(checkbox);

    label.appendChild(content);

    listItem.appendChild(label);


    listItem.addEventListener(
        "dblclick",
        () => {

            FixPinMap.moveToPoint(point);

            FixPinMap.openSavedMarkerPopup(
                point.id
            );

        }
    );

    return listItem;

}


// =====================================
// SELECTION
// =====================================

function togglePointSelection(
    pointId,
    isSelected
) {

    if (isSelected) {

        selectedPoints.add(pointId);

    } else {

        selectedPoints.delete(pointId);

    }

    updateSelection();

}


function updateSelection() {

    const selectedCount =
        selectedPoints.size;

    elements.gotoButton.disabled =
        selectedCount === 0;

    elements.deleteButton.disabled =
        selectedCount === 0;

    elements.gotoButton.setAttribute(
        "aria-label",
        selectedCount === 0
            ? "Open selected points in Google Maps"
            : `Open ${selectedCount} selected points in Google Maps`
    );

    elements.deleteButton.setAttribute(
        "aria-label",
        selectedCount === 0
            ? "Delete selected points"
            : `Delete ${selectedCount} selected points`
    );

}


function removeMissingSelections(points) {

    const existingIds =
        new Set(
            points.map(
                point => point.id
            )
        );

    selectedPoints.forEach(
        pointId => {

            if (!existingIds.has(pointId)) {
                selectedPoints.delete(pointId);
            }

        }
    );

}


function getSelectedPoints() {

    const points =
        FixPinStorage.getAll();

    return points.filter(
        point =>
            selectedPoints.has(point.id)
    );

}


// =====================================
// DELETE
// =====================================

function deleteSelectedPoints() {

    const points =
        getSelectedPoints();

    if (points.length === 0) {

        showMessage(
            "Select at least one point."
        );

        return;
    }

    const confirmed =
        window.confirm(
            points.length === 1
                ? "Delete the selected point?"
                : `Delete ${points.length} selected points?`
        );

    if (!confirmed) {
        return;
    }

    try {

        points.forEach(point => {

            FixPinStorage.remove(
                point.id
            );

            FixPinMap.removeSavedMarker(
                point.id
            );

            selectedPoints.delete(
                point.id
            );

        });

        renderList();

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to delete selected points."
        );

    }

}


// =====================================
// GOOGLE MAPS
// =====================================

function gotoSelectedPoints() {

    const points =
        getSelectedPoints();

    if (points.length === 0) {

        showMessage(
            "Select at least one point."
        );

        return;
    }

    if (points.length > 9) {

        showMessage(
            "Maximum 9 points can be selected for navigation."
        );

        return;
    }

    const url =
        createGoogleMapsUrl(points);

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


function createGoogleMapsUrl(points) {

    const baseUrl =
        "https://www.google.com/maps/dir/?api=1";

    if (points.length === 1) {

        const destination =
            encodeCoordinate(points[0]);

        return (
            `${baseUrl}` +
            `&destination=${destination}`
        );

    }

    const origin =
        encodeCoordinate(points[0]);

    const destination =
        encodeCoordinate(
            points[points.length - 1]
        );

    let url =
        `${baseUrl}` +
        `&origin=${origin}` +
        `&destination=${destination}`;

    const middlePoints =
        points.slice(1, -1);

    if (middlePoints.length > 0) {

        const waypoints =
            middlePoints
                .map(encodeCoordinate)
                .join("%7C");

        url +=
            `&waypoints=${waypoints}`;

    }

    return url;

}


function encodeCoordinate(point) {

    return encodeURIComponent(
        `${point.lat},${point.lng}`
    );

}


// =====================================
// EXPORT
// =====================================

function exportPoints() {

    const points =
        FixPinStorage.getAll();

    if (points.length === 0) {

        showMessage(
            "There are no points to export."
        );

        return;
    }

    try {

        FixPinFiles.exportPoints(points);

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to export points."
        );

    }

}


// =====================================
// IMPORT
// =====================================

function openImportDialog() {

    elements.importFileInput.value = "";

    elements.importFileInput.click();

}


async function importPoints(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    setButtonBusy(
        elements.importButton,
        true
    );

    try {

        const importedPoints =
            await FixPinFiles.importPoints(
                file
            );

        const confirmed =
            window.confirm(
                "Importing will replace all currently saved points. Continue?"
            );

        if (!confirmed) {
            return;
        }

        FixPinStorage.clear();

        importedPoints.forEach(point => {

            FixPinStorage.save({
                id: point.id,
                lat: Number(point.lat),
                lng: Number(point.lng),
                note: String(point.note),
                created: Number(point.created)
            });

        });

        selectedPoints.clear();

        renderList();

        FixPinMap.fitAllMarkers({
            includeCurrent: false
        });

        showMessage(
            `${importedPoints.length} points imported.`
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to import the file."
        );

    } finally {

        event.target.value = "";

        setButtonBusy(
            elements.importButton,
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
// VALIDATION
// =====================================

function isValidPoint(point) {

    if (
        !point ||
        typeof point.id !== "string"
    ) {
        return false;
    }

    const lat =
        Number(point.lat);

    const lng =
        Number(point.lng);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {
        return false;
    }

    if (
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {
        return false;
    }

    return true;

}


// =====================================
// HELPERS
// =====================================

function formatCoordinate(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "";
    }

    return number.toFixed(6);

}


function setButtonBusy(
    button,
    isBusy
) {

    button.disabled =
        isBusy;

    button.setAttribute(
        "aria-busy",
        String(isBusy)
    );

}


function showMessage(message) {

    window.alert(message);

}
