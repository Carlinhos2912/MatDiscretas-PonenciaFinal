from flask import Blueprint, request, jsonify, render_template
from ..models.json_filedata import JSON_FileData

api = Blueprint('api', __name__)
core = Blueprint('core', __name__)

# =======================================================================================================

filedata = JSON_FileData("project/app/static/resources/base_airports_data.json")
graph = filedata.graph

# =======================================================================================================
#                                    [ LOG PRINT ]
[ print(f"{filedata.code_list[index]} -> {graph.adjacency[index]}" ) for index in range(graph.size) ]
# =======================================================================================================


@core.route("/")
def home():
    return render_template('index.html')


@api.route("/api/add-airport", methods=['POST'])
def add_airport():
    data = request.get_json()  
    code = data.get("code")  
    data_dict = data.get("airport_data")  

    if not code or not data_dict:
        return jsonify({"status": "error", "message": "Invalid input"}), 400

    filedata.add_airport(code, data_dict)
    print(f"Added airport: {code} -> {data_dict}") 

    return jsonify({"status": "success", "message": f"Airport {code} added successfully!"})
