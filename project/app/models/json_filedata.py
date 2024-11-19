import json
import math

from .graph import Graph
from ..utils.json_parser import copy_json

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
        copy_json("project/app/static/resources/base_airports_data.json", filepath)

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

    def add_airport(self, code:str, airport_data:dict):
        if code in self.code_list and self.data[code]["connections"] != ["404"]:
            return
        #elif code in list(self.code_dict.items):
        #    return # TODO: If code existed at some point then re-add data from base json
        
        self.code_dict[code] = len(self.code_list) # Adds the new code to the dict
        self.code_list.append(code) # -------------- Adds the new code to the list
        self.data[code] = airport_data # ----------- Appends the airport data to its own entry in the data dict

        #Instead of recalculating every distance again, just go over the new connections
        #newconnections go from the inserted vertex to the others, bidirection goes the other way.
        #These lists are different because only newconnections will be used to update the graph. 
        newconnections:list[tuple] = []
        bidirection:list[tuple] = []
        lat1 = self.data[code]['latitude']
        long1 = self.data[code]['longitude']

        for dest in self.data[code]['connections']:
            lat2 = self.data[dest]['latitude']
            long2 = self.data[dest]['longitude']
            dist = self.calculate_distances(lat1, long1, lat2, long2)

            newconnections.append((code, dest, dist))
            bidirection.append((dest, code, dist))

            self.data[dest]['connections'].append(code)  # Destination airport needs its connections updated


        self.connections.append(newconnections)
        self.connections.append(bidirection)

        self.write_to("project/app/static/resources/extended_airports_data.json", self.data) # -- Write data dict to the json file
        print(self.graph.size)
    
        if code in self.code_dict.keys():
            #If the airport already has an index, just update its adjacencies
            [self.graph.add_edge(self.code_dict[con[0]], self.code_dict[con[1]], con[2]) for con in newconnections]
        else:
            #If not, add a new vertex with its newconnections. this vertex's index should line up with self.code_list and code_dict.
            self.graph.add_vertex([(self.code_dict[con[1]], con[2]) for con in newconnections])
            print(self.graph.size)

        
        

    #Remove an airport and its connections from the code_list and associated json
    def remove_airport(self, code:str):

        if code not in self.code_list:
            return
        
        #self.code_dict.pop(code)  # --- dict needs to always know what airport belongs to what index, so keep this commented (?)
        self.code_list.remove(code) # -- list needs to forget code so its connections can be wiped

        for con in self.data[code]['connections']: # destination airports should wipe deleted airport from its connections
            self.data[con]['connections'].remove(code)

        self.data[code]['connections'] = ["404"] # --- flag value that denotes deletion status

        self.connections = self.get_connections(self.data) 
        # ^ searching and removing deprecated connections could take more time, so just recalculate everything ( O(m*n) vs. O(n) ?)

        self.write_to(self.filepath, self.data)
        
        self.graph.supress_vertex(self.code_dict[code])




    def add_connection(self, to:str, frm:str):

        if to not in self.code_list or frm not in self.code_list: 
            #Early return if any of the codes isnt in the graph
            return
        
        #Calculate distance, append them to the connections list
        lat1, long1 = self.data[to]['latitude'], self.data[to]['longitude']
        lat2, long2 = self.data[frm]['latitude'], self.data[frm]['longitude']
        dist:float = self.calculate_distances(lat1, long1, lat2, long2)

        tofrm, frmto = (to, frm, dist), (frm, to, dist)

        self.connections.append(tofrm)
        self.connections.append(frmto)

        #Add connections to the JSON, write em
        self.data[to]['connections'].append(frm)
        self.data[frm]['connections'].append(to)

        self.write_to(self.filepath, self.data)

        self.graph.add_edge(self.code_dict[frm], self.code_dict[to], dist)
    
    def remove_connection(self, to: str, frm: str):
        if to not in self.code_list or frm not in self.code_list: 
            # Early return if any of the codes isn't in the graph
            return
    
        # Remove the connection from self.connections
        self.connections = [con for con in self.connections if not (
            (to == con[0] and frm == con[1]) or (to == con[1] and frm == con[0])
        )]
    
        # Remove connections from the JSON data and update
        print(self.data[to]['connections'])
        print(self.data[frm]['connections'])
        self.data[to]['connections'].remove(frm)
        self.data[frm]['connections'].remove(to)
    
        # Save the updated data
        self.write_to(self.filepath, self.data)
    
        # Remove the edge from the graph
        self.graph.remove_edge(self.code_dict[frm], self.code_dict[to])

        

    # utils -------------
    def write_to(self, path:str, d:dict):
        jsob = json.dumps(d, indent=4, ensure_ascii=False)
        with open(path, "w", encoding="utf-8") as file:
            file.write(jsob)
            file.close()

    #Fetch the codes that make up the shortest path between two nodes, return in a list [ ( (frm, to), dist ) ]
    def get_codes_of_path(self, graph:Graph , src:str, dst:str) -> list:

        path_list:list = []

        #Get source and destination airport indices
        in_source:int = self.code_dict[src]
        in_destination:int = self.code_dict[dst]

        #Perform djikstra to walk the path
        dijkstra_path:tuple[list, int] = graph.dijkstra(in_source, in_destination)
        print(dijkstra_path)

        path_length:int = len(dijkstra_path[0])

        for i in range(path_length-1):
            #Grab ends of edge to build a tuple with the form ((frm, to), dst)
            frm:str = self.code_list[dijkstra_path[0][i]]
            to:str = self.code_list[dijkstra_path[0][i+1]]

            lat1, lon1 = self.data[frm]['latitude'], self.data[frm]['longitude']
            lat2, lon2 = self.data[to]['latitude'], self.data[to]['longitude']

            path_list.append(((frm, to), self.calculate_distances(lat1, lon1, lat2, lon2)))
        
        return path_list

        