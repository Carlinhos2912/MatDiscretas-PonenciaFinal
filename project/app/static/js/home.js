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
let isSelecting = false;
let currentMode = 'full';

let airports = {};
let pathData = [];
let mstData = [];
let curveLayers = [];

const sourceCodeHolder = document.getElementById('read-id-1');
const destinationCodeHolder = document.getElementById('read-id-2');

/* ====================================================
                     Punto de entrada
    ==================================================== */

window.onload = setup;

/* ====================================================
        Funciones de Inicialización del programa
    ==================================================== */
function setup() {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('fetch-data').addEventListener('click', () => { } );
    
    sourceCodeHolder.addEventListener('input' , () => { } );
    destinationCodeHolder.addEventListener('input' , () => { } );

    initMap();
    initAirportData();

}

function initMap() {
    map = L.map('map', {
        fadeAnimation: false, 
    })
    .setView([4.5709, -74.2973], 6);
    
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
        updateData();
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

    let isMouseInside = false;

    marker.on('click', function () { 
        map.flyTo([latitude, longitude], 10); 
        
        sourceCodeHolder.value = airportCode
        document.getElementById("source-city").textContent = airports[airportCode].name
        document.getElementById("source-country").textContent = airports[airportCode].city

    });

    marker.on('contextmenu', function (e) {
        console.log("Marker right-clicked");
    
        const contextMenu = document.getElementById("custom-menu");
    
        contextMenu.style.left = `${e.originalEvent.pageX}px`; 
        contextMenu.style.top = `${e.originalEvent.pageY}px`;
    
        contextMenu.classList.remove("hidden");
    
        e.originalEvent.preventDefault();
    });
    

    marker.on('mouseover', function () {
        if (!isMouseInside) {
            isMouseInside = true; 

            const popupContent = `
                <b><span>${airportCode} | </span>${airports[airportCode].name}</b>
            `;
            marker.bindPopup(popupContent).openPopup(); 
            highlightAdjacentMarkers(airportCode, 0.4); 
        }
    });

    marker.on('mouseout', function () {
        isMouseInside = false; 
        marker.closePopup();
        highlightAdjacentMarkers(); 
        curveLayers.forEach(curve => map.removeLayer(curve));
        curveLayers = [];
    });

    return marker;
}

function highlightAdjacentMarkers(airportCode = null, opacity = 1) {
    for (let key in markersMap) {
        const markerElement = markersMap[key].getElement(); 
        if (markersMap[key].getElement()) {
            markerElement.style.transition = 'opacity 0.3s ease';
            markerElement.style.opacity = opacity; 
            markersMap[key].setIcon(createMarkerIcon(false));
        }
    }

    if (airportCode) {
        airports[airportCode].connections.forEach(connectionCode => {
            if (markersMap[connectionCode]) {
                markersMap[connectionCode].getElement().style.opacity = '1'; 
                markersMap[connectionCode].setIcon(createMarkerIcon(true));
            }

            if (airports[connectionCode]) {
                const curve = createCurve(
                                            [airports[airportCode].latitude, airports[airportCode].longitude], 
                                            [airports[connectionCode].latitude, airports[connectionCode].longitude]);
                curve.addTo(map);
                curveLayers.push(curve);
            }
        });

        if ( markersMap[airportCode]) {
            markersMap[airportCode].getElement().style.opacity = '1'; 
            markersMap[airportCode].setIcon(createMarkerIcon(true));
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

function createCurve(start, end) {
    const coords = [
        'M', [start[0], start[1]],
        'Q',
        [ (start[0] + end[0]) / 2 + 1, (start[1] + end[1]) / 2 + 1 ], 
        [end[0], end[1]] 
    ];

    return L.curve(coords, {
        color: '#FF5733',
        weight: 3,
        opacity: 0.8,
        dashArray: '5,5' 
    });
}

function updateData(){
    document.getElementById("source-city").textContent = airports[sourceCodeHolder.value].name
    document.getElementById("source-country").textContent = airports[sourceCodeHolder.value].city
    document.querySelector("#latitude-source h2").textContent = airports[sourceCodeHolder.value].latitude
    document.querySelector("#longitude-source h2").textContent = airports[sourceCodeHolder.value].longitude


    document.getElementById("destination-city").textContent = airports[destinationCodeHolder.value].name
    document.getElementById("destination-country").textContent = airports[destinationCodeHolder.value].city
    document.querySelector("#latitude-destination h2").textContent = airports[destinationCodeHolder.value].latitude
    document.querySelector("#longitude-destination h2").textContent = airports[destinationCodeHolder.value].longitude
}


/*  
    Menu Custom para realizar acciones
*/

