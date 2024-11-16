from project.app.models.graph import Graph
from project.app.models.json_filedata import JSON_FileData


def json_to_graph(path:JSON_FileData) -> Graph:
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