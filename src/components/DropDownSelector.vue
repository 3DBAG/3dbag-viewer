<template>
  <div class="control">
    <b-dropdown
      aria-role="list"
      :value="value"
      :title="title"
      @input="$emit('input', $event)"
    >
      <button
        slot="trigger"
        class="button"
        :class="color"
        type="button"
      >
        <b-icon :icon="options[value].icon" />
        <span class="is-hidden-mobile">{{ title }}</span>
        <b-icon icon="menu-down" />
      </button>

      <b-dropdown-item
        v-for="(opt_info, opt_id) in options"
        :key="opt_id"
        :value="opt_id"
        aria-role="listitem"
      >
        <div class="media">
          <b-icon
            class="media-left"
            :icon="opt_info.icon"
          />
          <div class="media-content">
            <p>{{ opt_info.name }}</p>
          </div>
        </div>
      </b-dropdown-item>
    </b-dropdown>
  </div>
</template>

<script>
export default {

	name: 'DropDownSelector',

	props: {
		title: {
			type: String,
			default: "Title"
		},
		color: {
			type: String,
			default: "is-primary"
		},
		value: {
			type: String,
			default: "option1"
		},
		options: {
			type: Object,
			default() {

				return {
					option1: {
						name: "Option 1",
						icon: "map"
					}
				};

			}
		}
	}

};
</script>
