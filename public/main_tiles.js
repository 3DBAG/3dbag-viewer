/* Map and layer sources */

var parser = new ol.format.WMTSCapabilities();
proj4.defs("EPSG:28992", "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs");
ol.proj.proj4.register(proj4);
var dutchProjection = ol.proj.get('EPSG:28992');

fetch('https://geodata.nationaalgeoregister.nl/wmts?request=GetCapabilities').then(function (response) {
    return response.text();
}).then(function (text) {
    var result = parser.read(text);
    console.log(result)

    var brt_options = ol.source.WMTS.optionsFromCapabilities(result, {
        layer: 'brtachtergrondkaartgrijs',
        matrixSet: 'EPSG:28992',
        format: 'image/png8',
        crossOrigin: 'anonymous'
    });

    var brt = new ol.layer.Tile({
        // extent: [84902.936976066296,446592.57878318388,85540.648956581674,447052.9389111299],
        source: new ol.source.WMTS((brt_options))
    });

    var bag_tiles = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: './bag_tiles_3k.geojson',
            format: new ol.format.GeoJSON({
                dataProjection: dutchProjection
            }),
        }),
    });

    var view = new ol.View({
        projection: dutchProjection,
        // sample data center
        // center: [120953, 486328],
        // 3Dgeoinfo office
        center: [85177.9151549, 446749.16831151],
        maxZoom: 28,
        zoom: 12
    });

    var map = new ol.Map({
        layers: [brt, bag_tiles],
        target: document.getElementById('map'),
        view: view,
    });


    // var select = null; // ref to currently selected interaction

    // select interaction working on "singleclick"
    var select = new ol.interaction.Select({condition: ol.events.condition.click,});

    if (select !== null) {
    map.addInteraction(select);
    select.on('select', function (e) {
        console.log('Selected: ' + e.selected[0].get('tile_id'));
        var filename = e.selected[0].get('tile_id')+'.json';
        window.location.href = 'https://3d.bk.tudelft.nl/3dbag/v20100/'+filename;
    });
    }
});
