"use strict";

/*
=========================================
FIX-PIN
storage.js
Local Storage
=========================================
*/


const STORAGE_KEY =
    "fixpin_locations";


// =====================================
// GET ALL
// =====================================

function getLocations() {

    const data =
        localStorage.getItem(STORAGE_KEY);

    if (!data) {
        return [];
    }

    try {

        return JSON.parse(data);

    } catch (error) {

        console.error(error);

        return [];

    }

}


// =====================================
// SAVE ALL
// =====================================

function saveLocations(locations) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(locations)
    );

}


// =====================================
// ADD
// =====================================

function addLocation(location) {

    const locations =
        getLocations();

    locations.push(location);

    saveLocations(locations);

}


// =====================================
// DELETE BY ID
// =====================================

function deleteLocation(id) {

    const locations =
        getLocations();

    const filtered =
        locations.filter(location =>
            location.id !== id
        );

    saveLocations(filtered);

}


// =====================================
// DELETE MULTIPLE
// =====================================

function deleteLocations(ids) {

    const locations =
        getLocations();

    const filtered =
        locations.filter(location =>
            !ids.includes(location.id)
        );

    saveLocations(filtered);

}


// =====================================
// CLEAR
// =====================================

function clearLocations() {

    localStorage.removeItem(
        STORAGE_KEY
    );

}
