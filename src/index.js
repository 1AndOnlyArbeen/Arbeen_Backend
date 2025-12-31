import dotenv from "dotenv"
import dbConnect from "./db/index.db.js"
import app from "./app.js"


const port = process.env.PORT||4000

dotenv.config()

dbConnect()

.then(()=>{
    app.listen(port,()=>{
        console.log(`your server is running at port no  ${port}`);
    })
    

})
.catch((error)=>{
    console.log(`Db mongo connection FAILED !`,error);

})


