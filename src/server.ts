import fastify from "fastify";

import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { registerForUser } from "./routes/register-user";
import { tranferToUser } from "./routes/transfer";
import { refoundToUser } from "./routes/refound";

const app = fastify()

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerForUser)
app.register(tranferToUser)
app.register(refoundToUser)


app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running.')
})
