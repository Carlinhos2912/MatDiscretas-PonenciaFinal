from models.json_filedata import JSON_FileData
from models.graph import Graph
from utils import json_to_graph

def airport_json_test():
    # JSON test -- every READ is done with a different JSON_FileData instance for rigor. Alternatively, a JSON_FileData.update() could be written
    filedata = JSON_FileData("project/app/static/resources/extended_airports_data.json")
    debug_bog:dict = filedata.data["BOG"] # READ
    
    
    print(filedata.get_codes_of_path(filedata.graph, 'PEI', 'APO'))


if __name__ == "__main__":

    #airport_json_test()

    airport_json_test()

    



