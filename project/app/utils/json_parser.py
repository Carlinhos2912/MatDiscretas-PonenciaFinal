import json

# Convierte el JSON en un diccionario
def json_to_dict ( path : str ='project/app/static/resources/airports_data.json' ) -> dict :
    with open ( path, 'r' ) as file:
        airports_dict = json.load(file)
    return airports_dict
