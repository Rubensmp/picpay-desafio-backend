import fastify from "fastify";

import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUI from "@fastify/swagger-ui"
import { fastifyCors } from "@fastify/cors";

import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { registerForUser } from "./routes/register-user";
import { tranferToUser } from "./routes/transfer";
import { refoundToUser } from "./routes/refound";

const app = fastify()

app.register(fastifyCors, {
  // http://meufrontend.com
  origin: '*',
})

app.register(fastifySwagger, {
  swagger: {
    consumes: ['application/json'],
    produces: ['application/json'],
    info: {
      title: "event.Api",
      description: "Especificações da API para o back-end da aplicação event.Api.",
      version: '1.0.0'
    }
  },
  transform: jsonSchemaTransform
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs'
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerForUser)
app.register(tranferToUser)
app.register(refoundToUser)


app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running.')
})
