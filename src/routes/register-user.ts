import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { handleCPF } from "../utils/handle-cnpj-cpf";


export async function registerForUser(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().post('/user', {
    schema: {
      summary: 'Register an user',
      tags: ['user'],
      body: z.object({
        name: z.string().min(4),
        email: z.string().email(),
        cpf: z.string().min(11).max(14),
        password: z.string().min(6),
      }),
      response: {
        201: z.object({
          userId: z.string().uuid(),
        })
      }
    }
  } , async (request, reply) => {
    const { email, cpf, name, password } = request.body

    const formatedCPF = handleCPF(cpf)

    const isShopkeeper = formatedCPF.length === 14

    const userFromEmail = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if(userFromEmail !== null) {
      throw new Error('Another user with same email already exists')
    }

    const userFromCPF = await prisma.user.findUnique({
      where: {
        cpf: formatedCPF
      }
    })

    if(userFromCPF !== null) {
      throw new Error('Another user with same CPF/CNPJ already exists')
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        cpf: formatedCPF,
        password,
        isShopkeeper
      }
    })

    return reply.status(201).send({ userId: user.id })
  })
}
