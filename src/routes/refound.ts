import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { BadRequest } from "./_errors/bad-request";

export async function refoundToUser(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().get('/transaction/:transactionId', {
    schema: {
      summary: 'Refound transfer',
      tags: ['transaction'],
      params: z.object({
        transactionId: z.string().uuid(),
      }),
      response: {
        201: z.object({
          refoundId: z.string().uuid(),
        })
      }
    }
  } , async (request, reply) => {
    const { transactionId } = request.params

    const transaction = await prisma.transaction.findUnique({
      where: {
        transactionId
      }
    })

    if(transaction === null) {
      throw new BadRequest('Transaction not found')
    }

    const [payer, payee] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: transaction.payerId
        }
      }),
      prisma.user.findUnique({
        where: {
          id: transaction.payeeId
        }
      })
    ])

    if(payer === null) {
      throw new BadRequest('Payer not found')
    }

    if(payee === null) {
      throw new BadRequest('Payee not found')
    }


    await prisma.user.update({
      where: {
        id: payer.id
      },
      data: {
        balance: payer.balance + transaction.amount,
        updatedAt: new Date()
      }
    })

    await prisma.user.update({
      where: {
        id: payee.id
      },
      data: {
        balance: payee.balance - transaction.amount,
        updatedAt: new Date()
      }
    })

    const refound = await prisma.transaction.create({
      data: {
        amount: transaction.amount,
        payerId: payee.id,
        payeeId: payer.id,
        refoundFrom: transaction.transactionId
      }
    })

    return reply.status(201).send({ refoundId: refound.transactionId })
  })
}
