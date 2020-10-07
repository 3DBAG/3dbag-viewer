import Vue from 'vue'
import Router from 'vue-router'
import ThreeViewer from '@/components/ThreeViewer'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ThreeViewer',
      component: ThreeViewer
    }
  ]
})