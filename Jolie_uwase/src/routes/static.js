const fs = require("fs");
const path = require("path");

const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function serveStatic(request, response, publicDirectory) {
  return new Promise((resolve) => {
    // Requests to "/" should open the landing page by default.
    const requestPath = request.url === "/" ? "/index.html" : request.url;
    const sanitizedPath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(publicDirectory, sanitizedPath);

    // Block any attempt to escape the public directory.
    if (!filePath.startsWith(publicDirectory)) {
      response.writeHead(403, { "Content-Type": "text/plain" });
      response.end("Forbidden");
      resolve();
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        // Fall back to the landing page if the file is missing.
        const fallbackFile = path.join(publicDirectory, "index.html");
        fs.readFile(fallbackFile, (fallbackError, fallbackContent) => {
          if (fallbackError) {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.end("Not found");
            resolve();
            return;
          }

          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(fallbackContent);
          resolve();
        });
        return;
      }

      // Send the file using the correct content type.
      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        "Content-Type": mimeTypes[extension] || "application/octet-stream"
      });
      response.end(content);
      resolve();
    });
  });
}

module.exports = {
  serveStatic
};
