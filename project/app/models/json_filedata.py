import json
import math

from .graph import Graph

class JSON_FileData():
    """
    A class to handle JSON file data related to airports and their connections.
    
    Attributes:
    -----------
    data : dict
        A dictionary containing the data loaded from the JSON file.
    code_list : list
        A list of airport codes.
    code_dict : dict
        A dictionary mapping airport codes to their indices.
    connections : list
        A list of tuples representing each connection in the graph.
    graph : Graph
        A graph object representing the connections between airports.

    Methods:
    --------
    __init__(filepath: str) -> None:
        Initializes the JSON_FileData object by loading data from the given file path.

    get_connections(d: dict) -> list[tuple]:
        Extracts and returns a list of connections from the given data dictionary.

    calculate_distances(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        Calculates and returns the distance between two geographical coordinates.    
    """
    
    def __init__(self, filepath:str):

        self.filepath = filepath

        self.data:dict = {}
        with open(filepath, encoding="utf-8") as file:
            self.data = json.load(file)
            file.close
                    
        # Lista de la forma 0 = ['AAA']
        self.code_list:list = list(self.data.keys())
    
        # Diccionario de la forma ['AAA'] = 0
        self.code_dict:dict = {airport:idx for idx, airport in enumerate(self.code_list)}
        
        # Lista de tuplas que representa cada conexion del grafo
        self.connections:list = self.get_connections(self.data)
        
        self.graph : Graph = Graph(len(self.code_list))
        [ self.graph.add_edge (self.code_dict[flight[0]], self.code_dict[flight[1]], flight[2] ) for flight in self.connections ]
    
 # ===========================================================================================================================
 
    def get_connections(self, d) -> list[tuple]:
        connections = []
        for code, airport in d.items():
            for connected_code in airport['connections']:
                if connected_code not in self.code_list:
                    continue
                lat1, lon1 = airport['latitude'], airport['longitude']
                lat2, lon2 = d[connected_code]['latitude'], d[connected_code]['longitude']
                dist = self.calculate_distances(lat1, lon1, lat2, lon2)
                if (code, connected_code, dist) not in connections:
                    connections.append((code, connected_code, dist))
                    connections.append((connected_code, code, dist))
        return connections

    def calculate_distances(self, lat1, lon1, lat2, lon2):
        # Convertir las coordenadas de grados a radianes
        lat1 = math.radians(lat1)
        lon1 = math.radians(lon1)
        lat2 = math.radians(lat2)
        lon2 = math.radians(lon2)
        
        # Radio de la Tierra en kilómetros
        R = 6371.0
        
        # Diferencias de latitudes y longitudes
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        # Fórmula del Haversine
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        # Distancia final en kilómetros
        distancia = R * c
        return distancia
    
    #Metodos para manipular el JSON y el grafo asociado -------

    def add_airport(self, code:str, location:dict):
        if code in self.code_list:
            return
        elif code in list(self.code_dict.items):
            return # TODO: If code existed at some point then re-add data from base json
        
        self.code_dict[code] = len(self.code_list) # Adds the new code to the dict
        self.code_list.append(code)
        



    #Remove an airport and its connections from the code_list and associated json
    def remove_airport(self, code:str):

        if code not in self.code_list:
            return
        
        index:int = self.code_dict[code]

        #self.code_dict.pop(code)  # --- dict needs to always know what airport belongs to what index (?)
        self.code_list.remove(code) # -- list needs to forget code so its connections can be wiped 
        self.data[code]['connections'] = ["404"]
        self.connections = self.get_connections(self.data)

        jsob = json.dumps(self.data, indent=4)
        self.write_to(self.filepath, jsob) # write to the json file
        
        #self.graph.remove(index)

    def write_to(self, path:str, jsob):
        with open(path, "w", encoding="utf-8") as file:
            file.write(jsob)

        