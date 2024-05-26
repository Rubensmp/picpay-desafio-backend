import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { BadRequest } from "./_errors/bad-request";

export async function getTransactionInfo(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().get('/transaction/:transactionId', {
    schema: {
      summary: 'Get transaction infomations',
      tags: ['transaction'],
      params: z.object({
        transactionId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          transaction: z.object({
            id: z.string().uuid(),
            amount: z.number().int(),
            payerId: z.string().uuid(),
            payeeId: z.string().uuid(),
            refoundFrom: z.string().uuid().nullish(),
            createdAt: z.date(),
          })
        })
      },
    }
  } , async (request, reply) => {
    const { transactionId } = request.params

    const transaction = await prisma.transaction.findUnique({
      select: {
        id: true,
        amount: true,
        payerId: true,
        payeeId: true,
        refoundFrom: true,
        createdAt: true,
      },
      where: {
        id: transactionId
      },
    })

    if(transaction === null) {
      throw new BadRequest('Transaction not found')
    }

    return reply.send({
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        payerId: transaction.payerId,
        payeeId: transaction.payeeId,
        refoundFrom: transaction.refoundFrom,
        createdAt: transaction.createdAt,
      }
    })
  })
}
