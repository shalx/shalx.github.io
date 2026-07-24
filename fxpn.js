"use strict";

/*
=========================================
FIX-PIN
fxpn.js
FXPN Format
=========================================
*/


// =====================================
// SHARE FXPN
// =====================================

async function shareFxpn(locations) {

    if (!Array.isArray(locations)) {
        return;
    }

    if (locations.length === 0) {
        return;
    }


    const fxpn = {

        format: "FXPN",

        version: 1,

        created:
            new Date().toISOString(),

        points: locations

    };


    const json =
        JSON.stringify(
            fxpn,
            null,
            2
        );


    const file =
        new File(

            [json],

            "fix-pin.fxpn",

            {
                type:
                    "application/octet-stream"
            }

        );


    // =====================================
    // SHARE API
    // =====================================

    if (

        navigator.canShare &&
        navigator.canShare({
            files: [file]
        })

    ) {

        try {

            await navigator.share({

                title:
                    "Fix-Pin",

                text:
                    "Shared from Fix-Pin",

                files:
                    [file]

            });

            return;

        } catch (error) {

            console.log(error);

        }

    }


    // =====================================
    // DOWNLOAD
    // =====================================

    downloadFxpn(file);

}



// =====================================
// DOWNLOAD
// =====================================

function downloadFxpn(file) {

    const url =
        URL.createObjectURL(file);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        file.name;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

}
