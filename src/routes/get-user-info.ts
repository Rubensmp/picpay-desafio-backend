import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { BadRequest } from "./_errors/bad-request";

export async function getUserInfo(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().get('/user/:userId', {
    schema: {
      summary: 'Get user infomations',
      tags: ['user'],
      params: z.object({
        userId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          user: z.object({
            id: z.string().uuid(),
            cpf: z.string(),
            name: z.string(),
            email: z.string().email(),
            balance: z.number().int(),
            isShopkeeper: z.boolean().nullish(),
            createdAt: z.date(),
            updatedAt: z.date(),
          })
        })
      },
    }
  } , async (request, reply) => {
    const { userId } = request.params

    const user = await prisma.user.findUnique({
      select: {
        id: true,
        cpf: true,
        name: true,
        email: true,
        balance: true,
        isShopkeeper: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        id: userId
      },
    })

    if(user === null) {
      throw new BadRequest('User not found')
    }

    return reply.send({
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        balance: user.balance,
        isShopkeeper: user.isShopkeeper,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    })
  })
}
