"use strict";

/*
=========================================
FIX-PIN
files.js
Import / Export Module
=========================================
*/

const FixPinFiles = (() => {

    // =====================================
    // CONFIG
    // =====================================

    const FORMAT = "FXPN";

    const VERSION = 1;

    const APP_NAME = "Fix-Pin";

    const FILE_EXTENSION = ".fxpn";


    // =====================================
    // EXPORT
    // =====================================

    function exportPoints(points) {

        const file = {

            format: FORMAT,

            version: VERSION,

            app: APP_NAME,

            exported: Date.now(),

            points: Array.isArray(points)
                ? points
                : []

        };

        const json =
            JSON.stringify(
                file,
                null,
                2
            );

        downloadFile(
            createFileName(),
            json
        );

    }


    // =====================================
    // IMPORT
    // =====================================

    function importPoints(file) {

        return new Promise((resolve, reject) => {

            if (!file) {

                reject(
                    new Error("No file selected.")
                );

                return;
            }

            readFile(file)
                .then(text => {

                    const data =
                        JSON.parse(text);

                    validateFile(data);

                    resolve(data.points);

                })
                .catch(reject);

        });

    }


    // =====================================
    // READ FILE
    // =====================================

    function readFile(file) {

        return new Promise((resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {

                resolve(reader.result);

            };

            reader.onerror = () => {

                reject(
                    new Error(
                        "Unable to read file."
                    )
                );

            };

            reader.readAsText(file);

        });

    }


    // =====================================
    // VALIDATE
    // =====================================

    function validateFile(data) {

        if (!data) {

            throw new Error(
                "Invalid file."
            );

        }

        if (data.format !== FORMAT) {

            throw new Error(
                "This is not a Fix-Pin file."
            );

        }

        if (
            typeof data.version !==
            "number"
        ) {

            throw new Error(
                "Unsupported file version."
            );

        }

        if (
            !Array.isArray(
                data.points
            )
        ) {

            throw new Error(
                "Invalid points list."
            );

        }

        data.points.forEach(
            validatePoint
        );

        return true;

    }


    // =====================================
    // VALIDATE POINT
    // =====================================

    function validatePoint(point) {

        if (
            typeof point !== "object"
        ) {

            throw new Error(
                "Invalid point."
            );

        }

        if (
            typeof point.id !==
            "string"
        ) {

            throw new Error(
                "Invalid point id."
            );

        }

        if (
            !Number.isFinite(
                point.lat
            )
        ) {

            throw new Error(
                "Invalid latitude."
            );

        }

        if (
            !Number.isFinite(
                point.lng
            )
        ) {

            throw new Error(
                "Invalid longitude."
            );

        }

        if (
            typeof point.note !==
            "string"
        ) {

            throw new Error(
                "Invalid note."
            );

        }

        if (
            typeof point.created !==
            "number"
        ) {

            throw new Error(
                "Invalid creation date."
            );

        }

    }


    // =====================================
    // DOWNLOAD
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
                        "application/json"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download = fileName;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

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
            ).padStart(2, "0");

        const dd =
            String(
                now.getDate()
            ).padStart(2, "0");

        return (
            APP_NAME +
            "-" +
            yyyy +
            "-" +
            mm +
            "-" +
            dd +
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

        createFileName

    };

})();


window.FixPinFiles =
    FixPinFiles;
