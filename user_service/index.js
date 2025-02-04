import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/cardDB');

const userSchema = new mongoose.Schema({
    email : {type : String, unique : true},
    password : String
});

const User = mongoose.model('User', userSchema);

app.post('/register', async( req, res) => {
    try{
        const {email, password} = req.body;
        const user = await User.create({email, password});
        return res.json({
            message : 'User cerated successfully!',
            user
        });
    } catch(err){
        return res.status(411).json({
            message : `${err}`
        });
    }
});

app.get('/:email', async (req, res) => {
    try{
        const user = await User.findOne({email : req.params.email});
        return res.json({
            user
        });
    } catch (err) {
        return res.status(411).json({
            message : `${err}`
        });
    }
});

app.listen(3000, () => console.log(`User service running at port 3000`));

