<template>
  <div class="control">
    <button
      class="button px-2"
      type="button"
      @click="showModal = true; $emit('get-colorpicker-data')"
    >
      <inline-svg
        id="compasscomp"
        type="image/svg+xml"
        :src="require('@/assets/logo.svg')"
        width="24"
        height="24"
      />
    </button>
    <div>
      <vue-final-modal
        v-model="showModal"
        classes="modal-container"
        content-class="modal-content"
        :drag="true"
        drag-selector=".modal__title"
        :hide-overlay="true"
        :click-to-close="false"
        :prevent-click="true"
      >
        <button
          class="modal__close"
          @click="showModal = false"
        >
          <mdi-close />
        </button>
        <span class="modal__title">Color by attribute</span>
        <p>Pick an <a href="https://docs.3dbag.nl/en/schema/attributes/">attribute</a> and <a href="https://matplotlib.org/stable/gallery/color/colormap_reference.html">colormap!</a></p>
        <p><small>(Note: not all attributes are available in the viewer)</small></p>
        <div class="modal__content">
          <div style="width: 50%; float:left">
            <span>Attribute: </span>
            <select v-model="attrSelected">
              <option
                v-for="(attr, key) in attributes"
                :key="key"
              >
                {{ key }}
              </option>
            </select>
            <span>Colormap: </span>
            <select v-model="cmSelected">
              <option
                v-for="(cm, index) in colormaps"
                :key="`cm-${index}`"
              >
                {{ cm }}
              </option>
            </select>
            <div v-if="attrType == `number`">
              <b-field label="Minimum value">
                <b-numberinput
                  v-model="minValSelected"
                  size="is-small"
                  step="0.1"
                  min-step="0.00001"
                  controls-alignment="right"
                  controls-position="compact"
                  controls-rounded
                />
              </b-field>
              <b-field label="Maximum value">
                <b-numberinput
                  v-model="maxValSelected"
                  size="is-small"
                  step="0.1"
                  min-step="0.00001"
                  controls-alignment="right"
                  controls-position="compact"
                  controls-rounded
                />
              </b-field>
            </div>
            <div v-else>
              <div class="block">
                <b-checkbox
                  v-for="(attr, key) in attrKeys"
                  :key="key"
                  v-model="valuesChecked"
                  :native-value="attr"
                >
                  {{ attr }}
                </b-checkbox>
              </div>
            </div>
          </div>
          <div style="width: 50%; float:right">
            <p>Type: {{ attrType }}</p>
            <div v-if="attrType == `number`">
              Minimum value: {{ minVal }}
              <br>
              Maximum value: {{ maxVal }}
            </div>
            <div v-else>
              Amount of values: {{ maxVal }}
              <br>
              Values: {{ attrKeys.join(', ') }}
            </div>
          </div>
        </div>
        <div class="modal__action">
          <b-button @click="colorByAttribute">
            Colour!
          </b-button>
          <b-button @click="getMinMax">
            Get min/max
          </b-button>
          <b-button @click="toggleColoring">
            Toggle
          </b-button>
          <b-field>
            <b-checkbox v-model="transparent">
              Transparent
            </b-checkbox>
          </b-field>
        </div>
      </vue-final-modal>
    </div>
  </div>
</template>

<script>
import { $vfm, VueFinalModal, ModalsContainer } from 'vue-final-modal';

export default {

	name: 'ColormapPicker',
	components: {

		VueFinalModal,
		// ModalsContainer

	},
	data: function () {

		return {

			showModal: false,
			attrSelected: null,
			attributes: [],
			colormaps: null,
			cmSelected: null,
			minVal: null,
			maxVal: null,
			minValSelected: null,
			maxValSelected: null,
			attrKeys: [],
			attrValues: {},
			valuesChecked: [],
			transparent: false

		};

	},
	computed: {

		attrType: function () {

			return this.attributes[ this.attrSelected ];

		}

	},
	mounted() {

		this.$root.$on( 'colorpickerData', data => {

			const colorAttrSettings = data[ 0 ];
			const attributes = data[ 1 ][ 'attributes' ];
			const cms = data[ 1 ][ 'colormaps' ];

			this.attrSelected = Object.keys( attributes )[ 0 ];
			this.attributes = attributes;
			this.colormaps = cms;
    	this.cmSelected = this.colormaps[ 0 ];
			this.minVal = colorAttrSettings[ 'minVal' ] != Number.MAX_VALUE ? String( colorAttrSettings[ 'minVal' ] ) : "";
			this.maxVal = colorAttrSettings[ 'maxVal' ] != - Number.MAX_VALUE ? String( colorAttrSettings[ 'maxVal' ] ) : "";

		} );

		this.$root.$on( 'minMaxData', data => {

			this.minVal = data[ 'minVal' ];
			this.maxVal = data[ 'maxVal' ];
			this.minValSelected = data[ 'minVal' ];
			this.maxValSelected = data[ 'maxVal' ];
			this.attrKeys = data[ 'keys' ];
			this.attrValues = data[ 'values' ];
			this.valuesChecked = data[ 'keys' ];

		} );

	},
	methods: {

		colorByAttribute() {

			if ( this.attrType == "number" && ( this.minValSelected == null || this.maxValSelected == null ) )
				return;

			var exclude = [];
			for ( let i = 0; i < this.attrKeys.length; i ++ )
				if ( ! this.valuesChecked.includes( this.attrKeys[ i ] ) )
					exclude.push( this.attrKeys[ i ] );

			const params = { "attrName": this.attrSelected, "attrType": this.attrType, "cmName": this.cmSelected, "minVal": this.minVal, "maxVal": this.maxVal, "minValSelected": this.minValSelected, "maxValSelected": this.maxValSelected, "attrValues": this.attrValues, "attrKeys": this.attrKeys, "exclude": exclude, "transparent": this.transparent };
			this.$emit( 'color-by-attribute', params );

		},

		getMinMax() {

			this.$emit( 'get-min-max', this.attrSelected );

		},

		toggleColoring() {

			this.$emit( 'toggle-coloring' );

		}

	}
};
</script>

<style scoped>
::v-deep .modal-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
::v-deep .modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  background: #fff;
}
.modal__title {
  margin: 0 2rem 0 0;
  font-size: 1.5rem;
  font-weight: 700;
}
.modal__close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}
</style>

<style scoped>
.dark-mode div::v-deep .modal-content {
  border-color: #2d3748;
  background-color: #1a202c;
}
</style>
