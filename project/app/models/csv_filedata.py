import math
import pandas as pd
import math

from .graph import Graph

class CSV_FileData():
    def __init__(self, filepath:str) -> None:

        #DataFrame that stores everything in the CSV in the columns as named below
        self.dataframe:pd.DataFrame = pd.read_csv(filepath)
        self.dataframe = self.dataframe[['Source Airport Code',
                                         'Source Airport Name',
                                         'Source Airport City',
                                         'Source Airport Country',
                                         'Source Airport Latitude',
                                         'Source Airport Longitude',
                                         'Destination Airport Code',
                                         'Destination Airport Name',
                                         'Destination Airport City',
                                         'Destination Airport Country',
                                         'Destination Airport Latitude',
                                         'Destination Airport Longitude']]
        #self.dataframe = self.dataframe.drop_duplicates() 
        #Se remueven los dupes para evitar calcular distancias redundantes, pero igual se puede omitir (el grafo lo valida)
        
        self.dataframe = self.dataframe.reset_index()

        #List used to map each code to an index
        self.code_list:list = sorted(pd.unique(self.dataframe[['Source Airport Code', 'Destination Airport Code']].values.ravel()))

        #Dict
        self.code_dict:dict = {airport:idx for idx, airport in enumerate(self.code_list)}
        
        #List of tuples that each describes an edge in the to-be graph
        self.connections:list = self.dataframe.apply(lambda row: (
                                                             row['Source Airport Code'], #FROM
                                                             row['Destination Airport Code'], #TO

                                                             self.calculate_distances(
                                                                 row['Source Airport Latitude'], 
                                                                 row['Source Airport Longitude'],
                                                                 row['Destination Airport Latitude'], 
                                                                 row['Destination Airport Longitude'])
                                                            ), 
                                                            axis=1).values.tolist()
        
        self.graph = csv_to_graph(self)
        #print(self.connections)
        
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

def csv_to_graph(path:CSV_FileData) -> Graph:
    try:
        csv = path #Opens csv, if its there
    except:
        print("Invalid Filepath :(")
        return
    
    grafo = Graph(len(csv.code_list)) #Makes a graph with the nodes needed

    for edge in csv.connections: #Adds the edges
            frm:int = csv.code_dict[edge[0]]
            to:int = csv.code_dict[edge[1]]
            dist:float = edge[2]
            print("FROM: ", edge[0], frm, " TO: ", edge[1], to, " DIST: ", dist, end="\n")
            grafo.add_edge(frm, to, dist)
    
    return grafo

    

        