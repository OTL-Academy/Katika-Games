<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
  <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
  <PlayScreen msg="Le jeu est en cours"/>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import PlayScreen from './components/PlayScreen.vue';

export default {
  name: 'App',
  components: {
    // HelloWorld,
    PlayScreen
  }
}
</script>

<style>
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}*/
</style> 
