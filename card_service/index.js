import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const app = express();
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/cardDB');

const cardSchema = new mongoose.Schema({
    email : String,
    activated : Boolean
});

const Card = mongoose.model("Card", cardSchema);

app.get('/create-card', async (req, res) => {
    try{
        const {email, activated, balance} = req.body;
        const response = await axios.get(`http://localhost:3000/${email}`);
        const user = response.data.user;
        if(!user){
            return res.status(403).json({
                message : 'Invalid/Non-registered user email'
            });
        }
        const card = await Card.create({email, activated});
        const resBalance = await axios.post(`http://localhost:3002/balance`, {
            email,
            cardId : card._id,
            balance
        });
        return res.json({
            card,
            balance : resBalance.data.balance
        });
    } catch (err){
        return res.status(411).json({
            message : `${err}`
        });
    }
});

app.post('/activate', async (req, res) => {
    try{
        const email = req.body.email;
        const card = await Card.findOneAndUpdate({email}, {$set: {activated : true}}, {new : true});
        return res.json({
            message : 'Card activated',
            card
        });
    } catch (err){
        return res.status(411).json({
            message : `${err}`
        });
    }   
});

app.listen(3001, () => console.log(`Card service running at port 3001`));
