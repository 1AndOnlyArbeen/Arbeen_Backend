import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
    })
);

app.use(
    express.json({
        limit: "20kb",
    })
);

app.use(
    express.urlencoded({
        extended: true,           // url encoder
        limit: "20kb",
    })
);
app.use(express.static("public")) //file, folder storage , making public asset 

app.use(cookieParser()) // using cookieParser

export default app;
