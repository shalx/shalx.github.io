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

    const STORAGE_KEY =
        "fixpin.points";


    // =====================================
    // GET ALL
    // =====================================

    function getAll() {

        try {

            const data =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!data) {
                return [];
            }

            const parsedData =
                JSON.parse(data);

            if (!Array.isArray(parsedData)) {
                return [];
            }

            return parsedData
                .map(normalizePoint)
                .filter(Boolean);

        } catch (error) {

            console.error(
                "Fix-Pin: unable to read points.",
                error
            );

            return [];
        }

    }


    // =====================================
    // SAVE ALL
    // =====================================

    function saveAll(points) {

        if (!Array.isArray(points)) {

            throw new TypeError(
                "Points must be an array."
            );

        }

        const normalizedPoints =
            points
                .map(normalizePoint)
                .filter(Boolean);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                normalizedPoints
            )
        );

        return normalizedPoints;

    }


    // =====================================
    // GET BY ID
    // =====================================

    function getById(id) {

        const normalizedId =
            String(id || "");

        return (
            getAll().find(
                point =>
                    point.id === normalizedId
            ) ||
            null
        );

    }


    // =====================================
    // SAVE
    // =====================================

    function save(point) {

        const normalizedPoint =
            normalizePoint(point);

        if (!normalizedPoint) {

            throw new TypeError(
                "Invalid point."
            );

        }

        const points =
            getAll();

        const existingIndex =
            points.findIndex(
                savedPoint =>
                    savedPoint.id ===
                    normalizedPoint.id
            );

        if (existingIndex === -1) {

            points.push(
                normalizedPoint
            );

        } else {

            points[existingIndex] =
                normalizedPoint;

        }

        saveAll(points);

        return normalizedPoint;

    }


    // =====================================
    // UPDATE
    // =====================================

    function update(id, newData) {

        const normalizedId =
            String(id || "");

        const points =
            getAll();

        const index =
            points.findIndex(
                point =>
                    point.id === normalizedId
            );

        if (index === -1) {
            return false;
        }

        const updatedPoint =
            normalizePoint({

                ...points[index],
                ...newData,

                id: points[index].id

            });

        if (!updatedPoint) {
            return false;
        }

        points[index] =
            updatedPoint;

        saveAll(points);

        return true;

    }


    // =====================================
    // REMOVE
    // =====================================

    function remove(id) {

        const normalizedId =
            String(id || "");

        const points =
            getAll();

        const filteredPoints =
            points.filter(
                point =>
                    point.id !== normalizedId
            );

        if (
            filteredPoints.length ===
            points.length
        ) {

            return false;

        }

        saveAll(filteredPoints);

        return true;

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
    // REPLACE ALL
    // =====================================

    function replaceAll(points) {

        clear();

        return saveAll(points);

    }


    // =====================================
    // EXISTS
    // =====================================

    function exists(id) {

        const normalizedId =
            String(id || "");

        return getAll().some(
            point =>
                point.id === normalizedId
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
            typeof crypto.randomUUID ===
                "function"
        ) {

            return crypto.randomUUID();

        }

        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );

    }


    // =====================================
    // CREATE POINT
    // =====================================

    function createPoint(
        lat,
        lng,
        note = ""
    ) {

        const latitude =
            Number(lat);

        const longitude =
            Number(lng);

        if (
            !isValidLatitude(latitude) ||
            !isValidLongitude(longitude)
        ) {

            throw new TypeError(
                "Invalid coordinates."
            );

        }

        const normalizedNote =
            createPointName(note);

        return {

            id: generateId(),

            lat: latitude,

            lng: longitude,

            note: normalizedNote,

            created: Date.now()

        };

    }


    // =====================================
    // DEFAULT POINT NAME
    // =====================================

    function createPointName(note) {

        const normalizedNote =
            String(note || "").trim();

        if (normalizedNote) {
            return normalizedNote;
        }

        return (
            "Point " +
            getNextPointNumber()
        );

    }


    function getNextPointNumber() {

        const points =
            getAll();

        let largestNumber = 0;

        points.forEach(point => {

            const match =
                String(point.note || "")
                    .trim()
                    .match(
                        /^Point\s+(\d+)$/i
                    );

            if (!match) {
                return;
            }

            const pointNumber =
                Number(match[1]);

            if (
                Number.isInteger(
                    pointNumber
                ) &&
                pointNumber >
                    largestNumber
            ) {

                largestNumber =
                    pointNumber;

            }

        });

        return largestNumber + 1;

    }


    // =====================================
    // NORMALIZE POINT
    // =====================================

    function normalizePoint(point) {

        if (
            !point ||
            typeof point !== "object"
        ) {

            return null;

        }

        const latitude =
            Number(point.lat);

        const longitude =
            Number(point.lng);

        if (
            !isValidLatitude(latitude) ||
            !isValidLongitude(longitude)
        ) {

            return null;

        }

        const id =
            typeof point.id === "string" &&
            point.id.trim()
                ? point.id.trim()
                : generateId();

        const note =
            String(point.note || "")
                .trim();

        const created =
            Number(point.created);

        return {

            id,

            lat: latitude,

            lng: longitude,

            note,

            created:
                Number.isFinite(created) &&
                created > 0
                    ? created
                    : Date.now()

        };

    }


    // =====================================
    // VALIDATION
    // =====================================

    function isValidLatitude(value) {

        return (
            Number.isFinite(value) &&
            value >= -90 &&
            value <= 90
        );

    }


    function isValidLongitude(value) {

        return (
            Number.isFinite(value) &&
            value >= -180 &&
            value <= 180
        );

    }


    // =====================================
    // PUBLIC API
    // =====================================

    return {

        getAll,
        getById,

        save,
        saveAll,
        replaceAll,

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
