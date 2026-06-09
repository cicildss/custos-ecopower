import "dotenv/config";
import cors from "cors";
import express from "express";
import { produtosRouter } from "./routes/produtos.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/produtos", produtosRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(400).json({ message: "Erro ao processar requisição" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
