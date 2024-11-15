from flask import Blueprint, request, jsonify, render_template
from ..models.graph import Graph
from ..utils.json_parser import json_to_dict

api = Blueprint('api', __name__)
core = Blueprint('core', __name__)

# ==========================
base_data = json_to_dict()
grafo = Graph( len(base_data.keys()) )
# ===========================

@core.route("/")
def home():
    return render_template('index.html')

@api.route("/api/get-graph")
def get_graph():
    return json_to_dict