<template>
  <b-message
    id="picking-msg"
    v-model="show"
    type="is-warning"
    size="is-small"
    title="Building information"
    aria-close-label="Close message"
  >
    <table class="table has-text-left">
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Batch ID</td>
          <td>{{ building.batchID }}</td>
        </tr>
        <tr
          v-for="[name, val] in Object.entries(building.attributes)"
          :key="name"
        >
          <td>{{ name }}</td>
          <td>{{ val }}</td>
        </tr>
      </tbody>
    </table>
  </b-message>
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
};
</script>
