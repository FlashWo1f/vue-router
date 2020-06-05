import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  // 防止插件被多次安装 - 当 install 方法被同一个插件多次调用，插件将只会被安装一次。
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    // isDef(i = i.data) i.data是否!undefined 且 i.data 赋值给 i
    // registerRouteInstance => 注册route实例
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }
  // 全局注册一个混入，影响注册之后所有创建的每个 Vue 实例。
  Vue.mixin({
    /**
     * 混入 Vue 创建前钩子
     * 1.取传入 Vue 构造函数的路由配置参数并调用 init 方法。
     * 2.在 Vue 根实例添加 _router 属性（ VueRouter 实例）
     * 3.执行路由实例的 init 方法并传入 Vue 实例
     * 4.把 ($route <=> _route) 处理为响应式的。
     */
    beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        // this._router.history.current === $route
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // this.$parent && this.$parent._routerRoot 为 true 则把 this.$parent._routerRoot (根组件) 赋值过去   this => 根 Vue 实例
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })

  // 在 Vue 原型上添加 $router 属性( VueRouter )并代理到 this.$root._router
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  // 在 Vue 原型上添加 $route 属性( 当前路由对象 )并代理到 this.$root._route
  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })
  // 全局注册RouterL&V两个组件 => 接下来就是为 vue-router 装填配置并实例化。之后把实例化的结果传入 Vue（new VueRouter({})）
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
