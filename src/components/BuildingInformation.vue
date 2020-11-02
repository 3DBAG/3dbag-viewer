<template>
  <article
    v-show="show"
    id="building-info"
    class="message is-warning is-small"
  >
    <div class="message-header">
      <p>Building Information</p>
      <button
        class="delete"
        aria-label="Close info"
        @click="$emit('close-info')"
      />
    </div>
    <div class="message-body">
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
