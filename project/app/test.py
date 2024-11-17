from models.json_filedata import JSON_FileData
from models.graph import Graph

if __name__ == "__main__":
    
    # JSON test
    filedata = JSON_FileData("project/app/static/resources/airports_data.json")
    grafito = Graph(len(filedata.code_list))
    
    for flight in filedata.connections:
        grafito.add_edge ( 
                         filedata.code_dict[flight[0]],     # Source code to index 
                         filedata.code_dict[flight[1]],     # Destination code to index
                         flight[2]                          # Distance
                         )
    
    for index in range(grafito.size):
        print(f"{filedata.code_list[index]} -> {grafito.adjacency[index]}" )