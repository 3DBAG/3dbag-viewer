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
      Netherlands in multiple dimensions.
    </p>

    <h2
      id="news"
      class="subtitle is-3"
    >
      Main features
    </h2>

    <p>Below are some of the highlights of this data set.</p>

    <h3>Data</h3>
    <ul>
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
      <li>
        Three levels of detail. We added LoD1.3 and LoD2.2 to the previously
        available LoD1.2 models.
      </li>
      <li>
        2D and 3D. Both 2D roofsurface polygons and full 3D models are available
        in all levels of detail.
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

    <table class="tg">
      <thead>
        <tr>
          <th class="tg-0pky" />
          <th class="tg-0pky">
            Attribute name
          </th>
          <th class="tg-0pky">
            Unit
          </th>
          <th class="tg-0pky">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="tg-0pky">
            0
          </td>
          <td class="tg-0pky">
            fid
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Feature ID
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            1
          </td>
          <td class="tg-0pky">
            identificatie
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            BAG: De unieke aanduiding van een pand.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            2
          </td>
          <td class="tg-0pky">
            _rmse
          </td>
          <td class="tg-0pky">
            meters
          </td>
          <td class="tg-0pky">
            Root mean square error between the 3D model and input point cloud (only roof points).
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            3
          </td>
          <td class="tg-0pky">
            _m2pc_error_max
          </td>
          <td class="tg-0pky">
            meters
          </td>
          <td class="tg-0pky">
            Maximum errors from any mesh vertex to point cloud.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            4
          </td>
          <td class="tg-0pky">
            val3dity_codes
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Val3dity error codes for the 3D model. `Null` means valid geometry.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            5
          </td>
          <td class="tg-0pky">
            _roof_pt_cnt
          </td>
          <td class="tg-0pky">
            count
          </td>
          <td class="tg-0pky">
            Total number of points in roof planes
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            6
          </td>
          <td class="tg-0pky">
            _wall_pt_cnt
          </td>
          <td class="tg-0pky">
            count
          </td>
          <td class="tg-0pky">
            Total number of points in wall planes
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            7
          </td>
          <td class="tg-0pky">
            _unsegmented_pt_cnt
          </td>
          <td class="tg-0pky">
            count
          </td>
          <td class="tg-0pky">
            Number of unsegmented points
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            8
          </td>
          <td class="tg-0pky">
            lod
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Level of Detail.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            9
          </td>
          <td class="tg-0pky">
            _t_run
          </td>
          <td class="tg-0pky">
            milliseconds
          </td>
          <td class="tg-0pky">
            Total reconstruction time in ms (for all LoDs).
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            10
          </td>
          <td class="tg-0pky">
            _data_area
          </td>
          <td class="tg-0pky">
            square meters
          </td>
          <td class="tg-0pky">
            Area in footprint that has a roofplane above it (`nodata area = total footprint area - data_area`). Unit: square meters.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            11
          </td>
          <td class="tg-0pky">
            _lod13_22_missing
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Indicates whether the LoD1.3/LoD2.2 reconstruction was skipped for this feature (and also LoD1.2 reconstruction if `lod12_replace==false`). This can happen when there were points found for instance.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            12
          </td>
          <td class="tg-0pky">
            h_maaiveld
          </td>
          <td class="tg-0pky">
            meters
          </td>
          <td class="tg-0pky">
            NAP elevation at groundlevel. Calculated as the 5th percentile of the ground points found within a 4 meter radius of the building. Unit: metre
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            13
          </td>
          <td class="tg-0pky">
            pw_datum
          </td>
          <td class="tg-0pky">
            YYYY-MM-DD
          </td>
          <td class="tg-0pky">
            Acquisition date of the point cloud. In case of the AHN3, this is an assumed acquisition date, which is computed as 1st of December in the year *before* the officially reported acquisition year (inwijnjaar) of a particular AHN3 tile.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            14
          </td>
          <td class="tg-0pky">
            pw_actueel
          </td>
          <td class="tg-0pky">
            true/false
          </td>
          <td class="tg-0pky">
            Does the date of the point cloud match the bouwjaar of the building?
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            15
          </td>
          <td class="tg-0pky">
            pw_bron
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Source of the point cloud.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            16
          </td>
          <td class="tg-0pky">
            reconstructie_methode
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Reconstruction method of the building model
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            17
          </td>
          <td class="tg-0pky">
            versie_methode
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Version of the building reconstruction method.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            18
          </td>
          <td class="tg-0pky">
            kas_warenhuis
          </td>
          <td class="tg-0pky">
            true/false
          </td>
          <td class="tg-0pky">
            The building is greenhouse or warehouse (according to Top10NL).
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            19
          </td>
          <td class="tg-0pky">
            dak_type
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Roof type of the building.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            20
          </td>
          <td class="tg-0pky">
            ondergronds_type
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Underground class of the building.
          </td>
        </tr>
        <tr>
          <td class="tg-0pky">
            21
          </td>
          <td class="tg-0pky">
            kwaliteits_klasse
          </td>
          <td class="tg-0pky">
            –
          </td>
          <td class="tg-0pky">
            Indication of the confidence that the reconstruction is realistic, compared to the real building.
          </td>
        </tr>
      </tbody>
    </table>


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
        <li> Wrong face orientation (inverted normals) on LoD1.2 buildings. To verify the LoD of a building check the <code>lod</code> attribute (also the non-LoD1.2 layers have some LoD1.2 buildings). </li>
        <li> Some buildings have spikes (due to lack of data or problem in triangulation). </li>
        <li> Not all buildings are geometrically valid (missing faces). Note that this should be evident from the <code>val3dity_codes</code> attribute. </li>
        <li> Some building tiles may be missing. </li>
      </ol>
    </p>

    <h3 class="title is-5">
      Some buildings are missing or outdated!
    </h3>
    <p>
      Due to the AHN3 source point cloud that was used to generate the 3D BAG, in some places the elevation information may be up to 6 years old (2014). Buildings that were constructed more recently will not be visible in the 3D BAG.
    </p>

    <h3 class="title is-5">
      Who is in the 3D BAG development team?
    </h3>
    <ul>
      <li> Balazs Dukai (data management, documentation) </li>
      <li> Ravi Peters (data generation, viewer) </li>
      <li> Stelios Vitalis (viewer) </li>
      <li> Jordi Liempt (viewer) </li>
    </ul>
  </section>
</template>

<style>
  figcaption {
    margin-bottom: 1.5rem;
  }

  .tg {
    border-collapse:collapse;border-spacing:0;
  }

  .tg td{
    border-color: black;
    border-style: solid;
    border-width: 1px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    overflow: hidden;
    padding: 10px 5px;
    word-break: normal;
  }

  .tg th{
		border-color: black;
		border-style: solid;
		border-width: 1px;
		font-family: Arial, sans-serif;
		font-size: 14px;
    font-weight: normal;
		overflow: hidden;
		padding: 10px 5px;
		word-break: normal;
	}

  .tg .tg-0pky{
		border-color: inherit;
		text-align: left;
		vertical-align: top
	}
</style>
