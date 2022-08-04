import express from "express";
import http from "http";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.static("public"));
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

app.get("/:path", function (req, res) {
  res.sendFile(__dirname + `/client/${req.params.path}.html`);
});

server.listen(process.env.PORT || 3000, function () {
  console.log("Server started!");
});
