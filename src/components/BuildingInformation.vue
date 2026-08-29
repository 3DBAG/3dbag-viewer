<template>
  <div
    v-show="show"
    id="building-info"
    class="field has-addons"
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
        <div
          class="table-container"
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
              <tr v-if="building.tileID">
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
                v-for="name in attrNames"
                :key="name"
              >
                <td>
                  <a
                    v-if="documentationEnabled"
                    target="_blank"
                    :href="config.docsUrl + '/' + $route.params.locale + '/schema/attributes/#' + name"
                  >{{ name }}</a>
                  <span v-else>{{ name }}</span>
                </td>
                <td>
                  <code style="color:inherit">{{ building.attributes[name] }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-if="documentationEnabled"
          class="mb-2"
        >
          {{ $t("BuildingInfo.attr1") }} <a :href="config.docsUrl + '/' + $route.params.locale + '/schema/attributes/' ">{{ $t("documentation") }}</a>.
        </p>
        <p v-if="feedbackEnabled">
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
        :title="heightTitle"
      >
        <b>{{ h_clicked }}</b> m
        <span
          v-if="building.heightReference !== 'OBJECT_MIN_VERTEX'"
          class="is-hidden-mobile"
        >({{ $t('BuildingInfo.ellipsoid') }})</span>
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
import { appConfig } from '@/config';

export default {

	name: 'BuildingInformation',

	props: {
		documentationEnabled: {
			type: Boolean,
			default: true
		},
		feedbackEnabled: {
			type: Boolean,
			default: true
		},
		visibleAttributes: {
			type: Array,
			default: null
		},
		show: {
			type: Boolean,
			default: false
		},
		building: {
			type: Object,
			default() {

				return {

					height: 0,
					heightReference: 'WGS84_ELLIPSOID',
					featureId: null

				};

			}
		}
	},

	data() {

		return {
			config: appConfig,
			showAttributes: false
		};

	},

	computed: {
		attrNames() {

			const attributes = this.building && this.building.attributes || {};
			const names = Object.keys( attributes );
			if ( this.visibleAttributes === null ) return names;
			return this.visibleAttributes.filter( name => Object.prototype.hasOwnProperty.call( attributes, name ) );

		},

		h_clicked: function () {

			const height = this.building.height === undefined ? this.building.pz : this.building.height;
			if ( Number.isFinite( height ) ) return height.toFixed( 1 );
			return null;

		},

		azimuthAngle: function () {

			if ( this.building.azimuthAngle !== undefined ) {

				return this.building.azimuthAngle.toFixed( 1 );

			}

			return '-';

		},

		heightTitle: function () {

			return this.building.heightReference === 'OBJECT_MIN_VERTEX' ?
				this.$t( 'BuildingInfo.objectHeight' ) : this.$t( 'BuildingInfo.ellipsoidalHeight' );

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

<style>
#building-info .table-container {
	max-height: 350px;
	overflow: auto;
}

@media screen and (max-width: 768px) {
	#building-info .dropdown-menu {
		width: calc(100vw - 1rem);
		max-width: calc(100vw - 1rem);
	}

	#building-info .dropdown-content,
	#building-info .dropdown-item,
	#building-info .table-container {
		max-width: 100%;
	}

	#building-info table {
		width: 100%;
		table-layout: fixed;
	}

	#building-info th:first-child {
		width: 42%;
	}

	#building-info td {
		overflow-wrap: anywhere;
		word-break: break-word;
	}
}
</style>
