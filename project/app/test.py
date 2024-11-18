from models.json_filedata import JSON_FileData
from models.graph import Graph
from utils import json_to_graph

if __name__ == "__main__":
    
    # JSON test
    filedata = JSON_FileData("project/app/static/resources/test.json")
    #filedata.remove_airport("BOG")
    filedata_t = JSON_FileData("project/app/static/resources/test.json")
    print(filedata_t.data)
    #grafito = json_to_graph(filedata)

