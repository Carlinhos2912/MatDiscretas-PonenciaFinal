from flask import Blueprint, request, jsonify, render_template
from app.models.csv_filedata import CSV_FileData

pato = CSV_FileData('project/app/static/resources/flights_final.csv')

api = Blueprint('api', __name__)
core = Blueprint('core', __name__)

@core.route("/")
def home():
    return render_template('home.html')

@api.route("/api/path", methods=["POST"])
def pathRoute():
    data = request.get_json()
    source = data.get('source')
    destination = data.get('destination')

    actual_shorter_path = pato.get_index_of_edges(pato.graph, source, destination)

    return jsonify(actual_shorter_path)
