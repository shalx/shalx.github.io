"use strict";

// Fix-Pin fullscreen map
(() => {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-expand-control";
    button.setAttribute("aria-label", "Expand map");
    button.setAttribute("aria-pressed", "false");
    button.title = "Expand map";
    button.textContent = "⛶";

    if (typeof L !== "undefined") {
        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.disableScrollPropagation(button);
    }

    mapElement.appendChild(button);

    function updateMapSize() {
        if (window.FixPinMap?.refreshMapSize) {
            window.FixPinMap.refreshMapSize();
        }
    }

    function setExpanded(expanded) {
        mapElement.classList.toggle("map-expanded", expanded);
        document.body.classList.toggle("map-fullscreen", expanded);

        button.textContent = expanded ? "×" : "⛶";
        button.title = expanded ? "Restore map" : "Expand map";
        button.setAttribute("aria-label", button.title);
        button.setAttribute("aria-pressed", String(expanded));

        requestAnimationFrame(() => {
            updateMapSize();
            requestAnimationFrame(updateMapSize);
        });
    }

    button.addEventListener("click", () => {
        setExpanded(!mapElement.classList.contains("map-expanded"));
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" &&
            mapElement.classList.contains("map-expanded")) {
            setExpanded(false);
        }
    });
})();

