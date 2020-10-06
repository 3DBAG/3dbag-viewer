import {
    TextureLoader,
    LinearFilter,
    PlaneBufferGeometry,
    MeshBasicMaterial,
    Mesh,
    Group,
    Vector2
} from 'three';
import {
    ResourceTracker
} from './ResourceTracker.js'
import * as X2JS from 'x2js';

export class WMTSTilesRenderer {

    constructor( wmtsOptions ) {

        this.format = wmtsOptions.format;
        this.request = wmtsOptions.request;
        this.service = wmtsOptions.service;
        this.tileMatrixSet = wmtsOptions.tileMatrixSet;
        this.url = wmtsOptions.url;
        this.tileLevel = 10;
        this.tileMatrix += ":" + this.tileLevel;

        this.capabilitiesURL = this.url + "request=GetCapabilities&service=WMTS"
        this.tileMatrixLevels = null;
        this.activeTiles = [];
        
        this.wmtsOptions = wmtsOptions;
        this.wmtsOptions.tileMatrix = this.tileMatrix;

        this.group = new Group();
        this.resourceTracker = new ResourceTracker();
        this.track = this.resourceTracker.track.bind( this.resourceTracker );

        this.fetchCapabilities( this.capabilitiesURL ).then( capabilities => {

            console.log(capabilities);

            this.capabilities = capabilities;
            this.setTileMatrixLayer();

        });


    }

    setTileMatrixLayer() {

        var tileMatrixSetCRS = this.tileMatrixSet;
        
        this.capabilities["Capabilities"]["Contents"]["TileMatrixSet"].forEach(function (tm, i) {
            if (tm["Identifier"]["__text"] == tileMatrixSetCRS){

                this.tileMatrixLayer = tm["TileMatrix"];

            };
        }, this)

        this.tileMatrixLevels = this.tileMatrix.length;

    }

    fetchCapabilities ( url ){

        var x2js = new X2JS();

        return fetch( url )
        .then( res => res.text())
        .then(xml => {

            return x2js.xml2js( xml );

        });

    }

    update( cameraInfo, sceneCenter ){

        //console.log(cameraInfo);

        // todo: determine which tile level you want to load (which should depend on the SSE?)
        var tileLayer = this.tileMatrixLayer[this.tileLevel];

        console.log(tileLayer);

        var matrixHeight = tileLayer["MatrixHeight"];
        var matrixWidth = tileLayer["MatrixWidth"];
        var scaleDenominator = tileLayer["ScaleDenominator"];
        var tileWidth = tileLayer["TileWidth"];
        var tileHeight = tileLayer["TileHeight"];
        var topLeftCorner = tileLayer["TopLeftCorner"].split(" ");
        var tileMatrixMinX = parseFloat(topLeftCorner[0]);
        var tileMatrixMaxY = parseFloat(topLeftCorner[1]);

        var pixelSpan = scaleDenominator * 0.00028;
        var tileSpanX = tileWidth * pixelSpan;
        var tileSpanY = tileHeight * pixelSpan;
        var tileMatrixMaxX = tileMatrixMinX + tileSpanX * matrixWidth;
        var tileMatrixMinY = tileMatrixMaxY - tileSpanY * matrixHeight;

        var xWidth = (tileMatrixMaxX - tileMatrixMinX) / matrixWidth;
        var yWidth = (tileMatrixMaxY - tileMatrixMinY) / matrixHeight;

        var position = cameraInfo[0]["position"];

        var xTile = Math.floor((position.x - tileMatrixMinX) / xWidth);
        var yTile = Math.floor(matrixHeight - (position.y - tileMatrixMinY) / yWidth);

        var tileIndex = [xTile, yTile];

        var tileIndices = [];
        for (var i = tileIndex[0] - 5; i <= tileIndex[0] + 5; i ++){

            for (var j = tileIndex[1] - 5; j <= tileIndex[1] + 5; j ++){

                tileIndices.push( [i,j] );

            }
            
        }

        tileIndices.forEach(function (ti){

            if (JSON.stringify(this.activeTiles).indexOf(JSON.stringify(ti)) == -1){

                var scenePosition = new Vector2();
                scenePosition.x = tileMatrixMinX + ti[0] * xWidth + xWidth / 2 - sceneCenter.x;
                scenePosition.y = tileMatrixMaxY - ti[1] * yWidth - yWidth / 2 - sceneCenter.y;

                this.create_tile(ti, tileSpanX, tileSpanY, scenePosition);
    
            }

        }, this)


    }

    create_tile( tileIndex, tileSpanX, tileSpanY, scenePosition ){

        var requestURL = this.url;

        for (const [k,v] of Object.entries(this.wmtsOptions)) {
            if (k != Object.keys(this.wmtsOptions)[0]){
                requestURL += "&";
            }
            requestURL += k + "=" + v;
        }

        requestURL += "&TileCol=" + tileIndex[0].toString();
        requestURL += "&TileRow=" + tileIndex[1].toString();

        var loader = new TextureLoader();
    
        var diffuseMap = loader.load( requestURL, this.onLoadTile );
        diffuseMap.minFilter = LinearFilter;
        diffuseMap.generateMipmaps = false;
    
        var geometry = this.track( new PlaneBufferGeometry( tileSpanX, tileSpanY ) );
        var material = new MeshBasicMaterial( { map: this.track( diffuseMap ) } );
    
        var mesh = new Mesh( geometry, material );
        this.group.add( mesh );
    
        mesh.position.x = scenePosition.x;
        mesh.position.y = scenePosition.y;
        mesh.updateMatrix();

        this.activeTiles.push(tileIndex);
    }

}