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

// Selection uses original storage positions to handle duplicate point IDs.
// Sorting and filtering do not change these positions.
const selectedPointIds = new Set();


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

    menuButton: null,

    closeMenuButton: null,

    menuOverlay: null,

    appMenu: null,

    aboutButton: null,

    aboutDialog: null,

    closeAboutButton: null,

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

    createBulkToolbar();

    createRefreshMenuItem();

    createHistoryMenuItem();

    createSheetsMenuItem();

    renderList();

    registerServiceWorker();

}
function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 1800);

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

    elements.menuButton =
        document.getElementById(
            "menuBtn"
        );

    elements.closeMenuButton =
        document.getElementById(
            "closeMenuBtn"
        );

    elements.menuOverlay =
        document.getElementById(
            "menuOverlay"
        );

    elements.appMenu =
        document.getElementById(
            "appMenu"
        );

    elements.aboutButton =
        document.getElementById(
            "aboutBtn"
        );

    elements.aboutDialog =
        document.getElementById(
            "aboutDialog"
        );

    elements.closeAboutButton =
        document.getElementById(
            "closeAboutBtn"
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
        () => {

            closeMenu();

            openFileDialog();

        }
    );

    elements.saveFileButton.addEventListener(
        "click",
        () => {

            closeMenu();

            savePointsToFile();

        }
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

    elements.menuButton.addEventListener(
        "click",
        openMenu
    );

    elements.closeMenuButton.addEventListener(
        "click",
        closeMenu
    );

    elements.menuOverlay.addEventListener(
        "click",
        closeMenu
    );

    elements.aboutButton.addEventListener(
        "click",
        openAboutDialog
    );

    elements.closeAboutButton.addEventListener(
        "click",
        closeAboutDialog
    );

    elements.aboutDialog.addEventListener(
        "click",
        handleAboutBackdropClick
    );

    document.addEventListener(
        "keydown",
        handleDocumentKeydown
    );

}


// =====================================
// MENU
// =====================================

function openMenu() {

    elements.appMenu.hidden = false;

    elements.menuOverlay.hidden = false;

    elements.menuButton.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.classList.add(
        "menu-open"
    );

    elements.closeMenuButton.focus();

}


function closeMenu() {

    if (elements.appMenu.hidden) {
        return;
    }

    elements.appMenu.hidden = true;

    elements.menuOverlay.hidden = true;

    elements.menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.classList.remove(
        "menu-open"
    );

}


// =====================================
// REFRESH APP (keeps localStorage and saved points)
// =====================================



function createRefreshMenuItem() {
    if (document.getElementById("refreshAppBtn")) return;

    const button = document.createElement("button");
    button.id = "refreshAppBtn";
    button.type = "button";
    button.className = "menu-item";

    const icon = document.createElement("i");
    icon.className = "ph ph-arrows-clockwise";
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = "Refresh App";

    button.append(icon, label);

    elements.appMenu.insertBefore(
        button,
        elements.aboutButton
    );

    button.addEventListener(
        "click",
        refreshFixPinApp
    );
}

function refreshFixPinApp() {
    closeMenu();
    window.location.reload();
}


// =====================================
// ABOUT
// =====================================

function openAboutDialog() {

    closeMenu();

    if (
        typeof elements.aboutDialog.showModal ===
        "function"
    ) {

        elements.aboutDialog.showModal();

        return;

    }

    elements.aboutDialog.setAttribute(
        "open",
        ""
    );

}


function closeAboutDialog() {

    if (
        typeof elements.aboutDialog.close ===
        "function" &&
        elements.aboutDialog.open
    ) {

        elements.aboutDialog.close();

        return;

    }

    elements.aboutDialog.removeAttribute(
        "open"
    );

}


function handleAboutBackdropClick(event) {

    if (event.target === elements.aboutDialog) {
        closeAboutDialog();
    }

}


function handleDocumentKeydown(event) {

    if (event.key !== "Escape") {
        return;
    }

    if (!elements.appMenu.hidden) {

        closeMenu();

        elements.menuButton.focus();

    }

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

        showMessage("✓ Pin saved");

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
        ).sort((a, b) =>
            getPointTitle(a.point, a.originalIndex).localeCompare(
                getPointTitle(b.point, b.originalIndex),
                undefined,
                { sensitivity: "base", numeric: true }
            )
        );

    // Drop positions that no longer exist.
    for (const index of selectedPointIds) {
        if (!Number.isInteger(index) || index < 0 || index >= points.length) {
            selectedPointIds.delete(index);
        }
    }

    elements.dataList.replaceChildren();
    updateBulkToolbar(filteredEntries);

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


    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "point-select-checkbox";
    checkbox.checked = selectedPointIds.has(index);
    checkbox.setAttribute("aria-label", `Select ${getPointTitle(point, index)}`);
    if (checkbox.checked) {
        const selectionNumber = [...selectedPointIds].indexOf(index) + 1;
        const orderBadge = document.createElement("span");
        orderBadge.textContent = `${selectionNumber}. `;
        orderBadge.title = `Selection order: ${selectionNumber}`;
        orderBadge.style.cssText = "color:#2563eb;font-weight:bold;margin-right:5px";
        title.prepend(orderBadge);
    }
    checkbox.addEventListener("change", () => {
        if (checkbox.checked) selectedPointIds.add(index);
        else selectedPointIds.delete(index);
        // Refresh numbering after every selection or deselection.
        renderList();
    });

    title.classList.add("point-title-clickable");
    title.title = "Show or hide on map";
    title.tabIndex = 0;
    title.setAttribute("role", "button");
    title.addEventListener("click", () => togglePointOnMap(point, index));
    title.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            togglePointOnMap(point, index);
        }
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "point-edit-button";
    editButton.textContent = "✎";
    editButton.title = "Edit point";
    editButton.setAttribute("aria-label", `Edit ${getPointTitle(point, index)}`);
    editButton.addEventListener("click", () => openPointEditor(index));

    listItem.appendChild(title);
    listItem.appendChild(editButton);
    listItem.appendChild(checkbox);

    return listItem;

}


// =====================================
// BULK SELECTION AND ACTIONS
// =====================================
function createBulkToolbar() {
    const toolbar = document.createElement("div");
    toolbar.id = "bulkToolbar";
    toolbar.className = "bulk-toolbar";

    const allLabel = document.createElement("label");
    allLabel.className = "bulk-all-label";
    const allCheckbox = document.createElement("input");
    allCheckbox.type = "checkbox";
    allCheckbox.id = "selectAllPoints";
    allLabel.append(allCheckbox, document.createTextNode(" ALL"));

    const shareButton = document.createElement("button");
    shareButton.type = "button";
    shareButton.id = "shareSelectedPoints";
    shareButton.textContent = "Share (0)";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.id = "deleteSelectedPoints";
    deleteButton.textContent = "Delete (0)";

    toolbar.append(allLabel, shareButton, deleteButton);
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.id = "addManualPoint";
    addButton.textContent = "+ Add Point";
    addButton.addEventListener("click", () => openPointEditor(null));
    toolbar.appendChild(addButton);
    elements.dataList.before(toolbar);

    allCheckbox.addEventListener("change", () => {
        const entries = getFilteredEntries(FixPinStorage.getAll(), searchText)
            .sort((a, b) => getPointTitle(a.point, a.originalIndex).localeCompare(
                getPointTitle(b.point, b.originalIndex), undefined,
                {sensitivity: "base", numeric: true}
            ));
        for (const {originalIndex} of entries) {
            if (allCheckbox.checked) selectedPointIds.add(originalIndex);
            else selectedPointIds.delete(originalIndex);
        }
        renderList();
    });
    shareButton.addEventListener("click", shareSelectedPoints);
    deleteButton.addEventListener("click", deleteSelectedPoints);
}

function updateBulkToolbar(entries = null) {
    const toolbar = document.getElementById("bulkToolbar");
    if (!toolbar) return;
    const visible = entries || getFilteredEntries(FixPinStorage.getAll(), searchText);
    const checkedCount = visible.filter(({originalIndex}) => selectedPointIds.has(originalIndex)).length;
    const all = toolbar.querySelector("#selectAllPoints");
    all.checked = visible.length > 0 && checkedCount === visible.length;
    all.indeterminate = checkedCount > 0 && checkedCount < visible.length;
    all.disabled = visible.length === 0;
    const total = selectedPointIds.size;
    const share = toolbar.querySelector("#shareSelectedPoints");
    const del = toolbar.querySelector("#deleteSelectedPoints");
    share.textContent = `Share (${total})`;
    del.textContent = `Delete (${total})`;
    share.disabled = del.disabled = total === 0;
}

function getSelectedEntries() {
    const points = FixPinStorage.getAll();
    // Set preserves checkbox selection order, regardless of list sorting.
    return [...selectedPointIds]
        .filter(index => Number.isInteger(index) && index >= 0 && index < points.length)
        .map(originalIndex => ({point: points[originalIndex], originalIndex}));
}

async function shareSelectedPoints() {
    const entries = getSelectedEntries();
    if (!entries.length) return;
    if (entries.some(({point}) => !hasValidCoordinates(point))) {
        showMessage("One or more selected points have invalid coordinates.");
        return;
    }

    const employeeKey = "fixpin.lastEmployee";
    const answer = window.prompt("Employee name:", localStorage.getItem(employeeKey) || "");
    if (answer === null) return;
    const employee = answer.trim();
    if (!employee) {
        showMessage("Enter the employee name.");
        return;
    }

    const locations = entries.map(({point, originalIndex}, i) => ({
        order: i + 1,
        name: getPointTitle(point, originalIndex),
        lat: Number(point.lat),
        lng: Number(point.lng)
    }));
    const text = locations.map(p => `${p.name}\n${getSharedMapsUrl(p)}`).join("\n\n");

    // History is recorded when sharing is initiated, not proof of delivery.
    try {
        const history = readAssignmentHistory();
        history.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            createdAt: new Date().toISOString(),
            employee,
            locations
        });
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        localStorage.setItem(employeeKey, employee);
    } catch (error) {
        console.error("Fix-Pin history could not be saved:", error);
        showMessage("History could not be saved. Sharing was cancelled to avoid losing the record.");
        return;
    }

    await sendSharedText("Fix-Pin locations", text);
}


function createSheetsMenuItem() {
    if (document.getElementById("sheetsBtn")) return;
    const button = document.createElement("button");
    button.id = "sheetsBtn";
    button.type = "button";
    button.className = "menu-item";
    const icon = document.createElement("i");
    icon.className = "ph ph-table";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = "Fix-Pin Sheets";
    button.append(icon, label);
    elements.appMenu.insertBefore(button, elements.aboutButton);
    button.addEventListener("click", () => {
        closeMenu();
        window.location.href = "./sheets.html";
    });
}

// =====================================
// LOCAL ASSIGNMENT HISTORY (no cloud database)
// =====================================
const HISTORY_STORAGE_KEY = "fixpin.assignmentHistory.v1";

function readAssignmentHistory() {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) throw new Error("Invalid local history data.");
    return value;
}

function createHistoryMenuItem() {
    if (document.getElementById("historyBtn")) return;
    const button = document.createElement("button");
    button.id = "historyBtn";
    button.type = "button";
    button.className = "menu-item";
    const icon = document.createElement("i");
    icon.className = "ph ph-clock-counter-clockwise";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = "HISTORY";
    button.append(icon, label);
    elements.appMenu.insertBefore(button, elements.aboutButton);
    button.addEventListener("click", () => {
        closeMenu();
        openHistoryDialog();
    });
}

function openHistoryDialog() {
    let history;
    try { history = readAssignmentHistory(); }
    catch (error) {
        showMessage("Unable to read local history: " + error.message);
        return;
    }
    const dialog = document.createElement("dialog");
    dialog.setAttribute("aria-label", "Assignment history");
    dialog.style.cssText = "border:0;border-radius:14px;padding:20px;max-width:760px;width:94%;max-height:85vh;box-shadow:0 8px 40px #0003";
    const heading = document.createElement("h2");
    heading.textContent = "Assignment History";
    const explanation = document.createElement("p");
    explanation.textContent = "Saved on this device only. Entries show sharing started, not confirmed WhatsApp delivery.";
    const content = document.createElement("div");
    content.style.cssText = "max-height:55vh;overflow:auto;display:grid;gap:10px";
    if (!history.length) {
        content.textContent = "No assignments yet.";
    } else {
        [...history].reverse().forEach(item => {
            const card = document.createElement("div");
            card.style.cssText = "padding:10px;border:1px solid #ccc;border-radius:8px";
            const title = document.createElement("strong");
            const date = new Date(item.createdAt);
            title.textContent = `${Number.isNaN(date.getTime()) ? item.createdAt : date.toLocaleString()} — ${item.employee}`;
            const list = document.createElement("ol");
            (item.locations || []).forEach(p => {
                const li = document.createElement("li");
                li.textContent = p.name;
                list.appendChild(li);
            });
            card.append(title, list);
            content.appendChild(card);
        });
    }
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin-top:16px";
    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.textContent = "Export CSV";
    exportButton.disabled = history.length === 0;
    exportButton.addEventListener("click", () => exportAssignmentHistoryCsv(history));
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => dialog.close());
    actions.append(exportButton, closeButton);
    dialog.append(heading, explanation, content, actions);
    dialog.addEventListener("close", () => dialog.remove());
    document.body.appendChild(dialog);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
}

function exportAssignmentHistoryCsv(history) {
    // Leading apostrophe protects Excel/Calc against formula injection.
    const csvCell = value => {
        let s = String(value ?? "");
        if (/^[\s\u0000-\u001f]*[=+@-]/.test(s)) s = "'" + s;
        return '"' + s.replace(/"/g, '""') + '"';
    };
    const rows = [["Date", "Employee", "Assignment ID", "Order", "Address", "Latitude", "Longitude", "Status"]];
    history.forEach(item => (item.locations || []).forEach((p, i) => {
        rows.push([item.createdAt, item.employee, item.id, p.order || i + 1,
            p.name, p.lat, p.lng, "Sharing initiated"]);
    }));
    const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
    const url = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "FixPin_History.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function getSharedMapsUrl(point) {
    return "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(`${point.lat},${point.lng}`);
}

async function sendSharedText(title, text) {
    if (navigator.share) {
        try {
            await navigator.share({title, text});
            return;
        } catch (error) {
            if (error?.name === "AbortError") return;
            console.error("Fix-Pin: share failed", error);
        }
    }
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            showMessage("Copied. Paste into WhatsApp or another messenger.");
            return;
        }
    } catch (error) {
        console.error("Fix-Pin: clipboard failed", error);
    }
    window.prompt("Copy message:", text);
}

function deleteSelectedPoints() {
    const entries = getSelectedEntries();
    if (!entries.length) return;
    if (!window.confirm(`Delete ${entries.length} selected point(s)? This cannot be undone.`)) return;
    try {
        // Update storage first, then map; avoid mutating storage during a read loop.
        const positions = new Set(entries.map(({originalIndex}) => originalIndex));
        const remaining = FixPinStorage.getAll().filter((point, index) => !positions.has(index));
        FixPinStorage.replaceAll(remaining);
        const remainingIds = new Set(remaining.map(point => String(point.id)));
        for (const {point} of entries) {
            if (!remainingIds.has(String(point.id))) FixPinMap.removeSavedMarker(point.id);
        }
        selectedPointIds.clear();
        renderList();
        showMessage(`${entries.length} point(s) deleted.`);
    } catch (error) {
        console.error(error);
        showMessage(error.message || "Unable to delete selected points.");
    }
}


// =====================================
// POINT EDITOR (Photon address search + manual map selection)
// =====================================
function openPointEditor(originalIndex) {
    const editing = originalIndex !== null;
    const existing = editing ? FixPinStorage.getAll()[originalIndex] : null;
    if (editing && !existing) { showMessage("Point no longer exists."); return; }

    const dialog = document.createElement("dialog");
    dialog.className = "point-editor-dialog";
    const form = document.createElement("form");
    form.className = "point-editor-form";
    form.addEventListener("submit", event => event.preventDefault());
    const heading = document.createElement("h2");
    heading.textContent = editing ? "Edit Point" : "Add Point";
    form.appendChild(heading);

    const label = document.createElement("label");
    label.textContent = "Name / Address";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Enter an address or point name";
    nameInput.value = existing?.note || "";
    label.appendChild(nameInput);
    form.appendChild(label);

    // Address search is explicit (button click), not a request on every keystroke.
    const searchButton = document.createElement("button");
    searchButton.type = "button";
    searchButton.textContent = "🔎 Find Address";
    const searchStatus = document.createElement("p");
    searchStatus.className = "point-editor-help";
    searchStatus.setAttribute("role", "status");
    const searchResults = document.createElement("div");
    searchResults.className = "point-address-results";
    searchResults.style.cssText = "display:grid;gap:6px;max-height:180px;overflow-y:auto;margin:8px 0";
    form.append(searchButton, searchStatus, searchResults);

    const positionInfo = document.createElement("p");
    positionInfo.className = "point-editor-help";
    positionInfo.textContent = existing
        ? "Current location is saved. Choose a different location on the map if needed."
        : "Choose the location on the map to save this point.";
    form.appendChild(positionInfo);

    let chosen = existing ? {lat: Number(existing.lat), lng: Number(existing.lng)} : null;
    let picking = false;
    let hint = null;
    let preview = null;
    const map = FixPinMap.getMap();
    let searchController = null;

    function formatPhotonResult(properties) {
        const p = properties || {};
        const street = [p.street, p.housenumber].filter(Boolean).join(" ");
        const parts = [p.name, street, p.city || p.locality, p.state, p.country]
            .filter(Boolean);
        return [...new Set(parts)].join(", ") || "Unnamed location";
    }

    searchButton.addEventListener("click", async () => {
        const query = nameInput.value.trim();
        if (query.length < 3) {
            searchStatus.textContent = "Enter at least 3 characters.";
            return;
        }
        if (searchController) searchController.abort();
        const controller = new AbortController();
        searchController = controller;
        searchResults.replaceChildren();
        searchStatus.textContent = "Searching addresses…";
        searchButton.disabled = true;
        try {
            const url = "https://photon.komoot.io/api/?" +
                new URLSearchParams({q: query, limit: "5"}).toString();
            const response = await fetch(url, {signal: controller.signal});
            if (!response.ok) throw new Error("Search service unavailable (" + response.status + ").");
            const data = await response.json();
            if (!Array.isArray(data.features)) throw new Error("Unexpected search response.");
            const matches = data.features.filter(item =>
                item?.geometry?.type === "Point" &&
                Array.isArray(item.geometry.coordinates) &&
                Number.isFinite(Number(item.geometry.coordinates[0])) &&
                Number.isFinite(Number(item.geometry.coordinates[1])) &&
                Math.abs(Number(item.geometry.coordinates[0])) <= 180 &&
                Math.abs(Number(item.geometry.coordinates[1])) <= 90
            );
            searchStatus.textContent = matches.length
                ? "Choose a result, then check its position on the map."
                : "No addresses found. Try a longer address or Choose on Map.";
            matches.forEach(item => {
                const option = document.createElement("button");
                option.type = "button";
                option.textContent = formatPhotonResult(item.properties);
                option.style.cssText = "text-align:left;padding:8px;white-space:normal";
                option.addEventListener("click", () => {
                    const [lng, lat] = item.geometry.coordinates.map(Number);
                    chosen = {lat, lng};
                    removePreview();
                    if (map) {
                        preview = L.marker([lat, lng]).addTo(map);
                        map.setView([lat, lng], Math.max(map.getZoom(), 17));
                    }
                    positionInfo.textContent = "Address found. Check the map; use Choose on Map to correct the location if needed.";
                    searchStatus.textContent = "Location selected. Save Point to confirm.";
                    searchResults.replaceChildren();
                });
                searchResults.appendChild(option);
            });
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Fix-Pin: Photon search", error);
                searchStatus.textContent = "Address search failed. Try again or Choose on Map.";
            }
        } finally {
            if (searchController === controller) {
                searchController = null;
                searchButton.disabled = false;
            }
        }
    });

    const chooseButton = document.createElement("button");
    chooseButton.type = "button";
    chooseButton.textContent = "📍 Choose on Map";
    form.appendChild(chooseButton);

    const buttons = document.createElement("div");
    buttons.className = "point-editor-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "Save Point";
    save.className = "point-editor-save";
    buttons.append(cancel, save);
    form.appendChild(buttons);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    function removePreview() {
        if (preview && map) map.removeLayer(preview);
        preview = null;
    }
    function cleanupPicker() {
        if (map) map.off("click", onMapPick);
        if (hint) hint.remove();
        hint = null;
        picking = false;
    }
    function closeEditor() {
        if (searchController) searchController.abort();
        cleanupPicker();
        removePreview();
        if (dialog.open) dialog.close();
        dialog.remove();
    }
    function onMapPick(event) {
        chosen = {lat: event.latlng.lat, lng: event.latlng.lng};
        cleanupPicker();
        removePreview();
        preview = L.marker([chosen.lat, chosen.lng]).addTo(map);
        positionInfo.textContent = "Location selected on map. Click Save Point to confirm.";
        dialog.showModal();
        nameInput.focus();
    }
    chooseButton.addEventListener("click", () => {
        if (!map) { showMessage("Map is not ready."); return; }
        dialog.close();
        picking = true;
        hint = document.createElement("div");
        hint.className = "point-map-picker-hint";
        const message = document.createElement("span");
        message.textContent = "Move or zoom the map, then click the exact location.";
        const stop = document.createElement("button");
        stop.type = "button";
        stop.textContent = "Cancel selection";
        stop.addEventListener("click", () => {
            cleanupPicker();
            dialog.showModal();
        });
        hint.append(message, stop);
        document.body.appendChild(hint);
        map.on("click", onMapPick);
        FixPinMap.refreshMapSize();
    });
    cancel.addEventListener("click", closeEditor);
    dialog.addEventListener("cancel", event => {
        event.preventDefault();
        closeEditor();
    });
    save.addEventListener("click", () => {
        if (!chosen) { showMessage("Choose a location on the map first."); return; }
        try {
            if (editing) {
                const points = FixPinStorage.getAll();
                if (!points[originalIndex]) throw new Error("Point no longer exists.");
                const old = points[originalIndex];
                points[originalIndex] = {
                    ...old, lat: chosen.lat, lng: chosen.lng,
                    note: nameInput.value.trim() || old.note
                };
                FixPinStorage.saveAll(points);
                if (FixPinMap.hasSavedMarker(old.id)) FixPinMap.updateSavedMarker(points[originalIndex]);
            } else {
                const point = FixPinStorage.createPoint(chosen.lat, chosen.lng, nameInput.value.trim());
                FixPinStorage.save(point);
            }
            selectedPointIds.clear();
            renderList();
            closeEditor();
            showToast(editing ? "Point updated" : "Point added");
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Unable to save point.");
        }
    });
    dialog.showModal();
    nameInput.focus();
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

    // Go To uses checked points, independently of map markers.
    const entries = getSelectedEntries();
    const points = entries.map(({point}) => point);

    if (points.length === 0) {
        showMessage("Select at least one point using its checkbox.");
        return;
    }

    if (points.length > 9) {
        showProLimitMessage();
        return;
    }

    if (!points.every(hasValidCoordinates)) {
        showMessage("One or more selected points have invalid coordinates.");
        return;
    }

    // The last point selected by checkbox is the destination.
    // Earlier points become waypoints.
    const destination = encodeCoordinatePair(points[points.length - 1]);
    let url = "https://www.google.com/maps/dir/?api=1" +
        `&destination=${destination}`;

    if (points.length > 1) {
        const waypoints = points.slice(0, -1)
            .map(encodeCoordinatePair)
            .join("%7C");
        url += `&waypoints=${waypoints}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
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
// SHARE POINT
// =====================================

async function sharePoint(
    point,
    index
) {

    if (!hasValidCoordinates(point)) {

        showMessage(
            "This point has invalid coordinates."
        );

        return;

    }

    const title =
        getPointTitle(
            point,
            index
        );

    const latitude =
        Number(point.lat);

    const longitude =
        Number(point.lng);

    const mapsUrl =
        "https://www.google.com/maps/search/" +
        "?api=1" +
        `&query=${encodeURIComponent(
            `${latitude},${longitude}`
        )}`;

    const shareText =
        `${title}\n${mapsUrl}`;

    if (navigator.share) {

        try {

            await navigator.share({

                title:
                    title,

                text:
                    shareText

            });

            return;

        } catch (error) {

            if (
                error &&
                error.name === "AbortError"
            ) {
                return;
            }

            console.error(
                "Fix-Pin: share failed.",
                error
            );

        }

    }

    if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText ===
        "function"
    ) {

        try {

            await navigator.clipboard.writeText(
                shareText
            );

            showMessage(
                "Location copied to clipboard."
            );

            return;

        } catch (error) {

            console.error(
                "Fix-Pin: clipboard failed.",
                error
            );

        }

    }

    window.prompt(
        "Copy this location:",
        shareText
    );

}
// =====================================
// DELETE POINT
// =====================================

function deletePoint(
    point,
    index
) {

    const title =
        getPointTitle(
            point,
            index
        );

    const confirmed =
        window.confirm(
            `Delete "${title}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        FixPinMap.removeSavedMarker(
            point.id
        );

        FixPinStorage.remove(
            point.id
        );

        renderList();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to delete the point."
        );

    }

}
// =====================================
// SAVE TO FILE
// =====================================

async function savePointsToFile() {

    try {

        const points =
            FixPinStorage.getAll();

        if (points.length === 0) {

            showMessage(
                "There are no saved points."
            );

            return;

        }

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

        showMessage(
            "File saved successfully."
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to save the file."
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
        event.target.files?.[0];

    if (!file) {
        return;
    }

    try {

        const importedPoints =
            await FixPinFiles.importPoints(file);

        if (!Array.isArray(importedPoints)) {

            throw new Error(
                "Invalid file."
            );

        }

        const localPoints =
            FixPinStorage.getAll();

        const combinedPoints = [
            ...localPoints
        ];

        let addedCount = 0;
        let duplicateCount = 0;

        importedPoints.forEach(
            importedPoint => {

                const duplicate =
                    combinedPoints.some(
                        savedPoint => {

                            const sameLatitude =
                                Number(savedPoint.lat) ===
                                Number(importedPoint.lat);

                            const sameLongitude =
                                Number(savedPoint.lng) ===
                                Number(importedPoint.lng);

                            const sameNote =
                                String(
                                    savedPoint.note || ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                String(
                                    importedPoint.note || ""
                                )
                                    .trim()
                                    .toLowerCase();

                            return (
                                sameLatitude &&
                                sameLongitude &&
                                sameNote
                            );

                        }
                    );

                if (duplicate) {

                    duplicateCount++;

                    return;

                }

                combinedPoints.push(
                    importedPoint
                );

                addedCount++;

            }
        );

        FixPinStorage.replaceAll(
            combinedPoints
        );

        FixPinMap.clearSavedMarkers();
        selectedPointIds.clear();

        renderList();

        showMessage(
            `Added: ${addedCount}. ` +
            `Duplicates skipped: ${duplicateCount}.`
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Unable to open the file."
        );

    } finally {

        elements.fileInput.value = "";

    }

}
// =====================================
// NOTE
// =====================================

function handleNoteKeydown(event) {

    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();

    saveCurrentPoint();

}


// =====================================
// BUTTON
// =====================================

function setButtonBusy(
    button,
    busy
) {

    if (!button) {
        return;
    }

    button.disabled = busy;

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
                    "./service-worker.js"
                )
                .catch(error => {

                    console.error(
                        "Service Worker:",
                        error
                    );

                });

        }
    );

}
