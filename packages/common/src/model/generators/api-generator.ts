import { Repository } from "typeorm";
import { RouteOptions } from "fastify";
import { App } from "@ezbackend/core"
import { getCreateSchema, getFullSchema, getUpdateSchema } from "../typeorm-json-schema";
import { getDefaultGenerators, GenerateOpts } from "./default-generators"
import { kApp } from "@ezbackend/core"


interface IAPIGeneratorOpts {
    prefix: string;
}

type IGenerator = (repo: Repository<unknown>, opts?: GenerateOpts) => RouteOptions | Array<RouteOptions>;

//Kudos to fastify team for this function, that will be hippity hoppity copied
export function buildRoutePrefix(instancePrefix: string, pluginPrefix: string) {
    if (!pluginPrefix) {
        return instancePrefix
    }

    // Ensure that there is a '/' between the prefixes
    if (instancePrefix.endsWith('/') && pluginPrefix[0] === '/') {
        // Remove the extra '/' to avoid: '/first//second'
        pluginPrefix = pluginPrefix.slice(1)
    } else if (pluginPrefix[0] !== '/') {
        pluginPrefix = '/' + pluginPrefix
    }

    return instancePrefix + pluginPrefix
}

export function getRoutePrefix(prefixes: Array<string>) {
    return prefixes.reduceRight(buildRoutePrefix)
}

//TODO: Custom routes involving apps?
export function generateRouteFactory(genOpts, generator) {
    return async (instance, opts) => {
        const meta = instance[kApp].getChainedMeta()
        const prefix = meta.prefix ? getRoutePrefix(meta.prefix) : ''
        instance.server.register(
            async (server, opts) => {
                const routes: Array<RouteOptions> = [].concat(generator(instance.repo, genOpts))
                routes.forEach((route) => {
                    server.route(route)
                })
            },
            {
                prefix: prefix
            }
        )
    }
}

//TODO: Think about function naming
//TODO: Figure out what the heck this genOpts done and if its useless remove it
export class EzRouter extends App {
    constructor(opts: IAPIGeneratorOpts, generators = getDefaultGenerators()) {
        super()
        const genOpts = opts

        this.setPreHandler(`Add Create Schema`, async (instance, opts) => {
            const schema = getCreateSchema(instance.repo.metadata)
            instance.server.addSchema(schema)
        })

        this.setPreHandler(`Add Update Schema`, async (instance, opts) => {
            const schema = getUpdateSchema(instance.repo.metadata)
            instance.server.addSchema(schema)
        })

        this.setPreHandler(`Add Full Schema`, async (instance, opts) => {
            const schema = getFullSchema(instance.repo.metadata)
            instance.server.addSchema(schema)
        })

        Object.entries(generators).forEach(([generatorName, generator]) => {
            this.setHandler(
                `Generate ${generatorName} route`,
                //TODO: Figure why it is grayed out
                generateRouteFactory(genOpts, generator))
        });

    }
}