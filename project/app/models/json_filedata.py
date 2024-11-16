import json
import math

from .graph import Graph

class JSON_FileData():
    def __init__(self, filepath:str) -> None:

        self.data:dict = {}
        with open(filepath) as file:
            self.data = json.load(file)
            file.close
            
        #List used to map each code to an index
        self.code_list:list = list(self.data.keys())
    
        #Dict that maps each airport to its index
        self.code_dict:dict = {airport:idx for idx, airport in enumerate(self.code_list)}
        
        #List of tuples that each describes an edge in the to-be graph
        self.connections:list = self.get_connections(self.data)
        print(self.connections)
    
    def get_connections(self, d) -> list[tuple]:
        connections = []
        for code, airport in d.items():
            print("looking at: ", end="")
            print(code)
            for connected_code in airport['connections']:
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


    #CSV indexes of adjacencies that draw a path from src -> dst
    def get_index_of_edges(self, graph:Graph , src:str, dst:str) -> list:

        in_list:list = []

        #Get source and destination airport indices
        in_source:int = self.code_dict.get(src)
        in_destination:int = self.code_dict.get(dst)

        #Perform djikstra to walk the path
        dijkstra_path:tuple[list, int] = graph.dijkstra(in_source, in_destination)
        print(dijkstra_path)

        path_length:int = len(dijkstra_path[0])

        for i in range(path_length-1):
            #Fetch codes of every airport involved
            frm:str = self.code_list[dijkstra_path[0][i]]
            to:str = self.code_list[dijkstra_path[0][i+1]]

            print("from: ", frm, " to: ",to)
            
            #Panda magic to get the correct index in the original CSV
            adjacent_index = self.dataframe.loc[(self.dataframe['Source Airport Code'] == frm) & (self.dataframe['Destination Airport Code'] == to)]

            if (adjacent_index.empty): #Flip the codes if djikstra says they're adjacent but the CSV cant find it...
                adjacent_index = self.dataframe.loc[(self.dataframe['Source Airport Code'] == to) & (self.dataframe['Destination Airport Code'] == frm)]

            adjacent_index = adjacent_index['index'].to_list()[0]
            in_list.append((adjacent_index, ))
        
        return (in_list, dijkstra_path[1])
        
        
    #If dst is not passed then...
    def get_index_of_edges_from(self, graph:Graph, src:str) -> list:
        
        in_list:list = []

        #Get source airport index
        in_source:int = self.code_dict.get(src)

        #Perform djikstra to walk the path
        dijkstra_path:tuple[list, list] = graph.dijkstra(in_source)
        adjslist:int = dijkstra_path[1]

        for i in range(len(adjslist)):

            if not adjslist[i]: #If theres no parent for the current airport, return -1.
                in_list.append(-1)
                continue

            #Fetch codes of every airport involved
            frm:str = self.code_list[adjslist[i]]
            to:str = self.code_list[i]
            #print("from: ", frm, " to: ",to)
            #Panda magic to get the correct index in the original CSV
            adjacent_index = self.dataframe.loc[(self.dataframe['Source Airport Code'] == frm) & (self.dataframe['Destination Airport Code'] == to)]
            if(adjacent_index.empty): #Flip the codes if djikstra says theyre adjacent but the CSV cant find it...
                adjacent_index = self.dataframe.loc[(self.dataframe['Source Airport Code'] == to) & (self.dataframe['Destination Airport Code'] == frm)]
            adjacent_index = adjacent_index['index'].to_list()[0]
            in_list.append(adjacent_index)
        
        return in_list

    

        