import {
    kApp,
    kInstance,
    kScope,
} from './symbols'
import avvio, { Avvio, mixedInstance, Plugin } from 'avvio'

export type Meta = { [key: string]: any }
export type Override = Avvio<AppInstance>['override']
export type PluginType = Plugin<unknown, AppInstance>
export type Lifecycle =
    '_preInit' |
    '_init' |
    '_postInit' |
    '_preHandler' |
    '_handler' |
    '_postHandler' |
    '_preRun' |
    '_run' |
    '_postRun'

export enum PluginScope {
    PARENT,
    DEFAULT
}

export const LIFECYCLE: Array<Lifecycle> = [
    '_preInit',
    '_init',
    '_postInit',
    '_preHandler',
    '_handler',
    '_postHandler',
    '_preRun',
    '_run',
    '_postRun'
]

export class AppInstance {
    [kApp]: App
}

//URGENT TODO: Add types
//TODO: Added safety for overriding instance variables?
export class App {
    protected _meta: Meta
    protected _parent: App | undefined
    protected _apps: Map<string, App>
    protected _preInit: Map<string, Plugin<any, any>>
    protected _init: Map<string, Plugin<any, any>>
    protected _postInit: Map<string, Plugin<any, any>>
    protected _preHandler: Map<string, Plugin<any, any>>
    protected _handler: Map<string, Plugin<any, any>>
    protected _postHandler: Map<string, Plugin<any, any>>
    protected _preRun: Map<string, Plugin<any, any>>
    protected _run: Map<string, Plugin<any, any>>
    protected _postRun: Map<string, Plugin<any, any>>
    protected _instance: Avvio<AppInstance>
    protected _name: string
    protected _scope: PluginScope

    //TODO: Add tests for localdata
    //TOOD: Add test for obtaining parent
    //TODO: Replace errors with better errors

    constructor() {
        this._apps = new Map()
        this._preInit = new Map()
        this._init = new Map()
        this._postInit = new Map()
        this._preHandler = new Map()
        this._handler = new Map()
        this._postHandler = new Map()
        this._preRun = new Map()
        this._run = new Map()
        this._postRun = new Map()
        this._instance = avvio(new AppInstance(), { autostart: false })
        this._name = 'Root'
        this._scope = PluginScope.DEFAULT
        this._meta = {}
    }

    get apps() { return this._apps }
    get init() { return this._init }
    get handler() { return this._handler }
    get run() { return this._run }
    get instance() { return this._instance }
    get name() { return this._name }
    get scope() { return this._scope }
    get parent() { return this._parent }

    get meta() { return this._meta }

    set meta(newMeta: Meta) {
        this._meta = newMeta
    } 

    set name(newName: string) {
        //Should we prevent setting the name more than once?
        this._name = newName
    }

    set scope(newScope: PluginScope) {
        this._scope = newScope
    }

    setPreInit(funcName: string, plugin: Plugin<any, any>) { this.setHook('_preInit', funcName, plugin) }
    setInit(funcName: string, plugin: Plugin<any, any>) { this.setHook('_init', funcName, plugin) }
    setPostInit(funcName: string, plugin: Plugin<any, any>) { this.setHook('_postInit', funcName, plugin) }
    setPreHandler(funcName: string, plugin: Plugin<any, any>) { this.setHook('_preHandler', funcName, plugin) }
    setHandler(funcName: string, plugin: Plugin<any, any>) { this.setHook('_handler', funcName, plugin) }
    setPostHandler(funcName: string, plugin: Plugin<any, any>) { this.setHook('_postHandler', funcName, plugin) }
    setPreRun(funcName: string, plugin: Plugin<any, any>) { this.setHook('_preRun', funcName, plugin) }
    setRun(funcName: string, plugin: Plugin<any, any>) { this.setHook('_run', funcName, plugin) }
    setPostRun(funcName: string, plugin: Plugin<any, any>) { this.setHook('_postRun', funcName, plugin) }


    removeHook(lifecycle: Lifecycle, funcName: string) {
        if (!this[lifecycle].has(funcName)) {
            throw `${funcName} does not exist in ${lifecycle}`
        }
        //Override the plugin name
        this[lifecycle].delete(funcName)

    }

    setHook(lifecycle: Lifecycle, funcName: string, plugin: Plugin<any, any>) {
        if (this[lifecycle].has(funcName)) {
            throw `${funcName} already declared for ${lifecycle}`
        }
        //Override the plugin name
        Object.defineProperty(plugin, 'name', { value: funcName })
        this[lifecycle].set(funcName, plugin)

    }

    _setParent(app: App) {
        if (this._parent === undefined) {
            this._parent = app
        } else {
            throw `App's parent has already been set, parents can only be set once`
        }
    }

    //TODO: Dynamic programming for caching previously obtained metadata
    //TODO: Make sure you only call this after start, otherwise metadata may not be fully populated
    getChainedMeta(curMeta = {}) {
        Object.entries(this.meta).forEach(([key,value]) => {
            if (curMeta[key] === undefined) {
                curMeta[key] = [value]
            } else {
                curMeta[key].push(value)
            }
        })
        if (!this.parent) {
            //Recursive end condition
            return curMeta
        } else {
            return this.parent.getChainedMeta(curMeta)
        }
    }

    addApp(name: string, newApp: App, metaData: Meta = {}, scope: PluginScope = PluginScope.DEFAULT) {
        if (name in this._apps || Object.values(this._apps).indexOf(newApp) !== -1) {
            throw (`Child app ${name} already exists`)
        }
        newApp.scope = scope
        newApp.name = name
        newApp.meta = metaData
        newApp._setParent(this)
        this._apps.set(name, newApp)
        
    }

    getHookPlugin(lifecycle: Lifecycle): undefined | PluginType {

        //URGENT TODO: Plugin edge test case where child has hook but parent does not
        const childPlugins = Array.from(this.apps.values()).reduce((previousPlugins, app) => {
            const childPlugin = app.getHookPlugin(lifecycle)
            if (childPlugin) {
                previousPlugins.push(childPlugin)
            }
            return previousPlugins
        }, [])

        if (this[lifecycle].size === 0 && childPlugins.length === 0) {
            return undefined
        }

        const appFunc: PluginType = async (instance, opts) => {
            this[lifecycle].forEach(async pluginFunc => {
                //Make sure plugins run on the parent scope
                pluginFunc.prototype[kScope] = PluginScope.PARENT
                //TODO: Test case/throw error to ensure that kApp is set for ALL plugins
                pluginFunc.prototype[kApp] = this
                instance.use(pluginFunc, opts)
            })
            childPlugins.forEach(childPlugin => {
                instance.use(childPlugin, opts)
            })
        }

        appFunc.prototype[kApp] = this
        appFunc.prototype[kScope] = this.scope
        //Override the encapsulating function's name
        Object.defineProperty(appFunc, 'name', { value: this.name })

        return appFunc
    }

    async start(opts?: any) {
        if (this._instance.started) {
            throw `App has been started already!`
        }
        //Configure encapsulation
        this._instance.override = this.override
        //Recursively load plugins
        LIFECYCLE.forEach(lifecycle => {
            const lifecyclePlugin = this.getHookPlugin(lifecycle)
            if (lifecyclePlugin) {
                Object.defineProperty(lifecyclePlugin, 'name', { value: lifecycle })
                this._instance.use(lifecyclePlugin, opts)
            }
        })
        //Start the instance
        this._instance.start()
        await this._instance.ready()
    }

    protected override: Override = (old, fn, opts) => {
        let newInstance: mixedInstance<AppInstance>
        const parentApp = fn.prototype[kApp] ?? this
        //Check plugin scope
        if (fn.prototype[kScope] === PluginScope.DEFAULT) {
            //Uses new scope
            if (parentApp[kInstance] === undefined) {
                parentApp[kInstance] = Object.create(old)
            }
            newInstance = parentApp[kInstance]
        } else if (fn.prototype[kScope] === PluginScope.PARENT) {
            //Uses old scope
            newInstance = old
        } else {
            throw `Function scope is not defined for ${fn}`
        }
        newInstance[kApp] = parentApp
        return newInstance
    }
}