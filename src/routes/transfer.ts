import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import axios from "axios";
import * as nodemailer from "nodemailer";
import { BadRequest } from "./_errors/bad-request";

export async function tranferToUser(app: FastifyInstance){
  app.withTypeProvider<ZodTypeProvider>().post('/transaction/:payerId/:payeeId', {
    schema: {
      summary: 'Transfer money to an user',
      tags: ['transaction'],
      body: z.object({
        amount: z.number().int().nonnegative(),
      }),
      params: z.object({
        payerId: z.string().uuid(),
        payeeId: z.string().uuid()
      }),
      response: {
        201: z.object({
          transactionId: z.string().uuid(),
        })
      }
    }
  } , async (request, reply) => {
    const { amount } = request.body
    const { payerId, payeeId } = request.params

    try {
      const authorizeResponse = await axios.get('https://util.devi.tools/api/v2/authorize');

      if (authorizeResponse.data.data.authorization !== true) {
        throw new BadRequest('Authorization failed');
      }

    } catch (error) {
      throw new BadRequest('Authorization failed');
    }

    const [payer, payee] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: payerId
        }
      }),
      prisma.user.findUnique({
        where: {
          id: payeeId
        }
      })
    ])

    if(payer === null) {
      throw new BadRequest('Payer not found')
    }

    if(payee === null) {
      throw new BadRequest('Payee not found')
    }

    if(payer.isShopkeeper) {
      throw new BadRequest('Payer cant transfer money.')
    }

    if(payer.balance < amount){
      throw new BadRequest('Payer do not have money enough')
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        payerId: payer.id,
        payeeId: payee.id
      }
    })

    await prisma.user.update({
      where: {
        id: payer.id
      },
      data: {
        balance: payer.balance - amount,
        updatedAt: new Date()
      }
    })

    await prisma.user.update({
      where: {
        id: payee.id
      },
      data: {
        balance: payee.balance + amount,
        updatedAt: new Date()
      }
    })

    var transportPayer = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "11fdd73973f81d",
        pass: "0fcbb2d56a8def"
      }
    });

    let mailOptionsPayer = {
      from: 'teste@aaa.com',
      to: payer.email,
      subject: 'Transfer made',
      text: `Notification of transfer from your account to ${payee.name} in the amount of ${amount} dollars`
    };

    transportPayer.sendMail(mailOptionsPayer, function(err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        console.log(`Email sent to ${payer.email} successfully`);
      }
    });

    var transportPayee = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "11fdd73973f81d",
        pass: "0fcbb2d56a8def"
      }
    });

    let mailOptionsPayee = {
      from: 'teste@aaa.com',
      to: payee.email,
      subject: 'Transfer made',
      text: `Notification of transfer from ${payee.name}  account to yours in the amount of ${amount} dollars`
    };

    transportPayee.sendMail(mailOptionsPayee, function(err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        console.log(`Email sent to ${payee.email} successfully`);
      }
    });

    return reply.status(201).send({ transactionId: transaction.id })
  })
}
