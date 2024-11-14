document.getElementById("btn-fullview").classList.add("active")

const markersMap = {};
let map; 

let csvData = [];         
let markersData = [];      
let mstData = [];          
let pathData = [];        
let currentMode = 'full'; 

// Ejecutar cuando el documento esté cargado
window.onload = main;

function main() {
  document.getElementById('loader').style.display = 'flex';
  document.getElementById('read-id-1').addEventListener('input', updateData);
  document.getElementById('read-id-2').addEventListener('input', updateData);
  document.getElementById('fetch-data').addEventListener('click', postPython);

  initializeMap();
  loadAndProcessCSV().then(() => {
    updateData()
    document.getElementById('loader').style.display = 'none';
  });
  updateData();
}

function initializeMap() {
  map = L.map('map').setView([10.9685, -74.7813], 4); 
  
  L.tileLayer('https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=hy6pxKK5t7s7HqMLzBmCy43uRvPkUPPIAsipdlRUGDb5haPR3AdwzgpriCtOPVbB', {
    attribution: '<a href="https://jawg.io">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 2,
    maxZoom: 22
  }).addTo(map);
  
  console.log("Mapa inicializado correctamente.");
}

// Consultar la API en Python =============================================================================

function fetchPython(endpoint, callback) {
  fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      callback(data);
    })
    .catch(error => console.error(`Error al consultar ${endpoint}:`, error));
}

async function postPython() {
  try {
    const readId1 = document.getElementById('read-id-1').value;
    const readId2 = document.getElementById('read-id-2').value;

    if (!readId1 || !readId2) {
      console.warn('Ambos campos de aeropuertos deben estar completos.');
      return;
    }

    const response = await fetch('/api/path', {
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
    renderByMode();  // Llama al render según el modo
    console.log(data);  // Log para depuración
  } catch (error) {
    console.error('Error en la petición:', error);  // Manejo de errores
  }
}

// Almacenamiento (Caché de datos) =============================================================================

function storeCSVData(data) {
  csvData = data;

  // Almacenar los datos de los marcadores para no tener que leer el CSV otra vez
  markersData = data.map((row) => ({
    airportCode: row['Source Airport Code'],
    latitude: parseFloat(row['Source Airport Latitude']),
    longitude: parseFloat(row['Source Airport Longitude']),
    destinationLatitude: parseFloat(row['Destination Airport Latitude']),
    destinationLongitude: parseFloat(row['Destination Airport Longitude'])
  }));
}

// Render según el modo seleccionado ==============================================================

function renderByMode() {
  clearMap(); // Limpiar los marcadores y líneas actuales del mapa

  if (currentMode === 'full') {
    renderFullMap();  // Render el mapa completo con todos los marcadores
  } else if (currentMode === 'mst') {
    if (mstData.length === 0) {
      fetchPython('/api/mst', (data) => {
        mstData = data;    // Almacenar los datos del MST tras la consulta
        renderMST(mstData);
      });
    } else {
      renderMST(mstData);  // Usar los datos en caché del MST
    }
  } else if (currentMode === 'path') {
    if (pathData.length === 0) {
      fetchPython('/api/path', (data) => {
        pathData = data;    // Almacenar los datos del camino más corto tras la consulta
        renderPath(pathData);
      });
    } else {
      renderPath(pathData); // Usar los datos en caché del camino más corto
    }
  }
}

function renderFullMap() {
  const markers = createMarkerClusterGroup();  
  const renderedAirports = new Set(); 

  markersData.forEach((markerData) => {
    const { 
      airportCode: sourceAirportCode, 
      latitude: sourceLatitude, 
      longitude: sourceLongitude, 
      destinationLatitude, 
      destinationLongitude, 
      destinationAirportCode 
    } = markerData;

    if (!renderedAirports.has(sourceAirportCode)) {
      renderedAirports.add(sourceAirportCode);

      const sourceMarker = createMarker(sourceLatitude, sourceLongitude);

      sourceMarker.on('click', function () {
        handleMarkerClick(sourceMarker, sourceLatitude, sourceLongitude, destinationLatitude, destinationLongitude, markers);
      });

      markers.addLayer(sourceMarker);
    }

    if (!renderedAirports.has(destinationAirportCode)) {
      renderedAirports.add(destinationAirportCode);

      const destinationMarker = createMarker(destinationLatitude, destinationLongitude);

      destinationMarker.on('click', function () {
        handleMarkerClick(destinationMarker, destinationLatitude, destinationLongitude, sourceLatitude, sourceLongitude, markers);
      });

      markers.addLayer(destinationMarker); 
    }
  });

  map.addLayer(markers); 
  console.log(`Se renderizaron ${markersData[0]} aeropuertos.`);
}

function renderMST(mstData) {
  mstData.forEach(([sourceIdx, destinationIdx, weight]) => {
    const sourceAirport = csvData[sourceIdx];          // Buscar datos del aeropuerto usando el índice del CSV
    const destinationAirport = csvData[destinationIdx];

    const line = L.polyline(
      [
        [sourceAirport['Source Airport Latitude'], sourceAirport['Source Airport Longitude']],
        [destinationAirport['Source Airport Latitude'], destinationAirport['Source Airport Longitude']]
      ],
      {
        color: '#FFD700', // Color dorado para MST
        weight: 2
      }
    );

    line.addTo(map);
  });
}

function renderPath(pathData) {
  var cc = 0;
  var amount = pathData[0].length
  pathData[0].forEach((id) => {
    const edge = csvData[id];

    var latitude = edge['Source Airport Latitude']
    var longitude = edge['Source Airport Longitude']
    var anotherLatitude = edge['Destination Airport Latitude']
    var anotherLongitude = edge['Destination Airport Longitude']

    createMarker(latitude, longitude).addTo(map)
    if ( amount === pathData[0].indexOf(id) + 1 ){
      createMarker(anotherLatitude, anotherLongitude).addTo(map)
    }

    var midpoint = calculateMidpoint(parseFloat(latitude),parseFloat(longitude),parseFloat(anotherLatitude),parseFloat(anotherLongitude))

    const curvedLine = L.curve(
      [
        'M', [latitude, longitude],
        'C', [latitude , longitude], [parseFloat(midpoint[0] + Math.pow(-1, id)), parseFloat(midpoint[1])], [anotherLatitude, anotherLongitude]
      ],
      {
        color: '#FAFAFA',
        weight: 2,
        dashArray: '5, 5',
        opacity: 0.8
      }
    );

    curvedLine.addTo(map);

    if ( cc === 0 ){
      cc++;
      curvedLine.bindTooltip(`${pathData[1].toFixed(2)} km`, {
        permanent: true,  
        direction: 'center',
        className: 'polyline-label' 
      }).openTooltip();
    }
  });

}

function clearMap() {
  map.eachLayer(function(layer) {
    if (!(layer instanceof L.TileLayer)) {
      map.removeLayer(layer);
    }
  });
}

// Funciones utilitarias ===========================================================================
// Validar si una coordenada es correcta

function validate(latitude, longitude) {
  return !isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

// Calcular el punto medio entre dos coordenadas
function calculateMidpoint(lat1, lon1, lat2, lon2) {
  const midLat = (lat1 + lat2) / 2;
  const midLon = (lon1 + lon2) / 2;
  return [midLat, midLon];
}

// Crear el grupo de marcadores
function createMarkerClusterGroup() {
  return L.markerClusterGroup({
    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      let clusterColor = `rgba(${187 - count}, 134, 250, ${(count + 90) / 255})`;
      return L.divIcon({
        html: `<div style="background-color:${clusterColor};"><span>${count}</span></div>`,
        className: 'custom-cluster',
        iconSize: L.point(40, 40, true)
      });
    }
  });
}

// Crear el ícono del marcador
function createMarkerIcon(isActive = false) {
  return L.divIcon({
    className: isActive ? 'plane-icon active' : 'plane-icon',
    html: '<i class="fa-solid fa-plane" style="color:#FAFAFA; font-size:20px;"></i>',
    iconSize: [20, 20]
  });
}

// Crear un marcador en el mapa
function createMarker(latitude, longitude) {
  const marker = L.marker([latitude, longitude], { icon: createMarkerIcon() });
  markersMap[`${latitude},${longitude}`] = marker;
  return marker;
}

// OnClick marcadores
function handleMarkerClick(marker, latitude, longitude, anotherLatitude, anotherLongitude, markers) {
  updateByCoords(latitude, longitude);

  // Mover el mapa al punto medio entre los dos aeropuertos
  map.flyTo(calculateMidpoint(latitude, longitude, anotherLatitude, anotherLongitude), 4);

  const isActive = marker._icon.classList.contains('active');
  marker.setIcon(createMarkerIcon(!isActive));

  const anotherAirport = markersMap[`${anotherLatitude},${anotherLongitude}`];
  if (anotherAirport) {
    markers.removeLayer(anotherAirport);
    markers.removeLayer(marker);

    anotherAirport.setIcon(createMarkerIcon(true));
    anotherAirport.addTo(map);
    marker.addTo(map);

    const curvedLine = L.curve(
      [
        'M', [latitude, longitude],
        'C', [latitude + 2, longitude + 2], [anotherLatitude - 2, anotherLongitude - 2], [anotherLatitude, anotherLongitude]
      ],
      {
        color: '#FAFAFA',
        weight: 2,
        dashArray: '5, 5',
        opacity: 0.8
      }
    );
    curvedLine.addTo(map);
  }

  document.getElementById('sidebar').classList.remove('closed');
}

// Cargar y procesar el CSV solo una vez ======================================================
function loadAndProcessCSV() {
  return fetch('../../static/resources/flights_final.csv')
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (results.data.length === 0) {
            console.error('No se encontraron datos en el CSV');
            return;
          }
          storeCSVData(results.data);  
          renderByMode();             
        }
      });
    })
    .catch(error => console.error('Error al cargar el CSV:', error));
}

// Función para actualizar los datos en la interfaz
function updateData() {
  const sourceCode = document.getElementById('read-id-1').value.trim().toUpperCase();
  const destinationCode = document.getElementById('read-id-2').value.trim().toUpperCase();

  // Verificar que ambos códigos de aeropuertos estén ingresados
  if (sourceCode.length === 3 && destinationCode.length === 3) {
    const sourceAirport = findAirportData(sourceCode, true);
    const destinationAirport = findAirportData(destinationCode, false);

    // Si se encuentra un aeropuerto válido de origen, actualizar la interfaz
    if (sourceAirport) {
      document.getElementById('source-city').textContent = sourceAirport['Source Airport City'].toUpperCase();
      document.getElementById('source-country').textContent = sourceAirport['Source Airport Country'].toUpperCase();
      document.getElementById('latitude-source').querySelector('h2').textContent = sourceAirport['Source Airport Latitude'];
      document.getElementById('longitude-source').querySelector('h2').textContent = sourceAirport['Source Airport Longitude'];
      console.log("Datos del aeropuerto de origen:", sourceAirport);
    } else {
      console.warn(`No se encontraron datos para el código de origen ${sourceCode}`);
    }

    // Si se encuentra un aeropuerto válido de destino, actualizar la interfaz
    if (destinationAirport) {
      document.getElementById('destination-city').textContent = destinationAirport['Destination Airport City'].toUpperCase();
      document.getElementById('destination-country').textContent = destinationAirport['Destination Airport Country'].toUpperCase();
      document.getElementById('latitude-destination').querySelector('h2').textContent = destinationAirport['Destination Airport Latitude'];
      document.getElementById('longitude-destination').querySelector('h2').textContent = destinationAirport['Destination Airport Longitude'];
      console.log("Datos del aeropuerto de destino:", destinationAirport);
    } else {
      console.warn(`No se encontraron datos para el código de destino ${destinationCode}`);
    }
  }
}

// Buscar aeropuerto por código
function findAirportData(airportCode, isSource) {
  if ( isSource ) {
    return csvData.find(row => row['Source Airport Code'] === airportCode );
  } else {
    return csvData.find(row => row['Destination Airport Code'] === airportCode);
  }
}

function updateByCoords(latitude, longitude) {
  const airportData = csvData.find(row => parseFloat(row['Source Airport Latitude']) === latitude && parseFloat(row['Source Airport Longitude']) === longitude);
  
  if (airportData) {
    document.getElementById('read-id-1').value = airportData['Source Airport Code']
    document.getElementById('source-city').textContent = airportData['Source Airport City'].toUpperCase();
    document.getElementById('source-country').textContent = airportData['Source Airport Country'].toUpperCase();
    document.getElementById('latitude-source').querySelector('h2').textContent = airportData['Source Airport Latitude'];
    document.getElementById('longitude-source').querySelector('h2').textContent = airportData['Source Airport Longitude'];
    console.log("Clicked Airport Data:", airportData);
  } else {
    console.warn('No airport data found for the clicked coordinates.');
  }
}

function updatePathToDestiny (sLat, sLong, dLat, dLong) {
  data.forEach((row) => {

  });
}
