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

    noteInput: null,

    gpsButton: null,

    saveButton: null,

    goToSelectedButton: null,

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

    renderList();

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

    elements.noteInput =
        document.getElementById("myInput");

    elements.gpsButton =
        document.getElementById("alertBtn");

    elements.saveButton =
        document.getElementById("myButton");

    elements.goToSelectedButton =
        document.getElementById(
            "goToSelectedBtn"
        );

    elements.openFileButton =
        document.getElementById(
            "openFileBtn"
        );

    elements.saveFileButton =
        document.getElementById(
            "saveFileBtn"
        );

    elements.searchInput =
        document.getElementById(
            "searchInput"
        );

    elements.fileInput =
        document.getElementById(
            "fileInput"
        );

    elements.dataList =
        document.getElementById(
            "data-list"
        );

}


function checkElements() {

    const missingElements =

        Object.entries(elements)

            .filter(
                ([, element]) => !element
            )

            .map(
                ([name]) => name
            );

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

    elements.goToSelectedButton.addEventListener(
        "click",
        openVisiblePointsInGoogleMaps
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

            lat:
                Number(location.lat),

            lng:
                Number(location.lng),

            accuracy:
                Number(location.accuracy),

            altitude:
                location.altitude,

            timestamp:
                location.timestamp

        };

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

        renderList();

        elements.noteInput.focus();

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

        String(
            event.target.value || ""
        )

            .trim()

            .toLowerCase();

    renderList();

}


// =====================================
// RENDER LIST
// =====================================

function renderList() {

    const points =
        FixPinStorage.getAll();

    const filteredEntries =
        getFilteredEntries(
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

    if (filteredEntries.length === 0) {

        elements.dataList.appendChild(

            createEmptyItem(
                "No matching points."
            )

        );

        return;

    }

    filteredEntries.forEach(entry => {

        const listItem =
            createListItem(

                entry.point,

                entry.originalIndex

            );

        elements.dataList.appendChild(
            listItem
        );

    });

}


// =====================================
// FILTER
// =====================================

function getFilteredEntries(
    points,
    query
) {

    const entries =
        points.map(
            (point, originalIndex) => ({
                point,
                originalIndex
            })
        );

    if (!query) {
        return entries;
    }

    return entries.filter(entry => {

        const title =
            getPointTitle(
                entry.point,
                entry.originalIndex
            ).toLowerCase();

        return title.includes(query);

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
        String(point.id);


    const title =
        document.createElement("div");

    title.className =
        "note";

    title.textContent =
        getPointTitle(
            point,
            index
        );


    const actions =
        document.createElement("div");

    actions.className =
        "point-actions";


    const pointIsVisible =
        FixPinMap.hasSavedMarker(
            point.id
        );


    const mapButton =
        createIconButton({

            icon:
                pointIsVisible
                    ? "ph-map-pin-simple-area"
                    : "ph-map-pin",

            label:
                pointIsVisible
                    ? "Hide from map"
                    : "Show on map",

            className:
                pointIsVisible
                    ? "show-map-btn active"
                    : "show-map-btn",

            onClick:
                () => togglePointOnMap(
                    point,
                    index
                )

        });


    const deleteButton =
        createIconButton({

            icon:
                "ph-trash",

            label:
                "Delete point",

            className:
                "delete-btn",

            onClick:
                () => deletePoint(
                    point,
                    index
                )

        });


    actions.appendChild(
        mapButton
    );

    actions.appendChild(
        deleteButton
    );


    listItem.appendChild(
        title
    );

    listItem.appendChild(
        actions
    );

    return listItem;

}


function createIconButton({

    icon,

    label,

    className = "",

    onClick

}) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        `icon-btn ${className}`.trim();

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


// =====================================
// POINT TITLE
// =====================================

function getPointTitle(
    point,
    index
) {

    const note =
        String(point.note || "").trim();

    return (
        note ||
        `Point ${index + 1}`
    );

}


// =====================================
// SHOW / HIDE POINT ON MAP
// =====================================

function togglePointOnMap(
    point,
    index
) {

    const pointForMap = {

        ...point,

        note:
            getPointTitle(
                point,
                index
            )

    };

    const result =
        FixPinMap.toggleSavedMarker(
            pointForMap
        );

    if (result.limitReached) {

        showProLimitMessage();

        return;

    }

    if (result.visible) {

        FixPinMap.moveToPoint(
            pointForMap
        );

        FixPinMap.openSavedMarkerPopup(
            point.id
        );

        scrollToMap();

    }

    renderList();

}


function showProLimitMessage() {

    showMessage(

        "Maximum 9 points in Free version.\n\n" +

        "Download Fix-Pin Pro for unlimited points."

    );

}


// =====================================
// SCROLL TO MAP
// =====================================

function scrollToMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        return;
    }

    mapElement.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


// =====================================
// GOOGLE MAPS
// =====================================

function openVisiblePointsInGoogleMaps() {

    const points =
        FixPinMap.getSavedMarkerPoints();

    if (points.length === 0) {

        showMessage(
            "Show points on the map first."
        );

        return;

    }

    if (points.length > 9) {

        showProLimitMessage();

        return;

    }

    const validPoints =
        points.filter(
            hasValidCoordinates
        );

    if (
        validPoints.length !==
        points.length
    ) {

        showMessage(
            "One or more points have invalid coordinates."
        );

        return;

    }

    const destinationPoint =
        validPoints[
            validPoints.length - 1
        ];

    const destination =
        encodeCoordinatePair(
            destinationPoint
        );

    let url =

        "https://www.google.com/maps/dir/" +

        "?api=1" +

        `&destination=${destination}`;

    if (validPoints.length > 1) {

        const waypointPoints =
            validPoints.slice(
                0,
                -1
            );

        const waypoints =

            waypointPoints

                .map(
                    encodeCoordinatePair
                )

                .join("%7C");

        url +=
            `&waypoints=${waypoints}`;

    }

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


function hasValidCoordinates(point) {

    const latitude =
        Number(point.lat);

    const longitude =
        Number(point.lng);

    return (

        Number.isFinite(latitude) &&

        Number.isFinite(longitude) &&

        latitude >= -90 &&

        latitude <= 90 &&

        longitude >= -180 &&

        longitude <= 180

    );

}


function encodeCoordinatePair(point) {

    return encodeURIComponent(

        `${Number(point.lat)},` +
        `${Number(point.lng)}`

    );

}


// =====================================
// DELETE
// =====================================

function deletePoint(
    point,
    index
) {

    const pointName =
        getPointTitle(
            point,
            index
        );

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

        const existingPoints =
            FixPinStorage.getAll();

        let added = 0;

        let skipped = 0;

        importedPoints.forEach(point => {

            const duplicate =
                existingPoints.some(existingPoint =>

                    Number(existingPoint.lat) ===
                        Number(point.lat) &&

                    Number(existingPoint.lng) ===
                        Number(point.lng) &&

                    String(existingPoint.note || "")
                        .trim() ===

                    String(point.note || "")
                        .trim()

                );

            if (duplicate) {

                skipped++;

                return;

            }

            const importedPoint = {

                id:
                    point.id,

                lat:
                    Number(point.lat),

                lng:
                    Number(point.lng),

                note:
                    String(point.note || ""),

                created:
                    Number(point.created)

            };

            FixPinStorage.save(
                importedPoint
            );

            existingPoints.push(
                importedPoint
            );

            added++;

        });

        renderList();

        showMessage(

            "Import completed\n\n" +

            `Added: ${added}\n` +

            `Skipped duplicates: ${skipped}`

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

        String(
            Boolean(isBusy)
        )

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

                        "Fix-Pin: service worker " +
                        "registration failed.",

                        error

                    );

                });

        }
    );

}
