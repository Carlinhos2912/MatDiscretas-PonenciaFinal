from models.json_filedata import JSON_FileData
from models.graph import Graph
from utils import json_to_graph

def airport_json_test():
    # JSON test -- every READ is done with a different JSON_FileData instance for rigor. Alternatively, a JSON_FileData.update() could be written
    filedata = JSON_FileData("project/app/static/resources/test.json")
    debug_bog:dict = filedata.data["BOG"] # READ

    debug_bog = debug_bog.copy()

    filedata.remove_airport("BOG") # WRITE

    filedata_t = JSON_FileData("project/app/static/resources/test.json") # READ

    filedata_t.add_airport("BOG", debug_bog) # WRITE

    filedata_f = JSON_FileData("project/app/static/resources/test.json") # READ


if __name__ == "__main__":

    #airport_json_test()

    airport_json_test()

    



