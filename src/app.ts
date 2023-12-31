import * as express from 'express';
import {Request, Response} from "express";
import * as cors from 'cors';
import {createConnection} from 'typeorm'
import {Product} from "./entity/Product";
import * as amqp from 'amqplib/callback_api'

createConnection().then(db => {
    const productRepository = db.getRepository(Product)
    amqp.connect(process.env.RABBITMQ_URL, function (error0, connection) {
        if (error0) {
            throw error0
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1
            }
            const app = express();

            app.use(cors({
                origin: ['http://localhost:4200', 'http://localhost:3000', "http://localhost:8080"]
            }));
            app.use(express.json());

            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find();
                res.json(products)
            });
            app.get('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOne({
                    where: {
                        id: req.params.id
                    }
                });
                res.send(product)
            })
            app.post('/api/products', async (req: Request, res: Response) => {
                const product = await productRepository.create(req.body);
                const result = await productRepository.save(product)
                channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)));
                return res.send(result)
            })
            app.put('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOne({
                    where: {
                        id: req.params.id
                    }
                });
                productRepository.merge(product, req.body)
                const result = await productRepository.save(product)
                channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)));
                return res.json(result)
            })
            app.delete('/api/products/:id', async (req: Request, res: Response) => {
                const result = await productRepository.delete(req.params.id)
                channel.sendToQueue('product_deleted', Buffer.from(req.params.id));
                return res.json(result)
            })

            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const product = await productRepository.findOne({
                    where: {
                        id: req.params.id
                    }
                });
                product.likes += 1
                const result = await productRepository.save(product)
                return res.json(result)
            })

            app.listen(8000, () => console.log('Listening on port 8000'));
            process.on('beforeExit', () => {
                console.log('Connection closed')
                connection.close()
            })
        })
    })
})


