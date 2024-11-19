import json

# Convierte el JSON en un diccionario
def json_to_dict ( path : str ='project/app/static/resources/airports_data.json' ) -> dict :
    with open ( path, 'r' ) as file:
        airports_dict = json.load(file)
    return airports_dict


def copy_json(source_path, destination_path):

    # Copies the content of one JSON file to another.
    
    try:
        # Open and read the source JSON file
        with open(source_path, 'r', encoding='utf-8') as source_file:
            data = json.load(source_file)  # Load JSON data

        # Write the data to the destination JSON file
        with open(destination_path, 'w', encoding='utf-8') as destination_file:
            json.dump(data, destination_file, indent=4, ensure_ascii=False)

        print(f"Successfully copied JSON from '{source_path}' to '{destination_path}'.")
    except Exception as e:
        print(f"Error occurred while copying JSON: {e}")

