from models.csv_filedata import CSV_FileData

pato = CSV_FileData('project/app/static/resources/flights_final.csv')

print(pato.get_index_of_edges( pato.graph, 'BOB', 'MEX' ))