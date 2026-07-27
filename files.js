"use strict";

/*
=========================================
FIX-PIN
files.js
Open / Save File Module
=========================================
*/

const FixPinFiles = (() => {

    // =====================================
    // CONFIG
    // =====================================

    const FORMAT =
        "FXPN";

    const VERSION =
        1;

    const APP_NAME =
        "Fix-Pin";

    const FILE_EXTENSION =
        ".fxpn";

    const MIME_TYPE =
        "application/json";


    // =====================================
    // SAVE TO FILE
    // =====================================

    async function exportPoints(points) {

        if (!Array.isArray(points)) {

            throw new TypeError(
                "Points must be an array."
            );

        }

        const normalizedPoints =
            normalizeExportPoints(points);

        const fileData = {

            format: FORMAT,

            version: VERSION,

            app: APP_NAME,

            exported: Date.now(),

            points: normalizedPoints

        };

        const content =
            JSON.stringify(
                fileData,
                null,
                2
            );

        const fileName =
            createFileName();

        /*
        =====================================
        FILE SYSTEM ACCESS API
        Desktop Chrome and supported browsers
        =====================================
        */

        if (
            typeof window.showSaveFilePicker ===
            "function"
        ) {

            try {

                await saveWithFilePicker(
                    fileName,
                    content
                );

                return {
                    saved: true,
                    method: "file-picker",
                    fileName
                };

            } catch (error) {

                /*
                User closed the system dialog.
                Do not start an automatic download.
                */

                if (
                    error &&
                    error.name ===
                        "AbortError"
                ) {

                    return {
                        saved: false,
                        cancelled: true,
                        fileName
                    };

                }

                console.warn(
                    "Fix-Pin: system save dialog failed.",
                    error
                );

            }

        }

        /*
        =====================================
        DOWNLOAD FALLBACK
        Android Chrome and other browsers
        =====================================
        */

        downloadFile(
            fileName,
            content
        );

        return {
            saved: true,
            method: "download",
            fileName
        };

    }


    // =====================================
    // SAVE WITH FILE PICKER
    // =====================================

    async function saveWithFilePicker(
        fileName,
        content
    ) {

        const handle =
            await window.showSaveFilePicker({

                suggestedName: fileName,

                types: [

                    {
                        description:
                            "Fix-Pin file",

                        accept: {

                            [MIME_TYPE]: [
                                FILE_EXTENSION
                            ]

                        }

                    }

                ]

            });

        const writable =
            await handle.createWritable();

        try {

            await writable.write(
                new Blob(
                    [content],
                    {
                        type:
                            `${MIME_TYPE};charset=utf-8`
                    }
                )
            );

            await writable.close();

        } catch (error) {

            try {
                await writable.abort();
            } catch {
                // Nothing else is required.
            }

            throw error;

        }

    }


    // =====================================
    // OPEN FILE
    // =====================================

    async function importPoints(file) {

        validateSelectedFile(file);

        const text =
            await readFile(file);

        const cleanText =
            removeByteOrderMark(text)
                .trim();

        if (!cleanText) {

            throw new Error(
                "The selected file is empty."
            );

        }

        let data;

        try {

            data =
                JSON.parse(cleanText);

        } catch (error) {

            console.error(
                "Fix-Pin: invalid JSON.",
                error
            );

            throw new Error(
                "The selected .fxpn file is damaged or invalid."
            );

        }

        validateFile(data);

        return normalizeImportedPoints(
            data.points
        );

    }


    // =====================================
    // SELECTED FILE VALIDATION
    // =====================================

    function validateSelectedFile(file) {

        if (!file) {

            throw new Error(
                "No file selected."
            );

        }

        if (
            typeof file.name ===
                "string" &&
            file.name &&
            !file.name
                .toLowerCase()
                .endsWith(FILE_EXTENSION)
        ) {

            throw new Error(
                "Please select a .fxpn file."
            );

        }

        if (
            typeof file.size ===
                "number" &&
            file.size === 0
        ) {

            throw new Error(
                "The selected file is empty."
            );

        }

    }


    // =====================================
    // READ FILE
    // =====================================

    function readFile(file) {

        /*
        Modern browsers support File.text().
        FileReader remains as fallback.
        */

        if (
            file &&
            typeof file.text ===
                "function"
        ) {

            return file.text();

        }

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();

                reader.onload = () => {

                    resolve(
                        String(
                            reader.result || ""
                        )
                    );

                };

                reader.onerror = () => {

                    reject(
                        new Error(
                            "Unable to read the selected file."
                        )
                    );

                };

                reader.onabort = () => {

                    reject(
                        new Error(
                            "File opening was cancelled."
                        )
                    );

                };

                reader.readAsText(
                    file,
                    "UTF-8"
                );

            }
        );

    }


    // =====================================
    // FILE VALIDATION
    // =====================================

    function validateFile(data) {

        if (
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Invalid Fix-Pin file."
            );

        }

        if (data.format !== FORMAT) {

            throw new Error(
                "This is not a Fix-Pin file."
            );

        }

        if (
            !Number.isInteger(
                data.version
            )
        ) {

            throw new Error(
                "Invalid Fix-Pin file version."
            );

        }

        if (data.version > VERSION) {

            throw new Error(
                "This file was created by a newer version of Fix-Pin."
            );

        }

        if (data.version < 1) {

            throw new Error(
                "Unsupported Fix-Pin file version."
            );

        }

        if (
            !Array.isArray(
                data.points
            )
        ) {

            throw new Error(
                "The file does not contain a valid points list."
            );

        }

        data.points.forEach(
            (point, index) => {

                validatePoint(
                    point,
                    index
                );

            }
        );

        return true;

    }


    // =====================================
    // POINT VALIDATION
    // =====================================

    function validatePoint(
        point,
        index
    ) {

        const position =
            index + 1;

        if (
            !point ||
            typeof point !==
                "object" ||
            Array.isArray(point)
        ) {

            throw new Error(
                `Point ${position} is invalid.`
            );

        }

        const latitude =
            Number(point.lat);

        const longitude =
            Number(point.lng);

        if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {

            throw new Error(
                `Point ${position} has an invalid latitude.`
            );

        }

        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {

            throw new Error(
                `Point ${position} has an invalid longitude.`
            );

        }

        if (
            point.id !== undefined &&
            typeof point.id !==
                "string"
        ) {

            throw new Error(
                `Point ${position} has an invalid ID.`
            );

        }

        if (
            point.note !== undefined &&
            point.note !== null &&
            typeof point.note !==
                "string"
        ) {

            throw new Error(
                `Point ${position} has an invalid note.`
            );

        }

        if (
            point.created !== undefined &&
            !Number.isFinite(
                Number(point.created)
            )
        ) {

            throw new Error(
                `Point ${position} has an invalid creation date.`
            );

        }

    }


    // =====================================
    // NORMALIZE EXPORTED POINTS
    // =====================================

    function normalizeExportPoints(points) {

        return points.map(
            (point, index) => {

                validatePoint(
                    point,
                    index
                );

                return {

                    id:
                        normalizeId(
                            point.id
                        ),

                    lat:
                        Number(
                            point.lat
                        ),

                    lng:
                        Number(
                            point.lng
                        ),

                    note:
                        normalizeNote(
                            point.note,
                            index + 1
                        ),

                    created:
                        normalizeCreated(
                            point.created
                        )

                };

            }
        );

    }


    // =====================================
    // NORMALIZE IMPORTED POINTS
    // =====================================

    function normalizeImportedPoints(
        points
    ) {

        const usedIds =
            new Set();

        let nextDefaultNumber = 1;

        return points.map(
            (point, index) => {

                let id =
                    normalizeId(
                        point.id
                    );

                while (usedIds.has(id)) {

                    id =
                        generateId();

                }

                usedIds.add(id);

                let note =
                    String(
                        point.note || ""
                    ).trim();

                if (!note) {

                    note =
                        `Point ${nextDefaultNumber}`;

                    nextDefaultNumber += 1;

                }

                return {

                    id,

                    lat:
                        Number(
                            point.lat
                        ),

                    lng:
                        Number(
                            point.lng
                        ),

                    note,

                    created:
                        normalizeCreated(
                            point.created,
                            index
                        )

                };

            }
        );

    }


    // =====================================
    // NORMALIZATION HELPERS
    // =====================================

    function normalizeId(id) {

        const value =
            typeof id === "string"
                ? id.trim()
                : "";

        return value ||
            generateId();

    }


    function normalizeNote(
        note,
        pointNumber
    ) {

        const value =
            String(note || "")
                .trim();

        return (
            value ||
            `Point ${pointNumber}`
        );

    }


    function normalizeCreated(
        created,
        index = 0
    ) {

        const value =
            Number(created);

        if (
            Number.isFinite(value) &&
            value > 0
        ) {

            return value;

        }

        return Date.now() + index;

    }


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
    // REMOVE BOM
    // =====================================

    function removeByteOrderMark(
        text
    ) {

        return String(text || "")
            .replace(
                /^\uFEFF/,
                ""
            );

    }


    // =====================================
    // DOWNLOAD FALLBACK
    // =====================================

    function downloadFile(
        fileName,
        content
    ) {

        const blob =
            new Blob(
                [content],
                {
                    type:
                        `${MIME_TYPE};charset=utf-8`
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            fileName;

        link.hidden =
            true;

        document.body.appendChild(
            link
        );

        link.click();

        window.setTimeout(
            () => {

                link.remove();

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );

    }


    // =====================================
    // FILE NAME
    // =====================================

    function createFileName() {

        const now =
            new Date();

        const yyyy =
            now.getFullYear();

        const mm =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const dd =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );

        const hours =
            String(
                now.getHours()
            ).padStart(
                2,
                "0"
            );

        const minutes =
            String(
                now.getMinutes()
            ).padStart(
                2,
                "0"
            );

        return (
            `${APP_NAME}-` +
            `${yyyy}-${mm}-${dd}-` +
            `${hours}${minutes}` +
            FILE_EXTENSION
        );

    }


    // =====================================
    // PUBLIC API
    // =====================================

    return {

        exportPoints,
        importPoints,

        validateFile,
        validatePoint,

        createFileName

    };

})();


window.FixPinFiles =
    FixPinFiles;
