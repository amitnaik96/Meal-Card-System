import express from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';
const RABBITMQ_URL="amqp://localhost"

const app = express();
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/cardDB');

const balanceSchema = new mongoose.Schema({
    email : String,
    cardId : {type : mongoose.Schema.Types.ObjectId, ref: 'Card'},
    balance : Number
});

const Balance = mongoose.model("Balance", balanceSchema);

app.post('/balance', async (req, res) => {
    try{
        const {email, cardId, balance} = req.body;
        const blnObj = await Balance.create({email, cardId, balance});
        return res.json({
            balance : blnObj
        });
    } catch (err) {
        return res.status(411).json({
            message : `${err}`
        });
    }
});

async function consumeTransaction(){
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue("transactionQueue");

    channel.consume("transactionQueue", async (msg) => {
        const {cardId, amount} = JSON.parse(msg.content.toString());
        const blObj = await Balance.findOne({ cardId });
        if(!blObj) return console.log("Card not found!");
        
        let bl = await Balance.findOneAndUpdate({cardId}, {$set : {balance : blObj.balance-amount}} , {new :true});
        console.log(`Updated balance for card ${cardId}, new balance: ${bl.balance}`);
        channel.ack(msg);
    });
}

consumeTransaction().catch(console.error);

app.get('/balance', async (req, res) => {
    try{
        const email = req.body.email;
        const obj = await Balance.findOne({email});
        return res.json({
            balance : obj.balance 
        });
    } catch (err) {
        return res.status(411).json({
            message : `${err}`
        });
    }
});

app.listen(3002, () => console.log(`User service running at port 3002`));
