

<template>
  <section class="section content">
    <h1
      id="introduction"
      class="title is-3"
    >
      Introduction
    </h1>

    <p>
      This the best 3D BAG we ever made. Really.
    </p>

    <p>
      The Basisregistraties Adressen en Gebouwen (BAG) is the most detailed, openly
      available data set on buildings and addresses in the Netherlands. It contains
      information about each address in a building, such as its current use,
      construction date or registration status. The polygons in the BAG represent
      the footprint of the building as the projection of the roof’s outline. The data
      set is regularly updated as new buildings are registered, built or demolished.
    </p>

    <p>
      The Actueel Hoogtebestand Nederland (AHN) is the openly available elevation
      model of the Netherlands obtained by aerial laser scanning. The current is the
      third version which has been acquired through 2014-2019. Although the point cloud
      from the first collected areas are about six years old now, we estimate that the
      height data is still actual for over 96% of the buildings in the Netherlands.
    </p>

    <p>
      The 3D BAG combines the BAG and the AHN and models the buildings of the
      Netherlands 3D.
    </p>

    <h2
      id="features"
      class="subtitle is-3"
    >
      Main features
    </h2>

    <p>Below are some of the highlights of this data set.</p>

    <h3>Data</h3>
    <ul>
      <li>
        Three <a href="https://3d.bk.tudelft.nl/lod/">levels of detail</a>. We added LoD1.3 and LoD2.2 to the previously
        available LoD1.2 models.
      </li>
      <li>
        2D and 3D. Both 2D roofsurface polygons and full 3D models are available
        in all levels of detail.
      </li>
      <li>
        Greenhouses and warehouses. These buildings are marked in the BAG and
        only reconstructed in LoD1.2.
      </li>
      <li>
        Underground and floating (building above building) buildings. These
        buildings are marked in the BAG and they are not reconstructed at all.
      </li>
      <li>
        Under-/ground and above ground parts. The BAG footprints are split into
        parts that are above the ground, like a standing construction, and parts
        that are either underground or they are the ground itself. We only include
        the above ground parts for the LoD1.3 and LoD2.2 reconstruction.
      </li>
      <li>CityJSON format. The 3D models are available as CityJSON.</li>
      <li>Download the data per tiles, instead of the whole country at once.</li>
      <li>
        Additional quality metrics. We compute several metrics to help assess the
        reconstruction quality.
      </li>
    </ul>

    <h3>Website</h3>
    <ul>
      <li>Completely revamped website.</li>
      <li>
        3D viewer. We added a brand new 3D viewer, so now you can view the 3D BAG
        truly in 3D.
      </li>
      <li>Switch between LoDs in the viewer. You can switch in the top left corner in the Map.</li>
      <li>
        Direct feedback. Report issues or give feedback without leaving the
        website. Check the bottom right corner in the Map.
      </li>
    </ul>

    <h1
      id="attributes"
      class="subtitle is-3"
    >
      Attributes
    </h1>

    <div class="table-wrapper">
      <table class="table is-striped is-full-width">
        <thead>
          <tr class="odd">
            <th />
            <th>
              Attribute name
            </th>
            <th>
              Unit
            </th>
            <th>
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="odd">
            <td>
              0
            </td>
            <td>
              fid
            </td>
            <td>
              –
            </td>
            <td>
              Feature ID.
            </td>
          </tr>
          <tr class="odd">
            <td>
              1
            </td>
            <td>
              identificatie
            </td>
            <td>
              –
            </td>
            <td>
              BAG: De unieke aanduiding van een pand.
            </td>
          </tr>
          <tr class="odd">
            <td>
              2
            </td>
            <td>
              _rmse
            </td>
            <td>
              metre
            </td>
            <td>
              Root mean square error between the 3D model and input point cloud (only roof points).
            </td>
          </tr>
          <tr class="odd">
            <td>
              3
            </td>
            <td>
              _m2pc_error_max
            </td>
            <td>
              metre
            </td>
            <td>
              Maximum errors from any mesh vertex to point cloud.
            </td>
          </tr>
          <tr class="odd">
            <td>
              4
            </td>
            <td>
              val3dity_codes
            </td>
            <td>
              –
            </td>
            <td>
              Val3dity error codes for the 3D model. <code>Null</code> means valid geometry.
            </td>
          </tr>
          <tr class="odd">
            <td>
              5
            </td>
            <td>
              _roof_pt_cnt
            </td>
            <td>
              count
            </td>
            <td>
              Total number of points in roof planes.
            </td>
          </tr>
          <tr class="odd">
            <td>
              6
            </td>
            <td>
              _wall_pt_cnt
            </td>
            <td>
              count
            </td>
            <td>
              Total number of points in wall planes.
            </td>
          </tr>
          <tr class="odd">
            <td>
              7
            </td>
            <td>
              _unsegmented_pt_cnt
            </td>
            <td>
              count
            </td>
            <td>
              Number of unsegmented points.
            </td>
          </tr>
          <tr class="odd">
            <td>
              8
            </td>
            <td>
              lod
            </td>
            <td>
              –
            </td>
            <td>
              Level of Detail.
            </td>
          </tr>
          <tr class="odd">
            <td>
              9
            </td>
            <td>
              _t_run
            </td>
            <td>
              milliseconds
            </td>
            <td>
              Total reconstruction time in ms (for all LoDs).
            </td>
          </tr>
          <tr class="odd">
            <td>
              10
            </td>
            <td>
              _data_area
            </td>
            <td>
              square metre
            </td>
            <td>
              Area in footprint that has a roofplane above it.
            </td>
          </tr>
          <tr class="odd">
            <td>
              10
            </td>
            <td>
              _nodata_area
            </td>
            <td>
              square metre
            </td>
            <td>
              Area in footprint that has no roofplane above it (<code>nodata area = total footprint area - data_area</code>).
            </td>
          </tr>
          <tr class="odd">
            <td>
              10
            </td>
            <td>
              _data_coverage
            </td>
            <td>
              percentage
            </td>
            <td>
              Percentage of footprint area that has a roofplane above it.
            </td>
          </tr>
          <tr class="odd">
            <td>
              11
            </td>
            <td>
              _lod13_22_missing
            </td>
            <td>
              –
            </td>
            <td>
              Indicates whether the LoD1.3/LoD2.2 reconstruction was skipped for this feature (and also LoD1.2 reconstruction if <code>lod12_replace==false</code>). This can happen when there were points found for instance.
            </td>
          </tr>
          <tr class="odd">
            <td>
              12
            </td>
            <td>
              h_maaiveld
            </td>
            <td>
              metre
            </td>
            <td>
              NAP elevation at groundlevel. Calculated as the 5th percentile of the ground points found within a 4 meter radius of the building.
            </td>
          </tr>
          <tr class="odd">
            <td>
              13
            </td>
            <td>
              pw_datum
            </td>
            <td>
              YYYY-MM-DD
            </td>
            <td>
              Acquisition date of the point cloud. In case of the AHN3, this is an assumed acquisition date, which is computed as 1st of December in the year *before* the officially reported acquisition year (inwijnjaar) of a particular AHN3 tile.
            </td>
          </tr>
          <tr class="odd">
            <td>
              14
            </td>
            <td>
              pw_actueel
            </td>
            <td>
              true/false
            </td>
            <td>
              Does the date of the point cloud match the bouwjaar of the building?
            </td>
          </tr>
          <tr class="odd">
            <td>
              15
            </td>
            <td>
              pw_bron
            </td>
            <td>
              –
            </td>
            <td>
              Source of the point cloud.
            </td>
          </tr>
          <tr class="odd">
            <td>
              16
            </td>
            <td>
              reconstructie_methode
            </td>
            <td>
              –
            </td>
            <td>
              Reconstruction method of the building model.
            </td>
          </tr>
          <tr class="odd">
            <td>
              17
            </td>
            <td>
              versie_methode
            </td>
            <td>
              –
            </td>
            <td>
              Version of the building reconstruction method.
            </td>
          </tr>
          <tr class="odd">
            <td>
              18
            </td>
            <td>
              kas_warenhuis
            </td>
            <td>
              true/false
            </td>
            <td>
              The building is greenhouse or warehouse (according to Top10NL).
            </td>
          </tr>
          <tr class="odd">
            <td>
              19
            </td>
            <td>
              dak_type
            </td>
            <td>
              –
            </td>
            <td>
              Roof type of the building.
            </td>
          </tr>
          <tr class="odd">
            <td>
              20
            </td>
            <td>
              ondergronds_type
            </td>
            <td>
              –
            </td>
            <td>
              Underground class of the building.
            </td>
          </tr>
          <tr class="odd">
            <td>
              21
            </td>
            <td>
              kwaliteits_klasse
            </td>
            <td>
              –
            </td>
            <td>
              Indication of the confidence that the reconstruction is realistic, compared to the real building.
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <h4 class="subtitle is-4">
      Possible values for <code>dak_type</code>
    </h4>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr class="odd">
            <th><code>dak_type</code> value</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr class="odd">
            <td><code>2</code></td>
            <td>roof with at least one slanted surface</td>
          </tr>
          <tr class="odd">
            <td><code>1</code></td>
            <td>roof with multiple, only horizontal surfaces</td>
          </tr>
          <tr class="odd">
            <td><code>0</code></td>
            <td>roof with a single horizontal surface</td>
          </tr>
          <tr class="odd">
            <td><code>-1</code></td>
            <td>no point was found for the building</td>
          </tr>
          <tr class="odd">
            <td><code>-2</code></td>
            <td>could not detect a roof surface, even though points were found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h4 class="subtitle is-4">
      Possible values for <code>ondergronds_type</code>
    </h4>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr class="odd">
            <th><code>ondergronds_type</code> value</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr class="odd">
            <td><code>1</code></td>
            <td>Building or building part is above other buildings.</td>
          </tr>
          <tr class="odd">
            <td><code>0</code></td>
            <td>Building or building part is on the ground.</td>
          </tr>
          <tr class="odd">
            <td><code>-1</code></td>
            <td>Building or building part is under ground</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h1
      id="faq"
      class="title is-3"
    >
      Frequently Asked Questions
    </h1>

    <h3 class="title is-5">
      Are there any known issues with the 3D BAG viewer?
    </h3>

    <p>
      Yes!
      <ol type="1">
        <li> Building picking does not work for multipart buildings. </li>
        <li> Memory usage can become high in some cases. On mobile devices this may cause a forced page reload. </li>
      </ol>
    </p>

    <h3 class="title is-5">
      Are there any known issues with the 3D BAG data?
    </h3>

    <p>
      Yes!
      <ol type="1">
        <li> Some buildings have a spike; a big deviation in the building geometry due to one vertex with an erroneous coordinate. </li>
        <li> Not all buildings are geometrically valid (eg. missing faces). Note that this should be evident from the <code>val3dity_codes</code> attribute. </li>
        <li> Some building tiles may be missing. </li>
        <li> Sometimes a building is not properly highlighted when you click on it. </li>
      </ol>
    </p>

    <h3 class="title is-5">
      Why is my house missing or outdated?
    </h3>
    <p class="content">
      Due to the AHN3 source point cloud that was used to generate the 3D BAG, in some places the elevation information may be up to 6 years old (2014). Buildings that were constructed more recently will not be visible in the 3D BAG. See also the <a href="https://www.ahn.nl/kwaliteitsbeschrijving">AHN website</a> (figure 1c).
    </p>

    <h3 class="title is-5">
      Who is in the 3D BAG development team?
    </h3>

    <p>The 3D BAG is developed by the 3D geoinformation research group. More specifically:</p>

    <ul>
      <li> Balázs Dukai does product management, takes care of the data processing, scalability, quality control and writes documentation. </li>
      <li> Ravi Peters develops the building reconstruction software, and works on the 3D viewer and this website in general.</li>
      <li> Stelios Vitalis works on this website and the 3D viewer.</li>
      <li> Jordi van Liempt is involved with the 3D viewer.</li>
      <li> Teng Wu worked on the identification of underground and floating buildings in the BAG. </li>
    </ul>

    <h3 class="title is-5">
      What software was used to generate and publish the 3D BAG?
    </h3>

    <p>We use our own <a href="https://github.com/geoflow3d">software</a> for building reconstruction. On the server side the dataset is stored in a PostgreSQL/PostGIS database. For the development of this <a href="https://github.com/tudelft3d/3dbag-viewer/">website</a> which includes a 3D viewer we use these open source software projects:</p>

    <ul>
      <li> <a href="https://github.com/NASA-AMMOS/3DTilesRendererJS">3DTilesRendererJS</a> by NASA AMMOS is used for displaying the buildings.</li>
      <li> <a href="https://github.com/Geodan/pg2b3dm/">pg2b3dm</a> by Geodan is used to export our data to 3D tiles.</li>
    </ul>

    <h3 class="title is-5">
      What is the relation to the 3D Basisvoorziening data of the Kadaster? Why is this
      3D BAG not on PDOK?
    </h3>
    <p>
      In some sense this data is on PDOK too, because we develop the tools and
      algorithms that the Kadaster uses for reconstructing the 3D models in the
      3D Basisvoorziening, and the same algorithms are used for creating this
      3D BAG too.
    </p>

    <p>
      However, we continuously improve and experiment with our methods and maintaining
      our own data and service allows us to integrate changes immediately and retain
      full control over the process. These experiments take some time until they are
      ironed out and find their way into the 3D Basisvoorziening, if at all.
    </p>

    <p>
      Additionally, for the 3D Basisvoorziening the Kadaster uses their own point
      cloud that is generated with dense image matching on the aerial images that they
      collect each year. However, this is not open data. Therefore we use the AHN for
      this 3D BAG.
    </p>

    <h3 class="title is-5">
      Who paid for this?
    </h3>
    <p>
      This project has received funding from the following organisations (in alphabetic order):
    </p>

    <ul>
      <li> Amsterdam Institute for Advanced Metropolitan Solutions (AMS) </li>
      <li>
        European Research Council (ERC) under
        the European Unions Horizon2020 Research & Innovation Programme
        (grant agreement no. 677312 UMnD: Urban modelling in higher dimensions).
      </li>
      <li> Kadaster </li>
      <li> Rijksinstituut voor Volksgezondheid en Milieu </li>
      <li> Rijkswaterstaat </li>
    </ul>

    <h1
      id="changelog"
      class="title is-3"
    >
      Changelog
    </h1>
    <h3
      id="v20110"
      class="title is-5"
    >
      v20.11.0
    </h3>
    <p>
      New features:
      <ol type="1">
        <li> New attributes relative data_area (<code>_data_coverage</code>) and absolute no-data area (<code>_nodata_area</code>) </li>
        <li> Improved loading of WMTS tiles in 3D viewer (<a href="https://github.com/tudelft3d/3dbag-viewer/issues/20">#20</a>) </li>
        <li> Internationalisation support for website (<a href="https://github.com/tudelft3d/3dbag-viewer/issues/36">#36</a>) </li>
        <li> Preserve location in 3D map when switching between website pages (<a href="https://github.com/tudelft3d/3dbag-viewer/issues/27">#27</a>) </li>
        <li> B3dm tiles are now pre-compressed (gzip) on the server side (<a href="https://github.com/tudelft3d/3dbag-viewer/issues/35">#35</a>) </li>
        <li> Report active tileset to data issue form </li>
      </ol>
      Fixed the following issues:
      <ol type="1">
        <li> Wrong face orientation (inverted normals) on LoD1.2 buildings. </li>
      </ol>
    </p>
  </section>
</template>

<style>
  .table-wrapper {
    overflow-x: auto;
  }
  figcaption {
    margin-bottom: 1.5rem;
  }
</style>
