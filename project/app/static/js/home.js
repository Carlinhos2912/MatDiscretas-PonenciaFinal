/* 
    * @authors:
        Juan Bolivar
        Samuel Camargo
        John Ferrer
        María Hernández
        Carlos Morales
*/

var map;
var markersMap = {};
let currentMode = 'full';

let airports = {};
let pathData = [];
let mstData = [];

/* ====================================================
                     Punto de entrada
    ==================================================== */

window.onload = setup;

/* ====================================================
        Funciones de Inicialización del programa
    ==================================================== */
function setup() {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('read-id-1').addEventListener('input' , () => { } );
    document.getElementById('read-id-2').addEventListener('input' , () => { } );
    document.getElementById('fetch-data').addEventListener('click', () => { } );

    initMap();
    initAirportData();
}

function initMap() {
    map = L.map('map').setView([4.5709, -74.2973], 6);
    var bounds = [[-4.2316872, -82.1243666], [13.3920668, -66.8471272]];

    map.setMaxBounds(bounds);
    map.on('drag', function() { map.panInsideBounds(bounds, { animate: true }); });

    L.tileLayer('https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=hy6pxKK5t7s7HqMLzBmCy43uRvPkUPPIAsipdlRUGDb5haPR3AdwzgpriCtOPVbB', {
        attribution: '<a href="https://jawg.io">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 6,
        maxZoom: 22
      }).addTo(map);
}

function initAirportData(jsonPath = '../static/resources/extended_airports_data.json'){
    fetch(jsonPath)
    .then((response) => {
        if (!response.ok) { throw new Error("ERROR FETCHING THE JSON") }
        return response.json();
    })
    .then((data) => {
        console.log(data)
        airports = data
    })
    .then(() => {
        initAirportsMarkers()
    })
    .catch((error) => {
        console.error('Error fetching the JSON file:', error);
    });
}

function initAirportsMarkers() {
    console.log(airports)
    for (let code in airports){
        let airport = airports[code]
        createMarker(airport["latitude"], airport["longitude"], code);
    }
}

// Permite crear un marcador en un determinado punto del mapa
function createMarker(latitude, longitude, airportCode) {
    const marker = L.marker([latitude, longitude], { icon: createMarkerIcon() });

    markersMap[airportCode] = marker;
    marker.addTo(map);

+    marker.on('click', function () {
        map.flyTo([latitude, longitude], 10);
    });

    marker.on('mouseover', function () {
        const popupContent = `
            <b><span>${airportCode} | </span>${airports[airportCode].name}</b>
        `;
        marker.bindPopup(popupContent).openPopup(); 
        highlightAdjacentMarkers(airportCode, 0.4); 
    });

    marker.on('mouseout', function () {
        marker.closePopup(); 
        highlightAdjacentMarkers(); 
    });

    return marker;
}


function highlightAdjacentMarkers(airportCode = null, opacity = 1) {
    for (let key in markersMap) {
        markersMap[key].setIcon(createMarkerIcon(false, opacity));
    }

    if (airportCode) {
        airports[airportCode].connections.forEach(connectionCode => {
            if (markersMap[connectionCode]) {
                markersMap[connectionCode].setIcon(createMarkerIcon(true)); // Active icon
            }
        });

        if (markersMap[airportCode]) {
            markersMap[airportCode].setIcon(createMarkerIcon(true)); // Active icon
        }
    }
}



/* ==================================
               Utilidades 
   ================================== */ 

function createMarkerIcon(isActive = false, opacity = 1) {
    return L.divIcon({
        className: isActive ? 'plane-icon active' : 'plane-icon',
        html: `<i class="fa-solid fa-plane" style="color: #FAFAFA; font-size: 20px; opacity: ${opacity};"></i>`,
        iconSize: [20, 20]
    });
}


/*
function coordsToPixel(latlng) {
    const point = map.latLngToContainerPoint(latlng);
    return { x: point.x , y: point.y};
}

function displayContextMenu(latlng, airport){
    const contextMenu = document.getElementById('info-context-menu');
    if ( contextMenu ) contextMenu.remove();
    
    const infoContextMenu = document.createElement('div');
    infoContextMenu.id = 'info-context-menu';
    console.log(airport)
    infoContextMenu.textContent = airport["name"];

    infoContextMenu.style.left = `calc(${coordsToPixel(latlng).x}px + 25vw)`;
    infoContextMenu.style.top = coordsToPixel(latlng).y + 'px';
    
    document.body.appendChild(infoContextMenu);
}
    */
