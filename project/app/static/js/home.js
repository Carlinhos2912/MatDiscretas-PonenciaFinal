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
    document.getElementById('fetch-data').addEventListener('click', sendPathCodes );
    sourceCodeHolder.addEventListener('input', updateData );
    destinationCodeHolder.addEventListener('input', updateData );
    
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
    
    map.on('click', function () {
        const contextMenu = document.getElementById("custom-menu");
        contextMenu.classList.add("hidden");
    });

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
        initAirportsMarkers();
        updateData();
        getGraphInfo();
    })
    .catch((error) => {
        console.error('Error fetching the JSON file:', error);
    });
}

function initAirportsMarkers() {
    clearMap();

    console.log(airports)
    for (let code in airports){
        let airport = airports[code]
        if (!(airport["connections"].length === 1 && airport["connections"][0] === "404")) {
            createMarker(airport["latitude"], airport["longitude"], code);
        }
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
        updateData();

    });

    marker.on('contextmenu', function (e) {
        console.log("Marker right-clicked");
    
        const contextMenu = document.getElementById("custom-menu");
    
        contextMenu.style.left = `${e.originalEvent.pageX}px`; 
        contextMenu.style.top = `${e.originalEvent.pageY}px`;
    
        contextMenu.classList.remove("hidden");

        contextMenu.dataset.clickedAirport = airportCode;
    
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

function renderPath(pathData) {
    clearMap();

    let acum = 0;
    const dropdownList = document.querySelector('.dropdown ul');
    dropdownList.innerHTML = '';

    let finalCurvedLine = null;

    pathData.forEach((entry, i) => {
        const source = airports[entry[0][0]];
        const destiny = airports[entry[0][1]];

        // Extract data
        const city = source.name;
        const country = source.city;
        const anotherCity = destiny.name;
        const anotherCountry = destiny.city;

        const latitude = source.latitude;
        const longitude = source.longitude;
        const anotherLatitude = destiny.latitude;
        const anotherLongitude = destiny.longitude;

        const sourceMarker = createMarker(latitude, longitude, entry[0][0]);
        sourceMarker.addTo(map);

        if (i === pathData.length - 1) {
            const destMarker = createMarker(anotherLatitude, anotherLongitude, entry[0][1]);
            destMarker.addTo(map);
        }

        const curvedLine = createCurve([latitude, longitude], [anotherLatitude, anotherLongitude]);
        curvedLine.addTo(map);

        finalCurvedLine = curvedLine; 

        const weight = entry[1];
        acum += weight;

        createPathDropdownItem(entry[0][0], entry[0][1], weight, city, country, anotherCity, anotherCountry);
    });

    if (finalCurvedLine) {
        finalCurvedLine.bindTooltip(`${acum.toFixed(2)} km`, {
            permanent: true,
            direction: 'center',
            className: 'polyline-label'
        }).openTooltip();
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

    if (sourceCodeHolder.value.length === 3 && destinationCodeHolder.value.length === 3) {
        document.getElementById("source-city").textContent = airports[sourceCodeHolder.value].name
        document.getElementById("source-country").textContent = airports[sourceCodeHolder.value].city
        document.querySelector("#latitude-source h2").textContent = airports[sourceCodeHolder.value].latitude
        document.querySelector("#longitude-source h2").textContent = airports[sourceCodeHolder.value].longitude

        document.getElementById("destination-city").textContent = airports[destinationCodeHolder.value].name
        document.getElementById("destination-country").textContent = airports[destinationCodeHolder.value].city
        document.querySelector("#latitude-destination h2").textContent = airports[destinationCodeHolder.value].latitude
        document.querySelector("#longitude-destination h2").textContent = airports[destinationCodeHolder.value].longitude
    }
}

function createPathDropdownItem(sourceCode, destinationCode, distance, city, country, anotherCity, anotherCountry) {
    const dropdownList = document.querySelector('.dropdown ul');
    const item = document.createElement('li');
  
    item.innerHTML = `
                  <a href="" target="_self">${sourceCode} <span>${city},${country}</span></a>
                  <span class="sep-distance"> -----------> <i class="fa-solid fa-plane"> <span>${distance.toFixed(0)}km</span></i></span>
                  <a href="" target="_self">${destinationCode} <span>${anotherCity},${anotherCountry}</span></a>
    `;
  
    dropdownList.appendChild(item);
}

function clearMap(){    
    Object.values(markersMap).forEach(marker => map.removeLayer(marker));
    Object.keys(markersMap).forEach(key => delete markersMap[key]);
    curveLayers.forEach(curve => map.removeLayer(curve));
    curveLayers = [];
}

function updateGraphInfo(connected, numComponents, componetsVertexCount){
    document.getElementById("graph-info-dropdown").innerHTML = `
            <ul>
                <li><a href="">${connected ? "Yes" : "No"} <span> Is graph connected</span></a></li>
                <li><a href="">${numComponents} <span> Number of components</span></a></li>
                <li><a href="">${componetsVertexCount} <span> Components vertices</span></a></li>
            </ul>
    `
}

  /*  
    Menu Custom para realizar acciones
*/

function createAirportConnected() {
    const clickedAirportCode = document.getElementById("custom-menu").dataset.clickedAirport;
    document.getElementById("map").style.cursor = "crosshair"
    document.getElementById("custom-menu").classList.add("hidden");
    isSelecting = true;

    map.once('click', function(e) {
        isSelecting = false
        const { lat, lng } = e.latlng;
        let userPrompt = prompt(`  Latitude: ${lat}\n  Longitude${lng}\n\nSet a name and a code for the airport as the example\n   "[AAA] Aeropuerto internacional"`)

        if (userPrompt !== null && userPrompt.trim() !== "") {
            console.log(`User entered: ${userPrompt}`);
            const match = userPrompt.match(/^\[([^\]]+)\]\s*(.+)$/);
            if (match) {
                const code = match[1]; 
                const name = match[2];
                sendAirportData(lat, lng, code, name, clickedAirportCode)
            }
        }
        document.getElementById("map").style.cursor = "grab"
    });
}
function createConnection(){
    const clickedAirportCode = document.getElementById("custom-menu").dataset.clickedAirport;
    let currentConnections = airports[clickedAirportCode]?.connections || []; 

    let availableAirports = Object.entries(airports)
        .filter(([code]) => !currentConnections.includes(code) && code !== clickedAirportCode) 
        .map(([code, data]) => ` - [${code}]  |  ${data.name}`) 
        .join("\n");

    let userPrompt = prompt(`Available airports:\n${availableAirports}`);
    if (userPrompt !== null && userPrompt.trim() !== "") {
        console.log(`User requested: ${userPrompt} from: ${clickedAirportCode}`);
        sendAirportCodes(clickedAirportCode, userPrompt)
    }

}
function deleteConnection(){
    const clickedAirportCode = document.getElementById("custom-menu").dataset.clickedAirport;
    let availableAirports = airports[clickedAirportCode]?.connections || []; 


    let userPrompt = prompt(`Available airports:\n${availableAirports}`);
    if (userPrompt !== null && userPrompt.trim() !== "") {
        console.log(`User requested: ${userPrompt} from: ${clickedAirportCode}`);
        sendAirportCodes(clickedAirportCode, userPrompt, "/api/delete-connection")
    } 
}
function deleteSelf(){
    const clickedAirportCode = document.getElementById("custom-menu").dataset.clickedAirport;
    const userConfirmed = confirm(`Are you sure to delete [${clickedAirportCode}] ?`)

    if ( userConfirmed === true ){
        sendAirportCodes(clickedAirportCode,"000", "/api/delete-airport")
    }
}

/*
    FETCHS AND API
*/

function sendAirportData(latitude, longitude, code, name, connection) {
    const dataDict = {
        name: name,
        latitude: latitude,
        longitude: longitude,
        city: "undetermined",
        international: false,
        connections: [connection]
    };

    fetch('/api/add-airport', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: code,       
            airport_data: dataDict 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add airport');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        initAirportData();
    })
    .catch(error => {
        console.error('Error:', error); 
    });
}

function sendAirportCodes(source, requested, endpoint = "/api/add-connection"){
    fetch(endpoint , { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "source-code": source,       
            "requested-code": requested 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add connection');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        initAirportData();
        getGraphInfo();
    })
    .catch(error => {
        console.error('Error:', error); 
    });
}

async function getGraphInfo(){
    try {
      const response = await fetch("/api/get-graph-info");
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log(result);
      updateGraphInfo(result[0], result[1], result[2])
    } catch (error) {
      console.error(error.message);
    }
}

async function sendPathCodes() {
    try {
      const readId1 = document.getElementById('read-id-1').value;
      const readId2 = document.getElementById('read-id-2').value;
  
      if (!readId1 || !readId2) {
        console.warn('Ambos campos de aeropuertos deben estar completos.');
        return;
      }
  
      const response = await fetch('/api/get-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: readId1,
          destination: readId2
        })
      });
  
      if (!response.ok) {
        throw new Error(`Error en la respuesta de la API: ${response.status}`);
      }
  
      const data = await response.json();  
      console.log(data)
  
      currentMode = 'path';
      pathData = data;
      renderPath(pathData); 
    } catch (error) {
      console.error('Error en la petición:', error);  
    }
}