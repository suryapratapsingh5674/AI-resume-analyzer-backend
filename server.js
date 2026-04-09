import 'dotenv/config'
import app from './src/app.js'
import connectDb from './src/db/db.js'

connectDb();

const PORT = process.env.PORT;

app.listen(PORT, ()=>{
    console.log("server runing on port: ", PORT);
})