import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function getUserTransactions(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().get('/user/transactions/:userId', {
    schema: {
      summary: 'Get user transactions',
      tags: ['User'],
      params: z.object({
        userId: z.string().uuid(),
      }),
      querystring: z.object({
        pageIndex: z.string().nullish().default('0').transform(Number),
      }),
      response: {
        200: z.object({
          transactions: z.array(
            z.object({
              id: z.string().uuid(),
              amount: z.number(),
              payerId: z.string().uuid(),
              payeeId: z.string().uuid(),
              createdAt: z.date(),
              refoundFrom: z.string().nullable()
            })
          )
        })
      },
    }
  } , async (request, reply) => {
    const { userId } = request.params
    const { pageIndex } = request.query

    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        amount: true,
        payerId: true,
        payeeId: true,
        refoundFrom: true,
        createdAt: true,
      },
      where: {
        OR: [
          {
            payeeId: userId
          },
          {
            payerId: userId
          }
        ]
      },
      take: 10,
      skip: pageIndex*10,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return reply.send({ transactions: transactions.map(transaction => {
      return {
        id: transaction.id,
        amount: transaction.amount,
        payerId: transaction.payerId,
        payeeId: transaction.payeeId,
        refoundFrom: transaction.refoundFrom ?? null,
        createdAt: transaction.createdAt,
      }
    })
  })
  })
}
