<template>
  <div id="app">
    <div id="sidebar">
      <div>
        Error Target:
        <input type="number" name="" id="" v-model.number="errorTarget">
      </div>
      <div>
        Error Threshold:
        <input type="number" name="" id="" v-model.number="errorThreshold">
      </div>
    </div>
    <div id="viewer">
      <img id="logo" alt="Vue logo" src="http://3dbag.bk.tudelft.nl/static/img/logo-tud-3d-black.png">
      <ThreeViewer
        :error-target="errorTarget"
        :error-threshold="errorThreshold"
      />
    </div>
  </div>
</template>

<script>
import ThreeViewer from './components/ThreeViewer.vue'

export default {
  name: 'App',
  components: {
    ThreeViewer
  },
  data() {
    return {
      errorTarget: 50,
      errorThreshold: 60
    }
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
  display: flex;
}

#sidebar {
  width: 30%;
}

#viewer {
  width: 70%;
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
