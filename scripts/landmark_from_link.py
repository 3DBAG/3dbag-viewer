import re
import json

# Put the viewer link as input, the landmark name as name, like this:
link = "https://3dbag.nl/en/viewer?rdx=31667.77192763792&rdy=391499.98936471523&ox=239.9201152731839&oy=235.39708773840658&oz=34.40137052722275"
name = "Stadhuis, Middelburg"
city = "middelburg"

res = re.findall("(?<=\=)(.*?)(?=\&)", link)
oz = link.split("=")[-1]

out = { city: { "name": name, "rdx": res[0], "rdy": res[1], "ox": res[2], "oy": res[3], "oz": oz } }

print(json.dumps(out, indent=2))