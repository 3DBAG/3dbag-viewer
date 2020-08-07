<template>
  <div id="app">
    <img id="logo" alt="Vue logo" src="http://3dbag.bk.tudelft.nl/static/img/logo-tud-3d-black.png">
    <ThreeViewer/>
  </div>
</template>

<script>
import ThreeViewer from './components/ThreeViewer.vue'

export default {
  name: 'App',
  components: {
    ThreeViewer
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  margin: 0px;
}

#logo {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 10%;
}

html, body {
  height: 100%;
  margin: 0px;
}
</style>
