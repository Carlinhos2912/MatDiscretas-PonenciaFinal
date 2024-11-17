from flask import Blueprint, request, jsonify, render_template
from ..models.json_filedata import JSON_FileData

api = Blueprint('api', __name__)
core = Blueprint('core', __name__)

# =======================================================================================================

filedata = JSON_FileData("project/app/static/resources/airports_data.json")
graph = filedata.graph

# =======================================================================================================
#                                    [ LOG PRINT ]
[ print(f"{filedata.code_list[index]} -> {graph.adjacency[index]}" ) for index in range(graph.size) ]
# =======================================================================================================


@core.route("/")
def home():
    return render_template('index.html')


@api.route("/api/get-graph")
def get_graph():
    return json_to_dict