import json
import copy

filename = "lod13_kadaster/tileset.json"
output = "lod13_kadaster/tileset1.json"

with open(filename, "r") as in_file:
    tileset = json.load(in_file)

root = tileset["root"]

new_children = []

for child in root["children"]:
    middle = copy.deepcopy(child)
    del middle["content"]
    middle["geometricError"] = 200
    middle["children"] = [ child ]
    new_children.append(middle)
    
root["children"] = new_children

with open(output, "w") as file:
    json.dump(tileset, file)
