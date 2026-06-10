import "dotenv/config";
import cors from "cors";
import express from "express";
import { produtosRouter } from "./routes/produtos.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: configuredOrigins.length > 0 ? configuredOrigins : true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", port, databaseConfigured: Boolean(process.env.DATABASE_URL) });
});

app.use("/api", (_req, res, next) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({
      message: "Banco de dados nao configurado. Configure backend\\.env com DATABASE_URL e reinicie a API.",
    });
    return;
  }
  next();
});

app.use("/api/produtos", produtosRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Erro ao processar requisicao";
  res.status(400).json({ message });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

