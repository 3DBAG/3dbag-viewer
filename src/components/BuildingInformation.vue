<template>
  <article
    v-show="show"
    id="building-info"
    class="message is-warning is-small"
  >
    <div class="message-header">
      <p>Building Information</p>
      <button
        class="mx-1 button is-danger is-small"
        @click="$emit('report-data')"
      >
        Report a problem
      </button>
      <button
        class="delete"
        aria-label="Close info"
        @click="$emit('close-info')"
      />
    </div>
    <div v-if="show" class="message-body">
      <p class="content">
        You clicked on this building <b>{{ building.pz.toFixed(1) }} meters</b> above the ground.
      </p>
      <table class="table has-text-left">
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tile ID</td>
            <td>
              <router-link :to="{ path: 'download', query: { tid: building.tileID } }">
                {{ building.tileID }}
              </router-link>
            </td>
          </tr>
          <tr
            v-for="[name, val] in Object.entries(building.attributes)"
            :key="name"
          >
            <td>{{ name }}</td>
            <td class="table-value">
              {{ val }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>
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

					batchID: '-999'

				};

			}
		}
	},

	methods: {

		closeInfo() {

			this.$emit( 'close-info' );

		}

	}
};
</script>
