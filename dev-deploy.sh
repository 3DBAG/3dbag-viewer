#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

git init
git add -A
git commit -m 'deploy'

rsync -rzhP . godzilla:/var/www/3dbag-viewer

cd -