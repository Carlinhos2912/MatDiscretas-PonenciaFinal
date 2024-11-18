from models.json_filedata import JSON_FileData
from models.graph import Graph
from utils import json_to_graph

def airport_json_test():
    # JSON test -- every READ is done with a different JSON_FileData instance for rigor. Alternatively, a JSON_FileData.update() could be written
    filedata = JSON_FileData("project/app/static/resources/test.json")
    debug_bog:dict = filedata.data["BOG"] # READ

    print("BOG starts with: ")
    print(debug_bog["connections"])

    debug_bog = debug_bog.copy()

    filedata.remove_airport("BOG") # WRITE

    filedata_t = JSON_FileData("project/app/static/resources/test.json") # READ

    print("BOG after deletion")
    print(filedata_t.data["BOG"]["connections"])

    filedata_t.add_airport("BOG", debug_bog) # WRITE

    filedata_f = JSON_FileData("project/app/static/resources/test.json") # READ

    print("BOG after reinsertion")
    print(filedata_f.data["BOG"]["connections"])

    #grafito = json_to_graph(filedata)

if __name__ == "__main__":

    #airport_json_test()

    filedata:JSON_FileData = JSON_FileData("project/app/static/resources/test.json")

    print("Are BOG and MDE connected?: (before addition)")
    print("BOG" in filedata.data["MDE"]['connections'])

    filedata.add_connection("BOG", "MDE")

    print("Are BOG and MDE connected?: (after addition)")
    print("BOG" in filedata.data["MDE"]['connections'])



