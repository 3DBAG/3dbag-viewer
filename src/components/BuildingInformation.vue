<template>
  <div
    v-show="show"
    id="building-info"
    class="field has-addons"
    style="z-index:1"
  >
    <b-dropdown
      aria-role="list"
      :can-close="['escape']"
      :mobile-modal="false"
      class="control dropdown is-hoverable is-up"
    >
      <template #trigger="{ active }">
        <b-button
          aria-haspopup="true"
          type="is-warning"
          :icon-left="'table'"
          :icon-right="active ? 'menu-down' : 'menu-up'"
        >
          <span class="is-hidden-mobile">{{ $t("attributes") }}</span>
        </b-button>
      </template>

      <b-dropdown-item
        custom
        aria-role="listitem"
      >
        <table
          class="table is-fullwidth is-striped has-text-left"
          style="margin-bottom: 0.75rem"
        >
          <thead>
            <tr>
              <th>{{ $t("attribute") }}</th>
              <th>{{ $t("value") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ $t("tilenumber") }}</td>
              <td>
                <span>
                  <router-link
                    :to="{ path: 'download', query: { tid: building.tileID } }"
                    class="tag is-primary"
                    @click="showAbout=true"
                  >
                    <b-icon
                      class="mr-1"
                      size="is-small"
                      icon="download"
                    />
                    {{ building.tileID }}
                  </router-link>
                </span>
              </td>
            </tr>
            <tr
              v-for="name in attr_names"
              :key="name"
            >
              <td>{{ name }}</td>
              <td>
                <code style="color:inherit">{{ building.attributes[name] }}</code>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="mb-2">
          {{ $t("BuildingInfo.attr1") }} <a :href="'https://docs.3dbag.nl/'+$route.params.locale+'/schema/attributes/' ">{{ $t("documentation") }}</a>.
        </p>
        <p>
          <a
            class="tag is-danger"
            @click="$emit('report-data')"
          >{{ $t("viewer.issue") }}</a>
        </p>
      </b-dropdown-item>
    </b-dropdown>
    <div class="control">
      <b-button
        type="is-static"
        :icon-left="'arrow-expand-vertical'"
      >
        <b>{{ h_clicked }}</b> m
      </b-button>
    </div>
    <div class="control">
      <b-button
        type="is-static"
        :icon-left="'angle-acute'"
      >
        <b>{{ azimuthAngle }}</b> °
      </b-button>
    </div>
  </div>
</template>

<script>
export default {

	name: 'BuildingInformation',

	props: {
		show: {
			type: Boolean,
			default: false
		},
		building: {
			type: Object,
			default() {

				return {

					pz: 0,
					batchID: '-999'

				};

			}
		}
	},

	data: function () {

		return {
			attr_names: [ 'identificatie', 'h_maaiveld', 'h_dak_70p', 'dak_type', 'pw_bron', 'pw_datum', 'val3dity_codes' ],
			showAttributes: false
		};

	},

	computed: {

		h_clicked: function () {

			if ( this.building.pz ) return this.building.pz.toFixed( 1 );
			return null;

		},

		azimuthAngle: function () {

			if ( this.building.azimuthAngle !== undefined ) {

				return this.building.azimuthAngle.toFixed( 1 );

			}

			return '-';

		}

	},

	methods: {

		closeInfo() {

			this.$emit( 'close-info' );

		},

		// This is very slow (~9 sec for a response)
		// getFeatureURL( bagid ) {

		// 	let url = "https://data.3dbag.nl/api/BAG3D_v2/wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=BAG3D_v2:lod22&outputFormat=json&count=1&filter=";
		// 	let filter = "<Filter><PropertyIsEqualTo><PropertyName>identificatie</PropertyName><Literal>NL.IMBAG.Pand.0329100000002936</Literal></PropertyIsEqualTo></Filter>";
		// 	url = url + encodeURIComponent( filter );

		// 	fetch( url )
		// 		.then( response => response.json() )
		// 		.then( data => console.log( data ) );

		// }

	}
};
</script>
