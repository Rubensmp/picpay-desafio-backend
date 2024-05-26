import fastify from "fastify";

import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { registerForUser } from "./routes/register-user";
import { tranfeToUser } from "./routes/transfer";

const app = fastify()

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerForUser)
app.register(tranfeToUser)


app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running.')
})
