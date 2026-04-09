import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI

const connectDb = async ()=>{
    await mongoose.connect(MONGO_URI);
    console.log("connected to db.")
}

export default connectDb;