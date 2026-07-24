"use strict";

/*
=========================================
FIX-PIN
saved.js
Saved Points
=========================================
*/


// =====================================
// GLOBAL
// =====================================

let locations = [];

let visibleLocations = [];

const selectedLocationIds =
    new Set();


// =====================================
// START
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

    const searchInput =
        document.getElementById(
            "search-input"
        );

    const selectAllCheckbox =
        document.getElementById(
            "select-all-checkbox"
        );

    const gotoSelectedBtn =
        document.getElementById(
            "goto-selected-btn"
        );

    const shareSelectedBtn =
        document.getElementById(
            "share-selected-btn"
        );

    const deleteSelectedBtn =
        document.getElementById(
            "delete-selected-btn"
        );

    const backBtn =
        document.getElementById(
            "back-btn"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            searchLocations
        );

    }


    if (selectAllCheckbox) {

        selectAllCheckbox.addEventListener(
            "change",
            toggleSelectAll
        );

    }


    if (gotoSelectedBtn) {

        gotoSelectedBtn.addEventListener(
            "click",
            goToSelected
        );

    }


    if (shareSelectedBtn) {

        shareSelectedBtn.addEventListener(
            "click",
            shareSelected
        );

    }


    if (deleteSelectedBtn) {

        deleteSelectedBtn.addEventListener(
            "click",
            deleteSelected
        );

    }


    if (backBtn) {

        backBtn.addEventListener(
            "click",
            openMainPage
        );

    }


    loadLocations();

}


// =====================================
// LOAD LOCATIONS
// =====================================

function loadLocations() {

    locations =
        getLocations();


    removeInvalidSelections();


    renderLocations(
        locations
    );


    updateActionButtons();

}


// =====================================
// REMOVE INVALID SELECTIONS
// =====================================

function removeInvalidSelections() {

    const availableIds =
        new Set(
            locations.map(
                location =>
                    String(location.id)
            )
        );


    selectedLocationIds.forEach(
        id => {

            if (!availableIds.has(id)) {

                selectedLocationIds.delete(
                    id
                );

            }

        }
    );

}


// =====================================
// RENDER LOCATIONS
// =====================================

function renderLocations(
    locationsToRender
) {

    const list =
        document.getElementById(
            "locations-list"
        );


    if (!list) {
        return;
    }


    visibleLocations =
        Array.isArray(locationsToRender)
            ? locationsToRender
            : [];


    list.replaceChildren();


    if (visibleLocations.length === 0) {

        const message =
            document.createElement(
                "div"
            );

        message.className =
            "empty-message";

        message.textContent =
            locations.length === 0
                ? "No saved points."
                : "No points found.";


        list.appendChild(
            message
        );


        updateSelectAllCheckbox();

        return;

    }


    visibleLocations.forEach(
        location => {

            const item =
                createLocationItem(
                    location
                );

            list.appendChild(
                item
            );

        }
    );


    updateSelectAllCheckbox();

}


// =====================================
// CREATE LOCATION ITEM
// =====================================

function createLocationItem(
    location
) {

    const item =
        document.createElement(
            "label"
        );

    item.className =
        "location-item";


    const checkbox =
        document.createElement(
            "input"
        );

    checkbox.type =
        "checkbox";

    checkbox.className =
        "location-checkbox";

    checkbox.dataset.locationId =
        String(location.id);

    checkbox.checked =
        selectedLocationIds.has(
            String(location.id)
        );


    checkbox.addEventListener(
        "change",
        () => {

            const id =
                String(location.id);


            if (checkbox.checked) {

                selectedLocationIds.add(
                    id
                );

            } else {

                selectedLocationIds.delete(
                    id
                );

            }


            updateActionButtons();

            updateSelectAllCheckbox();

        }
    );


    const materialCheckbox =
        document.createElement(
            "span"
        );

    materialCheckbox.className =
        "material-checkbox";

    materialCheckbox.setAttribute(
        "aria-hidden",
        "true"
    );


    const note =
        document.createElement(
            "span"
        );

    note.className =
        "location-note";

    note.textContent =
        getLocationName(
            location
        );


    item.append(
        checkbox,
        materialCheckbox,
        note
    );


    return item;

}


// =====================================
// LOCATION NAME
// =====================================

function getLocationName(
    location
) {

    const note =
        String(
            location.note || ""
        ).trim();


    return note ||
        "Unnamed point";

}


// =====================================
// SEARCH
// =====================================

function searchLocations() {

    const searchInput =
        document.getElementById(
            "search-input"
        );


    if (!searchInput) {
        return;
    }


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!searchText) {

        renderLocations(
            locations
        );

        return;

    }


    const filteredLocations =
        locations.filter(
            location => {

                const note =
                    getLocationName(
                        location
                    ).toLowerCase();


                return note.includes(
                    searchText
                );

            }
        );


    renderLocations(
        filteredLocations
    );

}


// =====================================
// SELECT ALL
// =====================================

function toggleSelectAll() {

    const selectAllCheckbox =
        document.getElementById(
            "select-all-checkbox"
        );


    if (!selectAllCheckbox) {
        return;
    }


    if (visibleLocations.length === 0) {

        selectAllCheckbox.checked =
            false;

        return;

    }


    visibleLocations.forEach(
        location => {

            const id =
                String(location.id);


            if (selectAllCheckbox.checked) {

                selectedLocationIds.add(
                    id
                );

            } else {

                selectedLocationIds.delete(
                    id
                );

            }

        }
    );


    renderLocations(
        visibleLocations
    );


    updateActionButtons();

}


// =====================================
// UPDATE SELECT ALL
// =====================================

function updateSelectAllCheckbox() {

    const selectAllCheckbox =
        document.getElementById(
            "select-all-checkbox"
        );


    if (!selectAllCheckbox) {
        return;
    }


    if (visibleLocations.length === 0) {

        selectAllCheckbox.checked =
            false;

        selectAllCheckbox.indeterminate =
            false;

        selectAllCheckbox.disabled =
            true;

        return;

    }


    selectAllCheckbox.disabled =
        false;


    const selectedVisibleCount =
        visibleLocations.filter(
            location =>
                selectedLocationIds.has(
                    String(location.id)
                )
        ).length;


    selectAllCheckbox.checked =
        selectedVisibleCount ===
        visibleLocations.length;


    selectAllCheckbox.indeterminate =
        selectedVisibleCount > 0 &&
        selectedVisibleCount <
        visibleLocations.length;

}

// =====================================
// GET SELECTED LOCATIONS
// =====================================

function getSelectedLocations() {

    return locations.filter(
        location =>
            selectedLocationIds.has(
                String(location.id)
            )
    );

}
// =====================================
// UPDATE BUTTONS
// =====================================

function updateActionButtons() {

    const hasSelection =
        selectedLocationIds.size > 0;

    const gotoSelectedBtn =
        document.getElementById(
            "goto-selected-btn"
        );

    const shareSelectedBtn =
        document.getElementById(
            "share-selected-btn"
        );

    const deleteSelectedBtn =
        document.getElementById(
            "delete-selected-btn"
        );


    if (gotoSelectedBtn) {

        gotoSelectedBtn.disabled =
            !hasSelection;

    }


    if (shareSelectedBtn) {

        shareSelectedBtn.disabled =
            !hasSelection;

    }


    if (deleteSelectedBtn) {

        deleteSelectedBtn.disabled =
            !hasSelection;

    }

}
// =====================================
// GO TO SELECTED
// =====================================

function goToSelected() {

    const selected =
        getSelectedLocations();


    if (selected.length === 0) {

        alert(
            "Please select at least one point."
        );

        return;

    }


    if (selected.length > 9) {

        alert(
            "Maximum 9 points can be selected for navigation.\n\n" +
            "Upgrade to Fix-Pin Pro for unlimited routes."
        );

        return;

    }


    const validLocations =
        selected.filter(
            isValidLocation
        );


    if (
        validLocations.length !==
        selected.length
    ) {

        alert(
            "One or more selected points have invalid coordinates."
        );

        return;

    }


    const destination =
        validLocations[
            validLocations.length - 1
        ];

    const destinationCoordinates =
        getCoordinates(
            destination
        );


    const params =
        new URLSearchParams({
            api: "1",
            destination:
                destinationCoordinates,
            travelmode: "driving"
        });


    if (
        validLocations.length > 1
    ) {

        const waypoints =
            validLocations
                .slice(0, -1)
                .map(getCoordinates)
                .join("|");

        params.set(
            "waypoints",
            waypoints
        );

    }


    const googleMapsUrl =
        "https://www.google.com/maps/dir/?" +
        params.toString();


    window.location.href =
        googleMapsUrl;

}
// =====================================
// SHARE SELECTED
// =====================================

function shareSelected() {

    const selected =
        getSelectedLocations();


    if (selected.length === 0) {

        alert(
            "Please select at least one point."
        );

        return;

    }


    if (
        typeof shareFxpn !==
        "function"
    ) {

        alert(
            "FXPN sharing is not ready yet."
        );

        return;

    }


    shareFxpn(
        selected
    );

}
// =====================================
// DELETE SELECTED
// =====================================

function deleteSelected() {

    const selected =
        getSelectedLocations();


    if (selected.length === 0) {

        alert(
            "Please select at least one point."
        );

        return;

    }


    const message =
        selected.length === 1
            ? "Delete the selected point?"
            : `Delete ${selected.length} selected points?`;


    const confirmed =
        window.confirm(
            message
        );


    if (!confirmed) {
        return;
    }


    const selectedIds =
        selected.map(
            location =>
                location.id
        );


    deleteLocations(
        selectedIds
    );
// =====================================
// LOCATION VALIDATION
// =====================================

function isValidLocation(
    location
) {

    const lat =
        Number(location.lat);

    const lng =
        Number(
            location.lng ??
            location.lon
        );


    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );

}
    // =====================================
// COORDINATES
// =====================================

function getCoordinates(
    location
) {

    const lat =
        Number(location.lat);

    const lng =
        Number(
            location.lng ??
            location.lon
        );


    return `${lat},${lng}`;

}
    // =====================================
// BACK
// =====================================

function openMainPage() {

    window.location.href =
        "index.html";

}

    selectedLocationIds.clear();

    loadLocations();

}
