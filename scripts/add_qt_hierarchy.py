import json
import copy
import numpy as np
import math

filename = "lod22_kadaster/tileset.json"
output = "lod22_kadaster/tileset2.json"

# x and y dimension of the tiles
leaf_size = 1000
max_error = 500

with open(filename, "r") as in_file:
    tileset = json.load(in_file)

root = tileset["root"]

# create a grid index of the leafs
rootmin_x = -root["boundingVolume"]["box"][3]
rootmin_y = -root["boundingVolume"]["box"][7]
rootsize_x = 2*root["boundingVolume"]["box"][3]
rootsize_y = 2*root["boundingVolume"]["box"][7]
rootsize_z = 2*root["boundingVolume"]["box"][11]

rootdim_x = int(rootsize_x//leaf_size + 1)
rootdim_y = int(rootsize_y//leaf_size + 1)

# each tiles' content by tile id
tile_index = {}
# spatial grid of all the tiles
grid_index = np.zeros(shape=(rootdim_x,rootdim_y), dtype=int)

#populate indices
for child in root["children"]:
    uri = child["content"]["uri"]
    tid = int(uri[6:-5]) ## assuming uri has the form of 'tiles/81090.b3dm' where 81090 is the tid
    cx = child["boundingVolume"]["box"][0]
    cy = child["boundingVolume"]["box"][1]
    r = int(cx//leaf_size)
    c = int(cy//leaf_size)
    tile_index[tid] = child
    grid_index[r,c] = tid

def init_node(range_x, range_y):
    xmin, xmax = range_x
    ymin, ymax = range_y
    xdim = xmax-xmin
    ydim = ymax-ymin
    xc = rootmin_x + (xmin+xdim/2+0.5)/rootdim_x * rootsize_x
    yc = rootmin_y + (ymin+ydim/2+0.5)/rootdim_x * rootsize_x
    
    h = xdim/2
    return {
        "geometricError": 200,#(h/rootdim_x)*max_error, 
        "boundingVolume": [
            xc,yc, 0.0,
            (xdim*leaf_size)/2, 0.0, 0.0,
            0.0, (xdim*leaf_size)/2, 0.0,
            0.0, 0.0, rootsize_z/2
        ]
    }

def recursive_subdivide(range_x, range_y):
    xmin, xmax = range_x
    ymin, ymax = range_y
    dim = xmax-xmin
    h = int(dim/2)
    node = {}
    # print("Node h={}, xmin={}, xmax={}, ymin={}, ymax={}".format(h, xmin, xmax, ymin, ymax))
    # print(node)
    # input()
    if xmin >= rootdim_x or ymin >= rootdim_y:
        return None
    if h < 1:
        # return leafs
        node = tile_index[grid_index[xmin,ymin]]
    else:
        # recurse further
        c1 = recursive_subdivide((xmin, xmin+h), (ymin, ymin+h))
        c2 = recursive_subdivide((xmin+h, xmax), (ymin, ymin+h))
        c3 = recursive_subdivide((xmin, xmin+h), (ymin+h, ymax))
        c4 = recursive_subdivide((xmin+h, xmax), (ymin+h, ymax))
        children = []
        for c in [c1,c2,c3,c4]:
            if c != None:
                children.append(c)
        node = init_node(range_x, range_y)
        node["children"] = children
    
    return node

power_x = math.ceil(math.log2(rootdim_x))
power_y = math.ceil(math.log2(rootdim_y))
root_dim = math.pow(2,max(power_x, power_y))
# root_dim = 4
hierarchy = recursive_subdivide((0,root_dim), (0,root_dim))

root["children"] = hierarchy["children"]

with open(output, "w") as file:
    json.dump(tileset, file)