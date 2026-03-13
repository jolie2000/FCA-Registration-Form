const http = require("http");
const path = require("path");

const { ensureDatabase, closeDatabase } = require("./src/database/database");
const { handleApiRequest } = require("./src/routes/beneficiaries");
const { serveStatic } = require("./src/routes/static");

// Static frontend files are served from the public folder.
const publicDirectory = path.join(__dirname, "public");
const port = process.env.PORT || 3000;

const server = http.createServer(async (request, response) => {
  try {
    // API requests are handled separately from static page requests.
    if (request.url.startsWith("/api/")) {
      await handleApiRequest(request, response);
      return;
    }

    await serveStatic(request, response, publicDirectory);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        message: "An unexpected server error occurred."
      })
    );
  }
});

async function startServer() {
  // Makes sure the MongoDB connection is ready before the server starts.
  await ensureDatabase();

  server.listen(port, () => {
    console.log(`FCA refugee support program running on http://localhost:${port}`);
  });
}

async function shutdown() {
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer().catch((error) => {
  console.error("Failed to start the server:", error.message);
  process.exit(1);
});
