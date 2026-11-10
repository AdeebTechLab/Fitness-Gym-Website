import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400);
    response.end("Invalid request path");
    return;
  }

  const filePath = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  const relativePath = relative(root, filePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let fileInfo;
  try {
    fileInfo = await stat(filePath);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") {
      response.writeHead(500);
      response.end("Unable to read requested file");
      console.error("Failed to inspect requested file:", error);
      return;
    }

    response.writeHead(404);
    response.end("Not found");
    return;
  }

  if (!fileInfo.isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Length": fileInfo.size,
    "Content-Type": mimeTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream"
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(filePath);
  stream.on("error", (error) => {
    console.error("Failed to serve requested file:", error);
    if (!response.headersSent) {
      response.writeHead(500);
    }
    response.end("Unable to read requested file");
  });
  stream.pipe(response);
});

const port = Number(process.env.PORT ?? 5173);
server.listen(port, "127.0.0.1", () => {
  console.log(`Fitness Club dev server running at http://127.0.0.1:${port}`);
});
