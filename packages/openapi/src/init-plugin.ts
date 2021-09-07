import { EzBackend, IEzbConfig } from '@ezbackend/core'
import fastifySwagger from "fastify-swagger"
import { APIGenerator, getPrimaryColName } from "@ezbackend/common";
import { RouteOptions } from 'fastify';
import chalk from 'chalk'


export default function init(config) {
    setGeneratorRouteMetadata()
    
    const ezb = EzBackend.app();

    ezb.openapi = {
        config: {
            prefix: "/docs",
            routePrefix: "/docs",
            exposeRoute: true,
            //TODO: Figure out why its logging so much
            logLevel: 'warn',
            openapi: {
                info: {
                    title: "EzBackend API",
                    description: "Automatically generated documentation for EzBackend",
                    version: "1.0.0",
                },
                externalDocs: {
                    url: "https://github.com/kapydev/ezbackend",
                    description: "Find more info here",
                }
            },

        }
    }

    //TODO: Figure out how to make this automatically generate
    // components: {
    //   securitySchemes: {
    //     OAuth2: {
    //       type: "oauth2",
    //       description: "## ⚠️Do not fill client id, just click __'Authorize'__ [(explanation)](http://google.com)",
    //       flows:
    //       {
    //         implicit: {
    //           authorizationUrl: 'http://localhost:8888/User/auth/google/login',
    //           scopes: {
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
    //   },
    // }

    //Configure defaults
    ezb.plugins.postInit.push((ezb, opts, cb) => {
        ezb.server.register(fastifySwagger, ezb.openapi.config);
        cb()
    });

    //TODO: Make page when user reopens swagger
    ezb.plugins.postRun.push((ezb, opts: IEzbConfig, cb) => {
        // ezb.server.swagger();
        if (opts.port) {
            console.log(chalk.greenBright(`\nView your auto-generated Documentation at `) + chalk.yellow.underline(`http://localhost:${opts.port}/docs\n`))
        }
        cb()
    })
}

function setGeneratorRouteMetadata() {
    const originalGenerators = APIGenerator.getGenerators()

    if (originalGenerators['createOne'] !== undefined) {
        const oldGenerator = originalGenerators['createOne']
        APIGenerator.setGenerator("createOne", (repo,opts) => {
            //TODO: throw an error if aray is provided, remove the 'as'
            const routeDetails = oldGenerator(repo,opts) as RouteOptions
            const generatedCols = repo.metadata.columns.filter(col => col.isGenerated).map(col => col.propertyName)
            return {
                ...routeDetails,
                schema: {
                    ...routeDetails.schema,
                    summary: `Create ${repo.metadata.name}`,
                    tags: [repo.metadata.name],
                    description: `During creation, you are not allowed to specify the values of generated columns (e.g. ${generatedCols.toString()}).
        All non nullable columns must be specified on creation`
                }
            }
        });
    }

    if (originalGenerators['getOne'] !== undefined) {
        const oldGenerator = originalGenerators['getOne']
        APIGenerator.setGenerator("getOne", (repo,opts) => {
            const primaryColName = getPrimaryColName(repo.metadata)
            //TODO: throw an error if aray is provided, remove the 'as'
            const routeDetails = oldGenerator(repo,opts) as RouteOptions
            return {
                ...routeDetails,
                schema: {
                    ...routeDetails.schema,
                    summary: `Get ${repo.metadata.name} by ${primaryColName}`,
                    tags: [repo.metadata.name],
                    description: `If the ${primaryColName} does not contain the value specified in the url paramters, there will be a 'not found' error.`
                }
            }
        });
    }

    if (originalGenerators['getAll'] !== undefined) {
        const oldGenerator = originalGenerators['getAll']
        APIGenerator.setGenerator("getAll", (repo,opts) => {
            //TODO: throw an error if aray is provided, remove the 'as'
            const routeDetails = oldGenerator(repo,opts) as RouteOptions
            return {
                ...routeDetails,
                schema: {
                    ...routeDetails.schema,
                    summary: `Get all ${repo.metadata.name} instances`,
                    tags: [repo.metadata.name],
                    description: `If none exist, an empty array is returned`
                }
            }
        });
    }


    if (originalGenerators['updateOne'] !== undefined) {
        const oldGenerator = originalGenerators['updateOne']
        APIGenerator.setGenerator("updateOne", (repo,opts) => {
            const primaryColName = getPrimaryColName(repo.metadata)
            //TODO: throw an error if aray is provided, remove the 'as'
            const routeDetails = oldGenerator(repo,opts) as RouteOptions
            const generatedCols = repo.metadata.columns.filter(col => col.isGenerated).map(col => col.propertyName)
            return {
                ...routeDetails,
                schema: {
                    ...routeDetails.schema,
                    summary: `Update ${repo.metadata.name} by ${primaryColName}`,
                    tags: [repo.metadata.name],
                    description: `The ${repo.metadata.name} with the ${primaryColName} specified must exist, otherwise a 'not found' error is returned
        During creation, you are not allowed to specify the values of generated columns (e.g. ${generatedCols.toString()})`
                }
            }
        });
    }

    if (originalGenerators['deleteOne'] !== undefined) {
        const oldGenerator = originalGenerators['deleteOne']
        APIGenerator.setGenerator("deleteOne", (repo,opts) => {
            const primaryColName = getPrimaryColName(repo.metadata)
            //TODO: throw an error if aray is provided, remove the 'as'
            const routeDetails = oldGenerator(repo,opts) as RouteOptions
            return {
                ...routeDetails,
                schema: {
                    ...routeDetails.schema,
                    summary: `Delete ${repo.metadata.name} by ${primaryColName}`,
                    tags: [repo.metadata.name],
                    description: `The ${repo.metadata.name} with the ${primaryColName} specified must exist, otherwise a 'not found' error is returned`
                }
            }
        });
    }
}