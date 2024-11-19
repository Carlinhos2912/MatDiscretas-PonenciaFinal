class Graph():
    #Spawn del grafo
    def __init__(self, size:int=1) -> None:
        self.size:int = size
        self.directed = False
        self.adjacency: list[list[tuple[int, int]]] = [[] for _ in range(self.size)] 

    # Operaciones del grafo ===============================================================================
    def add_vertex(self, adjacent:list[tuple[int, float]]=[]):
        self.size += 1
        self.adjacency.append([])
        for em in adjacent: # add_edge validates the existance of em[0] (destination)
            self.add_edge(em[0], em[1])

    def add_edge(self, source:int, destination:int, weight: float = 1.0):
        if 0 <= source < self.size and 0 <= destination < self.size:
            if destination not in [dest for dest, _ in self.adjacency[source]]:
                self.adjacency[source].append((destination, weight))
                self.adjacency[source].sort()

            if source not in [dest for dest, _ in self.adjacency[destination]] and not self.directed:
                self.adjacency[destination].append((source, weight))
                self.adjacency[destination].sort()
    
    # Vertex deletion would screw up index mapping, so prefer just isolating it from everything else.
    # Isolated vertices can be distinguished from deleted vertices through the JSON every airport is stored in.
    def supress_vertex(self, vertex:int):
        if 0 <= vertex < self.size:
            self.adjacency[vertex] = []

    def remove_edge(self, source:int, destination:int):
        if 0 <= source < self.size and 0 <= destination < self.size:
            for i in range(len(self.adjacency[source])):
                edge = self.adjacency[source][i]
                if edge[0] == destination:
                    self.adjacency.pop(edge)
            
            self.adjacency[source].sort()
            
            for i in range(len(self.adjacency[destination])):
                edge = self.adjacency[destination][i]
                if edge[0] == source:
                    self.adjacency.pop(edge)
            
            self.adjacency[destination].sort()
    
    # Propiedades Básicas =================================================================================
    def get_matrix(self, kind:str='adjacency'):
        matrix:list[list] = []

        if kind == 'adjacency':
            matrix = [[0 for _ in range(self.size)] for _ in range(self.size)]
            for row in range(self.size):
                for em in self.adjacency[row]:
                    matrix[row][em[0]] = 1

        elif kind == 'costs' or kind == 'distances':
            matrix = [[float('inf') for _ in range(self.size)] for _ in range(self.size)]
            for row in range(self.size):
                matrix[row][row] = 0
                for em in self.adjacency[row]:
                    matrix[row][em[0]] = em[1]

        elif kind == 'path-template':
            matrix = [[j if i != j else None for j in range(self.size)] for i in range(self.size)]

        return matrix
    def num_of_components(self) -> tuple:
        #recorrido dfs sin print
        def dfs(vertex: int, visited: list = None) -> list:
            if visited is None:
                visited = [False] * self.size
            visited[vertex] = True
            for adj, weight in self.adjacency[vertex]:
                if not visited[adj]:
                    visited = dfs(adj, visited)
            return visited
        
        components = 1
        num_of_vertices = []
        visited = dfs(0)
        num_of_vertices.append(visited.count(True))
        #Si no todos los vertices han sido visitados, hay más de un componente
        while not all(visited):
            #Buscar el primer nodo no visitado
            i = 0
            while visited[i]:
                i += 1
            #DFS desde el primer no visitado
            new_visited = dfs(i)
            #Actualizar visited y aumentar el numero de componentes
            count = 0
            for index in range(self.size):
                if (not visited[index]) and new_visited[index]:
                    count += 1
                    visited[index] = True
            components += 1
            num_of_vertices.append(count)
        return components, num_of_vertices
    
    def has_cycles(self) -> bool:
        visited = []
        stack = []

        def dfs(vertex, parent):
            visited.append(vertex)
            stack.append(vertex)

            for adj, weight in self.adjacency[vertex]:
                if adj not in visited:
                    if dfs(adj, vertex):
                        return True
                elif adj in stack and adj != parent:
                    return True

            stack.remove(vertex)
            return False

        for nodo in range(self.size):
            if nodo not in visited:
                if dfs(nodo, -1):
                    return True

        return
    
    # Recorridos ==========================================================================================
    def bfs(self, vertex: int) -> None:
        visited = [False] * self.size
        queue = [vertex]
        visited[vertex] = True
        while len(queue) > 0:
            pointer = queue.pop(0)
            print(pointer, end = " ")
            for em in self.adjacency[pointer]:
                if not visited[em[0]]:
                    queue.append(em[0])
                    visited[em[0]] = True
        print()      
    def dfs(self, start: int, visited: list[bool] = None, print:bool=False):
        visited = [False] * self.size if visited is None else visited
        visited[start] = True

        if print: print(start, end=" ")

        for adj in self.adjacency[start]:
            if not visited[adj[0]]:
                visited = self.dfs(adj[0], visited)

        return visited    
    
    #Caminos mínimos ======================================================================================
    def dijkstra(self, source: int, target=None):
        # Inicializar arrays
        parents = [None] * self.size
        visited = [False] * self.size
        distances = [float('inf')] * self.size

        distances[source] = 0

        for _ in range(self.size):
            # Encontrar el adyacente no visitado con la menor distancia
            min_distance_adjacent = min((index for index in range(self.size) if not visited[index]), key=lambda v: distances[v], default=None)

            # Si no hay mas visitados o conexos desde la fuente, retornar None
            if min_distance_adjacent is None:
                break

            # Marcar al elemento no visitado de menor peso
            visited[min_distance_adjacent] = True

            # Actualizar desde el elemento no visitado de menor peso
            for em, weight in self.adjacency[min_distance_adjacent]:
                if distances[min_distance_adjacent] + weight < distances[em]:
                    distances[em] = distances[min_distance_adjacent] + weight
                    parents[em] = min_distance_adjacent

        # Si se especifica un objetivo, retornar el camino mas no la lista de distancias
        if target is not None:
            def path(parents, target):
                path = []
                while target is not None:
                    path.append(target)
                    target = parents[target]
                return path[::-1]
            return path(parents,target), distances[target]

        return distances, parents
    
    def floyd_warshall(self, source:int=None, target:int=None):
        #Crear matriz Distance y Paths
        paths = self.get_matrix('path-template')
        distances = self.get_matrix('costs')

        #Recorridos
        for pivot in range(self.size):
            for row in range(self.size):
                for col in range(self.size):
                    if not (row == pivot or col == row): 
                        replacement = distances[pivot][col] + distances[row][pivot]
                        if replacement < distances[row][col]:
                            distances[row][col] = replacement
                            paths[row][col] = pivot

        return (distances, paths) if not source and not target else self.floyd_warshall_path((distances, paths), source,target)
       
    def floyd_warshall_path(self, floyd_warshall: tuple, v_from: int, v_to: int) -> list:
        distances, path = floyd_warshall
        
        out = [v_from]
        current = -1
        while ( current != path[v_from][v_to] ):
            current = path[v_from][v_to]
            out += [current, v_to]
            v_to = current
        return out

    #Arboles de expansion minima ==========================================================================
    def kruskal(self):
        #Organizar las aristas
        edges = []
        for v_from, adjs in enumerate(self.adjacency):
            for v_to, weight in adjs:
                if (weight, (v_to, v_from)) not in edges:
                    edges.append((weight, (v_from, v_to)))
        edges.sort()
        #Termina si el resultante tiene n-1
        while len(edges) != (self.size - 1):
            #Caso de error
            if len(edges) < (self.size - 1):
                print("Alto ahí")
                return ["Esto no debía pasar... Eliminando evidencia"]
            #Añadir al grafo resultante todas las aristas que no formen ciclos
            out = Graph(self.size)
            for w, edge in edges:
                out.add_edge(edge[0], edge[1], w)
                if out.has_cycles():
                    edges.remove((w, edge))
                    break
        return edges
    def prim(self, v_from: int) -> list:
        queue = []
        def append_adjacencts(vertex: int, aviables: list):
            for v_to, weight in self.adjacency[vertex]:
                if (weight, (v_to, vertex)) not in aviables:
                    aviables.append((weight, (vertex, v_to)))
            aviables.sort()
            return aviables
        #En una lista añadir todos los adyacentes a v_from ordenados por menor peso
        queue = append_adjacencts(v_from, queue)
        #Inicializar las listas de salida
        vertices, out_edges = [v_from], []
        #Mientras que no se hayan visitado todos los vertices del grafo y la cola no esté vacía
        while len(vertices) < self.size and len(queue) > 0:
            #Sacamos la arista de menor peso
            w, edge = queue.pop(0)
            v1, v2 = edge
            #Si el vertice final de la arista no ha sido visitada
            if v2 not in vertices:
                vertices.append(v2)
                out_edges.append((w, edge))
                queue = append_adjacencts(v2, queue)
        return out_edges
    
    
    