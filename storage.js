"use strict";

/*
=========================================
FIX-PIN
storage.js
Local Storage Module
=========================================
*/

const FixPinStorage = (() => {

    // =====================================
    // CONFIG
    // =====================================

    const STORAGE_KEY = "fixpin.points";


    // =====================================
    // GET ALL
    // =====================================

    function getAll() {

        try {

            const data =
                localStorage.getItem(STORAGE_KEY);

            if (!data) {
                return [];
            }

            const points =
                JSON.parse(data);

            if (!Array.isArray(points)) {
                return [];
            }

            return points;

        } catch (error) {

            console.error(error);

            return [];
        }

    }


    // =====================================
    // SAVE ALL
    // =====================================

    function saveAll(points) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(points)
        );

    }


    // =====================================
    // GET BY ID
    // =====================================

    function getById(id) {

        return getAll().find(
            point => point.id === id
        ) || null;

    }


    // =====================================
    // SAVE
    // =====================================

    function save(point) {

        const points =
            getAll();

        points.push(point);

        saveAll(points);

        return point;

    }


    // =====================================
    // UPDATE
    // =====================================

    function update(id, newData) {

        const points =
            getAll();

        const index =
            points.findIndex(
                point => point.id === id
            );

        if (index === -1) {
            return false;
        }

        points[index] = {

            ...points[index],
            ...newData

        };

        saveAll(points);

        return true;

    }


    // =====================================
    // REMOVE
    // =====================================

    function remove(id) {

        const points =
            getAll();

        const filtered =
            points.filter(
                point => point.id !== id
            );

        saveAll(filtered);

        return filtered.length !== points.length;

    }


    // =====================================
    // CLEAR
    // =====================================

    function clear() {

        localStorage.removeItem(
            STORAGE_KEY
        );

    }


    // =====================================
    // EXISTS
    // =====================================

    function exists(id) {

        return getAll().some(
            point => point.id === id
        );

    }


    // =====================================
    // COUNT
    // =====================================

    function count() {

        return getAll().length;

    }


    // =====================================
    // GENERATE ID
    // =====================================

    function generateId() {

        if (
            window.crypto &&
            crypto.randomUUID
        ) {

            return crypto.randomUUID();

        }

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );

    }


    // =====================================
    // CREATE POINT
    // =====================================

    function createPoint(lat, lng, note = "") {

        return {

            id: generateId(),

            lat: Number(lat),

            lng: Number(lng),

            note: note.trim(),

            created: Date.now()

        };

    }


    // =====================================
    // PUBLIC API
    // =====================================

    return {

        getAll,
        getById,

        save,
        update,
        remove,
        clear,

        exists,
        count,

        generateId,
        createPoint

    };

})();


window.FixPinStorage =
    FixPinStorage;
