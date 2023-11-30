import express from "express"
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors"
import router from "./router/routes.js";
const app = express();

app.use(cors())
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

const port = 2000

app.use('/api', router)


app.listen(port,()=>{
    console.log(`server is running on port: ${port}`);
})