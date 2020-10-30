<template>
  <section class="section">
    <h1
      id="introduction"
      class="title is-2"
    >
      Introduction
    </h1>

    <p class="content">
      This the best 3D BAG we ever made. Really.
    </p>

    <h1
      id="schema"
      class="title is-2"
    >
      3D BAG schema
    </h1>

    <p class="content">
      This part describes the 3D BAG schema and its implementation in PostgreSQL. This is
      the schema that we use internally for storing the 3D BAG and generating the various
      exports. The schema and attributes of the can be different to what is described in
      there and it depends on the actual file format of the export.
    </p>

    <p class="content">
      Attributes prefixed with an underscore <code>_</code> are internal and not meant
      to be part of any export.
    </p>


    <p class="content">
      The Entity-Relationship Diagram below gives an overview on the tables,
      attributes (fields) and their data types in PostgreSQL, and the relationship
      between the tables.
    </p>

    <figure>
      <img
        class="image"
        src="@/assets/postgres_schema.png"
        alt="postgres_schema"
      ><figcaption
        class="is-7 is-italic"
        aria-hidden="true"
      >
        postgres_schema
      </figcaption>
    </figure>
    <p class="content">
      The diagram below gives an overview on the geometry that is stored in each table.
    </p>
    <figure>
      <img
        class="image"
        src="@/assets/geometry_in_schema.jpg"
        alt="geometry_schema"
      ><figcaption
        class="is-7 is-italic"
        aria-hidden="true"
      >
        geometry_schema
      </figcaption>
    </figure>
    <h2
      id="attributes"
      class="subtitle is-3"
    >
      Attributes
    </h2>

    <h3
      id="lod12_2d"
      class="subtitle is-4 is-family-code"
    >
      lod12_2d
    </h3>
    <p class="content">
      The LoD1.2 model stored as a 2D polygon. The elevation of the detected LoD1.2 roof surface is stored as height attributes. Only the <em>above ground</em> part of the BAG footprint is included.
    </p>
    <table class="table is-striped">
      <colgroup>
        <col style="width: 2%">
        <col style="width: 9%">
        <col style="width: 16%">
        <col style="width: 71%">
      </colgroup>
      <thead>
        <tr class="header">
          <th style="text-align: right;" />
          <th style="text-align: left;">
            Attribute Name
          </th>
          <th style="text-align: left;">
            Data Type
          </th>
          <th style="text-align: left;">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd">
          <td style="text-align: right;">
            0
          </td>
          <td style="text-align: left;">
            fid
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;" />
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            1
          </td>
          <td style="text-align: left;">
            identificatie
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            The BAG <code>identificatie</code> attribute
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            2
          </td>
          <td style="text-align: left;">
            h_dak_min
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the minimum of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            3
          </td>
          <td style="text-align: left;">
            h_dak_50p
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the median of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            4
          </td>
          <td style="text-align: left;">
            h_dak_70p
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the 70th percentile of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            5
          </td>
          <td style="text-align: left;">
            h_dak_max
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the maximum of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            6
          </td>
          <td style="text-align: left;">
            ondergronds_type
          </td>
          <td style="text-align: left;">
            USER-DEFINED(ondergrondstype)
          </td>
          <td style="text-align: left;">
            Underground class of the building.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            7
          </td>
          <td style="text-align: left;">
            geometrie
          </td>
          <td style="text-align: left;">
            USER-DEFINED(geometry)
          </td>
          <td style="text-align: left;">
            The minimal geometric representation of the above ground boundary of a building viewed from the top.
          </td>
        </tr>
      </tbody>
    </table>
    <h3
      id="lod12_3d"
      class="subtitle is-4 is-family-code"
    >
      lod12_3d
    </h3>
    <p class="content">
      Part of the BAG building that is above ground, reconstructed in LoD1.2.
    </p>
    <table class="table is-striped">
      <colgroup>
        <col style="width: 0%">
        <col style="width: 4%">
        <col style="width: 6%">
        <col style="width: 88%">
      </colgroup>
      <thead>
        <tr class="header">
          <th style="text-align: right;" />
          <th style="text-align: left;">
            Attribute Name
          </th>
          <th style="text-align: left;">
            Data Type
          </th>
          <th style="text-align: left;">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd">
          <td style="text-align: right;">
            0
          </td>
          <td style="text-align: left;">
            fid
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;" />
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            1
          </td>
          <td style="text-align: left;">
            identificatie
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            The BAG <code>identificatie</code> attribute
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            2
          </td>
          <td style="text-align: left;">
            val3dity_codes
          </td>
          <td style="text-align: left;">
            ARRAY(_int2)
          </td>
          <td style="text-align: left;">
            Val3dity error codes for the 3D model. <code>Null</code> means valid geometry.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            3
          </td>
          <td style="text-align: left;">
            semantics_values
          </td>
          <td style="text-align: left;">
            ARRAY(_int2)
          </td>
          <td style="text-align: left;">
            Building surface semantics. This is an array of integers, where an integer refers to a surface type (0: <code>GroundSurface</code>, 1: <code>RoofSurface</code>, 2: <code>OuterWallSurface</code>, 3: <code>InnerWallSurface</code>). If a surface does not have a semantic value, NULL is used instead. Thus the length of the array equals the number of surfaces, and the order of values in the array corresponds to the order of surfaces.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            4
          </td>
          <td style="text-align: left;">
            geometrie
          </td>
          <td style="text-align: left;">
            USER-DEFINED(geometry)
          </td>
          <td style="text-align: left;">
            The geometric volume of the building, reconstructed in LoD1.2. The elevation of ground surface is set to the 5th percentile of the ground points found within a 4 meter radius of the building. The elevation of the top surface is set to the 70th percentile of the roof points found within the building.
          </td>
        </tr>
      </tbody>
    </table>
    <h3
      id="lod13_2d"
      class="subtitle is-4 is-family-code"
    >
      lod13_2d
    </h3>
    <p class="content">
      The LoD1.3 model stored as 2D polygons, where each polygon represents a roof part that is detected. The elevation of the detected roof part is stored as height attributes. Only the <em>above ground</em> part of the BAG footprint is included.
    </p>
    <table class="table is-striped">
      <colgroup>
        <col style="width: 2%">
        <col style="width: 9%">
        <col style="width: 16%">
        <col style="width: 71%">
      </colgroup>
      <thead>
        <tr class="header">
          <th style="text-align: right;" />
          <th style="text-align: left;">
            Attribute Name
          </th>
          <th style="text-align: left;">
            Data Type
          </th>
          <th style="text-align: left;">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd">
          <td style="text-align: right;">
            0
          </td>
          <td style="text-align: left;">
            fid
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;" />
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            1
          </td>
          <td style="text-align: left;">
            identificatie
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            The BAG <code>identificatie</code> attribute
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            2
          </td>
          <td style="text-align: left;">
            pand_deel_id
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Buildingpart ID. A building can have multiple parts when it was cut into parts because of underground parts.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            3
          </td>
          <td style="text-align: left;">
            dd_id
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Dak Deel ID. Roofpart ID.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            4
          </td>
          <td style="text-align: left;">
            h_dak_min
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the minimum of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            5
          </td>
          <td style="text-align: left;">
            h_dak_50p
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the median of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            6
          </td>
          <td style="text-align: left;">
            h_dak_70p
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the 70th percentile of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            7
          </td>
          <td style="text-align: left;">
            h_dak_max
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at rooflevel. Calculated as the maximum of all elevation points on the corresponding roofpart. Unit: metre
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            8
          </td>
          <td style="text-align: left;">
            ondergronds_type
          </td>
          <td style="text-align: left;">
            USER-DEFINED(ondergrondstype)
          </td>
          <td style="text-align: left;">
            Underground class of the building.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            9
          </td>
          <td style="text-align: left;">
            _data_coverage
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Portion of roofpart covered by point cloud (per roofparts). Unit: ratio in range 0-1.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            10
          </td>
          <td style="text-align: left;">
            lod
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            Level of Detail.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            11
          </td>
          <td style="text-align: left;">
            geometrie
          </td>
          <td style="text-align: left;">
            USER-DEFINED(geometry)
          </td>
          <td style="text-align: left;">
            A single roof part projected on the ground.
          </td>
        </tr>
      </tbody>
    </table>
    <h3
      id="lod13_3d"
      class="subtitle is-4 is-family-code"
    >
      lod13_3d
    </h3>
    <p class="content">
      Part of the BAG building that is above ground, reconstructed in LoD1.3.
    </p>
    <table class="table is-striped">
      <colgroup>
        <col style="width: 0%">
        <col style="width: 4%">
        <col style="width: 6%">
        <col style="width: 88%">
      </colgroup>
      <thead>
        <tr class="header">
          <th style="text-align: right;" />
          <th style="text-align: left;">
            Attribute Name
          </th>
          <th style="text-align: left;">
            Data Type
          </th>
          <th style="text-align: left;">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd">
          <td style="text-align: right;">
            0
          </td>
          <td style="text-align: left;">
            fid
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;" />
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            1
          </td>
          <td style="text-align: left;">
            identificatie
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            The BAG <code>identificatie</code> attribute
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            2
          </td>
          <td style="text-align: left;">
            val3dity_codes
          </td>
          <td style="text-align: left;">
            ARRAY(_int2)
          </td>
          <td style="text-align: left;">
            Val3dity error codes for the 3D model. <code>Null</code> means valid geometry.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            3
          </td>
          <td style="text-align: left;">
            semantics_values
          </td>
          <td style="text-align: left;">
            ARRAY(_int2)
          </td>
          <td style="text-align: left;">
            Building surface semantics. This is an array of integers, where an integer refers to a surface type (0: <code>GroundSurface</code>, 1: <code>RoofSurface</code>, 2: <code>OuterWallSurface</code>, 3: <code>InnerWallSurface</code>). If a surface does not have a semantic value, NULL is used instead. Thus the length of the array equals the number of surfaces, and the order of values in the array corresponds to the order of surfaces.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            4
          </td>
          <td style="text-align: left;">
            _pc2m_error_hist
          </td>
          <td style="text-align: left;">
            jsonb(jsonb)
          </td>
          <td style="text-align: left;">
            Histogram of errors measured from point cloud to mesh triangles.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            5
          </td>
          <td style="text-align: left;">
            _m2pc_error_hist
          </td>
          <td style="text-align: left;">
            jsonb(jsonb)
          </td>
          <td style="text-align: left;">
            Histogram of errors measured from mesh vertices to point cloud.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            6
          </td>
          <td style="text-align: left;">
            _m2pc_error_max
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Maximum errors from any mesh vertex to point cloud.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            7
          </td>
          <td style="text-align: left;">
            _rmse
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Root mean square error between the 3D model and input point cloud (only roof points).
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            8
          </td>
          <td style="text-align: left;">
            lod
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            Level of Detail.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            9
          </td>
          <td style="text-align: left;">
            geometrie
          </td>
          <td style="text-align: left;">
            USER-DEFINED(geometry)
          </td>
          <td style="text-align: left;">
            The geometric volume of the building, reconstructed in LoD1.3. The elevation of ground surface is set to the 5th percentile of the ground points found within a 4 meter radius of the building. The elevation of the top surface is set to the 70th percentile of the roof points found within the building.
          </td>
        </tr>
      </tbody>
    </table>
    <h3
      id="lod22_2d"
      class="subtitle is-4 is-family-code"
    >
      lod22_2d
    </h3>
    <p class="content">
      The LoD2.3 model stored as 2D polygons, where each polygon represents a roof part that is detected. Only the <em>above ground</em> part of the BAG footprint is included.
    </p>
    <table class="table is-striped">
      <colgroup>
        <col style="width: 2%">
        <col style="width: 13%">
        <col style="width: 18%">
        <col style="width: 65%">
      </colgroup>
      <thead>
        <tr class="header">
          <th style="text-align: right;" />
          <th style="text-align: left;">
            Attribute Name
          </th>
          <th style="text-align: left;">
            Data Type
          </th>
          <th style="text-align: left;">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd">
          <td style="text-align: right;">
            0
          </td>
          <td style="text-align: left;">
            fid
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;" />
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            1
          </td>
          <td style="text-align: left;">
            identificatie
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;" />
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            2
          </td>
          <td style="text-align: left;">
            pand_deel_id
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Buildingpart ID. A building can have multiple parts when it was cut into parts because of underground parts.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            3
          </td>
          <td style="text-align: left;">
            dd_id
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Dak Deel ID. Roof part ID.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            4
          </td>
          <td style="text-align: left;">
            oppervlakte
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Surface area of the roof part. Square meters.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            5
          </td>
          <td style="text-align: left;">
            bruikbare_oppervlakte
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Surface area of the roof part, excluding dormers, chimneys. Square meters.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            6
          </td>
          <td style="text-align: left;">
            hoek
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Roof part inclination from horizontal. Degrees.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            7
          </td>
          <td style="text-align: left;">
            h_dakvoet
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Estimated height of the eaves of the roof (NAP).
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            8
          </td>
          <td style="text-align: left;">
            ondergronds_type
          </td>
          <td style="text-align: left;">
            USER-DEFINED(ondergrondstype)
          </td>
          <td style="text-align: left;">
            Underground class of the building.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            9
          </td>
          <td style="text-align: left;">
            _data_coverage
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Portion of roofpart covered by point cloud (per roofparts). Unit: ratio in range 0-1.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            10
          </td>
          <td style="text-align: left;">
            lod
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            Level of Detail.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            11
          </td>
          <td style="text-align: left;">
            geometrie
          </td>
          <td style="text-align: left;">
            USER-DEFINED(geometry)
          </td>
          <td style="text-align: left;">
            A single roof part of the LoD2.2 model projected on the ground.
          </td>
        </tr>
      </tbody>
    </table>
    <h3
      id="lod22_3d"
      class="subtitle is-4 is-family-code"
    >
      lod22_3d
    </h3>
    <p class="content">
      Part of the BAG building that is above ground, reconstructed in LoD2.2.
    </p>
    <table class="table is-striped">
      <colgroup>
        <col style="width: 0%">
        <col style="width: 4%">
        <col style="width: 6%">
        <col style="width: 88%">
      </colgroup>
      <thead>
        <tr class="header">
          <th style="text-align: right;" />
          <th style="text-align: left;">
            Attribute Name
          </th>
          <th style="text-align: left;">
            Data Type
          </th>
          <th style="text-align: left;">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd">
          <td style="text-align: right;">
            0
          </td>
          <td style="text-align: left;">
            fid
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;" />
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            1
          </td>
          <td style="text-align: left;">
            identificatie
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            The BAG <code>identificatie</code> attribute
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            2
          </td>
          <td style="text-align: left;">
            semantics_values
          </td>
          <td style="text-align: left;">
            ARRAY(_int2)
          </td>
          <td style="text-align: left;">
            Building surface semantics. This is an array of integers, where an integer refers to a surface type (0: <code>GroundSurface</code>, 1: <code>RoofSurface</code>, 2: <code>OuterWallSurface</code>, 3: <code>InnerWallSurface</code>). If a surface does not have a semantic value, NULL is used instead. Thus the length of the array equals the number of surfaces, and the order of values in the array corresponds to the order of surfaces.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            3
          </td>
          <td style="text-align: left;">
            volume
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Building volume. Cubic meters.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            4
          </td>
          <td style="text-align: left;">
            val3dity_codes
          </td>
          <td style="text-align: left;">
            ARRAY(_int2)
          </td>
          <td style="text-align: left;">
            Val3dity error codes for the 3D model. <code>Null</code> means valid geometry.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            5
          </td>
          <td style="text-align: left;">
            _roofplane_cnt
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            Number of detected roof planes
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            6
          </td>
          <td style="text-align: left;">
            _roof_pt_cnt
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;">
            Total number of points in roof planes
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            7
          </td>
          <td style="text-align: left;">
            _wall_pt_cnt
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;">
            Total number of points in wall planes
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            8
          </td>
          <td style="text-align: left;">
            _usegmented_pt_cnt
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;">
            Number of unsegmented points
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            9
          </td>
          <td style="text-align: left;">
            _pc2m_error_hist
          </td>
          <td style="text-align: left;">
            jsonb(jsonb)
          </td>
          <td style="text-align: left;">
            Histogram of errors measured from point cloud to mesh triangles.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            10
          </td>
          <td style="text-align: left;">
            _m2pc_error_hist
          </td>
          <td style="text-align: left;">
            jsonb(jsonb)
          </td>
          <td style="text-align: left;">
            Histogram of errors measured from mesh vertices to point cloud.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            11
          </td>
          <td style="text-align: left;">
            _m2pc_error_max
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Maximum errors from any mesh vertex to point cloud.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            12
          </td>
          <td style="text-align: left;">
            _rmse
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Root mean square error between the 3D model and input point cloud (only roof points).
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            13
          </td>
          <td style="text-align: left;">
            lod
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            Level of Detail.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            14
          </td>
          <td style="text-align: left;">
            geometrie
          </td>
          <td style="text-align: left;">
            USER-DEFINED(geometry)
          </td>
          <td style="text-align: left;">
            The geometric volume of the building, reconstructed in LoD2.2. The elevation of ground surface is set to the 5th percentile of the ground points found within a 4 meter radius of the building.
          </td>
        </tr>
      </tbody>
    </table>
    <h3
      id="pand"
      class="subtitle is-4 is-family-code"
    >
      pand
    </h3>
    <p class="content">
      Stores the attributes of the <code>pand</code> object of the official BAG. Stores the attributes of the 3D BAG that relate to the whole building. Contains <em>all</em> the buildings from the official BAG, thus even those that we could not or did not reconstruct. The BAG building geometry is split into underground and above ground part where appropriate. The geometry of the BAG buildings that are not reconstructed is stored unmodified.
    </p>
    <table class="table is-striped">
      <colgroup>
        <col style="width: 1%">
        <col style="width: 7%">
        <col style="width: 9%">
        <col style="width: 82%">
      </colgroup>
      <thead>
        <tr class="header">
          <th style="text-align: right;" />
          <th style="text-align: left;">
            Attribute Name
          </th>
          <th style="text-align: left;">
            Data Type
          </th>
          <th style="text-align: left;">
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd">
          <td style="text-align: right;">
            0
          </td>
          <td style="text-align: left;">
            fid
          </td>
          <td style="text-align: left;">
            integer(int4)
          </td>
          <td style="text-align: left;">
            Feature ID.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            1
          </td>
          <td style="text-align: left;">
            identificatie
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            BAG: De unieke aanduiding van een pand.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            2
          </td>
          <td style="text-align: left;">
            oorspronkelijk_bouwjaar
          </td>
          <td style="text-align: left;">
            smallint(int2)
          </td>
          <td style="text-align: left;">
            BAG: De aanduiding van het jaar waarin een pand oorspronkelijk als bouwkundig gereed is of zal worden opgeleverd.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            3
          </td>
          <td style="text-align: left;">
            status
          </td>
          <td style="text-align: left;">
            USER-DEFINED(statuspand)
          </td>
          <td style="text-align: left;">
            BAG: De fase van de levenscyclus van een pand, waarin hetbetreffende pand zich bevindt.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            4
          </td>
          <td style="text-align: left;">
            geconstateerd
          </td>
          <td style="text-align: left;">
            USER-DEFINED(indicatie)
          </td>
          <td style="text-align: left;">
            BAG: Een aanduiding waarmee kan worden aangegeven dat een pand in de registratie is opgenomen als gevolg van een feitelijke constatering, zonder dat er op het moment van opname sprake was van een regulier brondocument voor deze opname.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            5
          </td>
          <td style="text-align: left;">
            documentdatum
          </td>
          <td style="text-align: left;">
            date(date)
          </td>
          <td style="text-align: left;">
            BAG: De datum waarop het brondocument is vastgesteld, opbasis waarvan een opname, mutatie of een verwijderingvan gegevens ten aanzien van een pand heeft plaatsgevonden.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            6
          </td>
          <td style="text-align: left;">
            documentnummer
          </td>
          <td style="text-align: left;">
            character varying(varchar)
          </td>
          <td style="text-align: left;">
            BAG: De unieke aanduiding van het brondocument op basiswaarvan een opname, mutatie of een verwijdering vangegevens ten aanzien van een pand heeft plaatsgevonden, binnen een gemeente.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            7
          </td>
          <td style="text-align: left;">
            h_maaiveld
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            NAP elevation at groundlevel. Calculated as the 5th percentile of the ground points found within a 4 meter radius of the building. Unit: metre
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            8
          </td>
          <td style="text-align: left;">
            dak_type
          </td>
          <td style="text-align: left;">
            USER-DEFINED(daktype)
          </td>
          <td style="text-align: left;">
            Roof type of the building.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            9
          </td>
          <td style="text-align: left;">
            pw_datum
          </td>
          <td style="text-align: left;">
            date(date)
          </td>
          <td style="text-align: left;">
            Acquisition date of the point cloud. In case of the AHN3, this is an assumed acquisition date, which is computed as 1st of December in the year <em>before</em> the officially reported acquisition year (inwijnjaar) of a particular AHN3 tile.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            10
          </td>
          <td style="text-align: left;">
            pw_actueel
          </td>
          <td style="text-align: left;">
            boolean(bool)
          </td>
          <td style="text-align: left;">
            Does the date of the point cloud match the bouwjaar of the building?
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            11
          </td>
          <td style="text-align: left;">
            pw_bron
          </td>
          <td style="text-align: left;">
            text(text)
          </td>
          <td style="text-align: left;">
            Source of the point cloud.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            12
          </td>
          <td style="text-align: left;">
            reconstructie_methode
          </td>
          <td style="text-align: left;">
            text(text)
          </td>
          <td style="text-align: left;">
            Reconstruction method of the building model
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            13
          </td>
          <td style="text-align: left;">
            kas_warenhuis
          </td>
          <td style="text-align: left;">
            boolean(bool)
          </td>
          <td style="text-align: left;">
            The building is greenhouse or warehouse (according to Top10NL).
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            14
          </td>
          <td style="text-align: left;">
            ondergronds_type
          </td>
          <td style="text-align: left;">
            USER-DEFINED(ondergrondstype)
          </td>
          <td style="text-align: left;">
            Underground class of the building.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            15
          </td>
          <td style="text-align: left;">
            kwaliteits_klasse
          </td>
          <td style="text-align: left;">
            USER-DEFINED(kwaliteitsklasse)
          </td>
          <td style="text-align: left;">
            Indication of the confidence that the reconstruction is realistic, compared to the real building.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            16
          </td>
          <td style="text-align: left;">
            _t_run
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Total reconstruction time in ms (for all LoDs).
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            17
          </td>
          <td style="text-align: left;">
            _data_area
          </td>
          <td style="text-align: left;">
            real(float4)
          </td>
          <td style="text-align: left;">
            Area in footprint that has a roofplane above it (<code>nodata area = total footprint area - data_area</code>). Unit: square meters.
          </td>
        </tr>
        <tr class="odd">
          <td style="text-align: right;">
            18
          </td>
          <td style="text-align: left;">
            _lod13_22_missing
          </td>
          <td style="text-align: left;">
            boolean(bool)
          </td>
          <td style="text-align: left;">
            Indicates whether the LoD1.3/LoD2.2 reconstruction was skipped for this feature (and also LoD1.2 reconstruction if <code>lod12_replace==false</code>). This can happen when there were points found for instance.
          </td>
        </tr>
        <tr class="even">
          <td style="text-align: right;">
            19
          </td>
          <td style="text-align: left;">
            geometrie
          </td>
          <td style="text-align: left;">
            USER-DEFINED(geometry)
          </td>
          <td style="text-align: left;">
            The minimal geometric representation of the boundary of a building viewed from the top. This geometry represents either the building part that is above ground, or that is underground. In case the building was not reconstructed, this is the same geometry as the geometry in the BAG.
          </td>
        </tr>
      </tbody>
    </table>


    <h1
      id="faq"
      class="title is-2"
    >
      Frequently Asked Questions
    </h1>

    <h3>This the place for some question</h3>

    <p class="content">
      And this is the place for explaining it.
    </p>
  </section>
</template>

<style>
  figcaption {
    margin-bottom: 1.5rem;
  }
</style>
