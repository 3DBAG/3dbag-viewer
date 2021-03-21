#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

rsync -rzhP --delete --exclude=".*" . godzilla:/var/www/3dbag-viewer
ssh godzilla "chgrp staff3d -R /var/www/3dbag-viewer"

cd -
