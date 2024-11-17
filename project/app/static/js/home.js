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
    initAirportsMarkers();
}

function initMap() {
    var map = L.map('map').setView([4.5709, -74.2973], 6);
    var bounds = [[-4.2316872, -82.1243666], [13.3920668, -66.8471272]];

    map.setMaxBounds(bounds);
    map.on('drag', function() { map.panInsideBounds(bounds, { animate: true }); });

    L.tileLayer('https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=hy6pxKK5t7s7HqMLzBmCy43uRvPkUPPIAsipdlRUGDb5haPR3AdwzgpriCtOPVbB', {
        attribution: '<a href="https://jawg.io">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 6,
        maxZoom: 22
      }).addTo(map);
}

function initAirportData(jsonPath = 'app/static/resources/airports_data.json'){
    import(jsonPath)
    .then((data) => {
        data.default.forEach((em) => { airports[em.code] = em; console.log(em) })
    });
}

function initAirportsMarkers() {
    airports.forEach((airport) => {
        createMarker(airport[latitude], airport[longitude]);
    });
}

// Permite crear un marcador en un determinado punto del mapa
function createMarker(latitude, longitude) {
    const marker = L.marker([latitude, longitude], {icon: createMarkerIcon() });
    markersMap[`${latitude},${longitude}`] = marker;
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
