import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSsoRoutes } from "../routes/sso";
import { registerAdminMediaRoutes } from "../routes/adminMedia";
import { registerMemberMediaRoutes } from "../routes/memberMedia";
import { registerPublicBrandRoutes } from "../routes/publicBrand";
import { registerAccountRecoveryRoute } from "../routes/accountRecovery";
import { checkDatabaseHealth } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.get("/api/health", async (_req, res) => {
    const database = await checkDatabaseHealth();
    res.status(database ? 200 : 503).json({
      status: database ? "ok" : "degraded",
      service: "susan-drury-membership",
      database: database ? "connected" : "unavailable",
    });
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerAccountRecoveryRoute(app);
  registerSsoRoutes(app);
  registerAdminMediaRoutes(app);
  registerMemberMediaRoutes(app);
  registerPublicBrandRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port =
    process.env.NODE_ENV === "production" ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
