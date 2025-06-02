import express from "express";
import http from "http";
import cors from "cors";
import route from "./routes/index.js";
import bodyParser from "body-parser";

const port = 5000;
const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

route(app);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
