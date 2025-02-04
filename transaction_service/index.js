import express from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/cardDB');

const transactionSchema = new mongoose.Schema({
    cardId : {type : mongoose.Schema.Types.ObjectId, ref : 'Card'},
    amount : Number
});
const Transaction = mongoose.model("Transaction", transactionSchema);

let channel;
const RABBITMQ_URL="amqp://localhost"
async function connectRabbitMQ(){
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue("transactionQueue");
}
connectRabbitMQ().catch(console.error);

app.post('/pay', async (req, res) => {
    try{
        const {cardId, amount} = req.body;
        const transaction = await Transaction.create({cardId, amount});
        channel.sendToQueue("transactionQueue",
            Buffer.from(JSON.stringify({cardId, amount}))
        );
        res.json({
            message : "Transaction initiated",
            transaction
        });
    } catch (err){
        res.status(411).json({
            message : `${err}`
        });
    }
});

app.listen(3003, () => console.log("Transaction service running at port 3003"));
