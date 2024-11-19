from flask import Blueprint, request, jsonify, render_template
from ..models.json_filedata import JSON_FileData

api = Blueprint('api', __name__)
core = Blueprint('core', __name__)

# =======================================================================================================

filedata = JSON_FileData("project/app/static/resources/extended_airports_data.json")
graph = filedata.graph


# =======================================================================================================
#                                    [ LOG PRINT ]
[ print(f"{filedata.code_list[index]} -> {graph.adjacency[index]}" ) for index in range(graph.size) ]
# =======================================================================================================


@core.route("/")
def home():
    return render_template('index.html')

@api.route("/api/get-path", methods=["POST"])
def pathRoute():
    data = request.get_json()
    source = data.get('source')
    destination = data.get('destination')

    actual_shorter_path = filedata.get_codes_of_path(filedata.graph, source, destination)

    return jsonify(actual_shorter_path)


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


@api.route("/api/add-connection", methods=['POST'])
def add_connection():
    code = request.get_json().get("source-code")
    data = request.get_json().get("requested-code")

    if not data or not code:
        return jsonify({"status": "error", "message": "Invalid input"}), 400
    
    filedata.add_connection(data, code)
    return jsonify({"status": "success", "message": f"Airport {code} added successfully!"})

@api.route("/api/delete-connection", methods=['POST'])
def delete_connection():
    code = request.get_json().get("source-code")
    data = request.get_json().get("requested-code")

    if not data or not code:
        return jsonify({"status": "error", "message": "Invalid input"}), 400
    
    filedata.remove_connection(data, code)
    return jsonify({"status": "success", "message": f"Airport {code} added successfully!"})

@api.route("/api/delete-airport", methods=['POST'])
def delete_airport():
    code = request.get_json().get("source-code")
    data = request.get_json().get("requested-code")

    if not data:
        return jsonify({"status": "error", "message": "Invalid input"}), 400
    
    filedata.remove_airport(code)
    return jsonify({"status": "success", "message": f"Airport {code} added successfully!"})


@api.route("/api/get-graph-info")
def get_graph_info():
    results = graph.num_of_components()
    return jsonify([results[0] == 1, results[0], results[1]])

