import Vue from 'vue'
import App from './App.vue'
import VueGeolocation from 'vue-browser-geolocation'
import axios from 'axios'
import VueAxios from 'vue-axios'
import babelPolyfill from 'babel-polyfill'
import Moment from 'vue-moment'

Vue.use(Moment);
Vue.use(babelPolyfill)
Vue.use(VueGeolocation)
Vue.use(VueAxios, axios)


new Vue({
  el: '#app',
  render: h => h(App)
})
