<template>
  <div class="control">
    <button
      class="button px-2"
      type="button"
      @click="$emit('orient-north')"
    >
      <inline-svg
        id="compasscomp"
        type="image/svg+xml"
        :src="require('@/assets/compass.svg')"
        width="24"
        height="24"
      />
    </button>
  </div>
</template>

<script>
export default {

	name: 'Compass',

	methods: {
		setRotation: function ( value ) {

			let compasSVG = document.getElementById( "compasscomp" );

			if ( compasSVG ) {

			  compasSVG.style.transform = "rotate(" + value + "rad)";

			}

		}
	}
};
</script>
