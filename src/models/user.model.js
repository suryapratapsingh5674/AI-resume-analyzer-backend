import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "uername alredy taken"],
        required: true
    },
    email:{
        type: String,
        unique:[true, "email already taken"],
        required: true
    },
    password: {
        type: String,
        required:true,
        Selection:false
    }
})

const userModle = mongoose.model('users', userSchema);

export default userModle;