<template>
  <section class="section content">
    <div
      id="dashboard"
      class="wrap-element"
    >
      <iframe
        class="wrapped-iframe"
        width="100%"
        :src="dashboardUrl"
        allowfullscreen
      />
    </div>
  </section>
</template>

<script>
import { appConfig } from '@/config';

export default {
	name: "DashboardView",
	data() {

		return { dashboardUrl: appConfig.dashboardUrl + '/dashboard' };

	},
};
</script>

<style>
      .wrap-element {
        position: relative;
        overflow: hidden;
        padding-top: 56.25%;
      }
      .wrapped-iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }
</style>
