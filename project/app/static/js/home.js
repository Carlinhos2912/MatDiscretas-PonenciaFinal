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
        createMarker(airport["latitude"], airport["longitude"], airport);
    }
}

// Permite crear un marcador en un determinado punto del mapa
function createMarker(latitude, longitude, airport) {
    const marker = L.marker([latitude, longitude], {icon: createMarkerIcon() });

    marker.on('mouseover', function (e) {
        displayContextMenu(e.latlng, airport);
    });

    markersMap[`${latitude},${longitude}`] = marker;
    marker.addTo(map);

    return marker;
}

/* ==================================
               Utilidades 
   ================================== */ 

function createMarkerIcon(isActive = false) {
    return L.divIcon({
      className: isActive ? 'plane-icon active' : 'plane-icon',
      html: '<i class="fa-solid fa-plane" style="color:#FAFAFA; font-size:20px;"></i>',
      iconSize: [20, 20]
    });
}

function coordsToPixel(latlng) {
    const point = map.latLngToContainerPoint(latlng);
    return { x: point.x + 280, y: point.y -40};
}

function displayContextMenu(latlng, airport){
    const contextMenu = document.getElementById('info-context-menu');
    if ( contextMenu ) contextMenu.remove();
    
    const infoContextMenu = document.createElement('div');
    infoContextMenu.id = 'info-context-menu';
    console.log(airport)
    infoContextMenu.textContent = airport["name"];

    infoContextMenu.style.left = coordsToPixel(latlng).x + 'px';
    infoContextMenu.style.top = coordsToPixel(latlng).y + 'px';
    
    document.body.appendChild(infoContextMenu);
}
