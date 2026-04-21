import express, { Request, Response } from 'express';
import 'dotenv/config'
import morgan from 'morgan';

import prisma from './lib/prisma.js';
import { z, ZodError } from 'zod';
import { de } from 'zod/locales';

const app = express();
const PORT = process.env.PORT;
if (!PORT) throw new Error('PORT is missing in your env file');

app.use(express.json());
app.use(morgan('dev'));

const foodSchema = z.object({
    name: z.string(),
    amount: z.int(),
    calories: z.number().gt(0),
});

const partialFood = foodSchema.partial();

app.get("/foods", async (_req, res: Response) => {
    const food = await prisma.food.findMany();
    res.status(200).json(food);
});

app.post('/foods', async (req: Request, res: Response) => {
    try {
        const { name, amount, calories } = foodSchema.parse(req.body);
        const newFood = await prisma.food.create({
            data: { name, amount, calories }
        })

        res.status(201).json(newFood);
    } catch (error) {
        console.log(error);
        if (error instanceof ZodError)
            return res.status(400).json(error.issues);

        res.status(500).json(error);
    }
});

app.put("/foods/:id", async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const data = partialFood.parse(req.body);

        const updatedFood = await prisma.food.update({
            where: { id },
            data: data,
        });
        res.status(200).json(updatedFood);
    } catch (error) {
        if (error instanceof ZodError) return res.status(400).json(error.issues);
        res.status(500).json(error);
    }
});

app.delete('/foods/:id', async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const deletedFood = await prisma.food.delete({
            where: { id },
        });
        res.status(200).json(deletedFood);
    } catch (error) {
        res.status(500).json(error);
    }
})

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:%d', PORT);
});