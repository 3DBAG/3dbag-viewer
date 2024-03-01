<template>
  <section class="section content">
    <div
      id="dashboard"
      class="wrap-element"
    >
      <iframe
        class="wrapped-iframe"
        width="100%"
        src="http://localhost:5000/dashboard"
        allowfullscreen
      />
    </div>
  </section>
</template>

<script>
export default {
	// https://stackoverflow.com/a/52635578

	name: "DashboardView",

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
