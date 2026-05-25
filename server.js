const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || "0.0.0.0";
const dbPath = path.join(root, "db.json");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function sampleBill(id, name, product) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1180" viewBox="0 0 900 1180">
      <rect width="900" height="1180" fill="#ffffff"/>
      <rect x="56" y="56" width="788" height="1068" rx="34" fill="#f4f8ff" stroke="#1d72f3" stroke-width="4"/>
      <text x="100" y="150" font-family="Arial" font-size="54" font-weight="700" fill="#121827">Service Bill</text>
      <text x="100" y="230" font-family="Arial" font-size="30" fill="#667389">Complaint: ${id}</text>
      <text x="100" y="300" font-family="Arial" font-size="30" fill="#667389">Customer: ${name}</text>
      <text x="100" y="370" font-family="Arial" font-size="30" fill="#667389">Product: ${product}</text>
      <line x1="100" y1="440" x2="800" y2="440" stroke="#d7e2f3" stroke-width="4"/>
      <text x="100" y="530" font-family="Arial" font-size="32" font-weight="700" fill="#121827">Warranty verification copy</text>
      <text x="100" y="600" font-family="Arial" font-size="28" fill="#667389">Dealer can preview this uploaded bill image.</text>
      <rect x="100" y="720" width="700" height="180" rx="20" fill="#e7fff8" stroke="#0bbf9a" stroke-width="3"/>
      <text x="140" y="820" font-family="Arial" font-size="34" font-weight="700" fill="#0f8f75">Valid Customer Bill</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function sampleProduct(id, product) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
      <rect width="900" height="700" rx="42" fill="#101827"/>
      <rect x="72" y="72" width="756" height="556" rx="34" fill="#eef6ff" stroke="#0bbf9a" stroke-width="5"/>
      <text x="110" y="160" font-family="Arial" font-size="46" font-weight="700" fill="#121827">${product}</text>
      <text x="110" y="230" font-family="Arial" font-size="28" fill="#667389">Product image attached to ${id}</text>
      <circle cx="450" cy="410" r="120" fill="#dffcf5" stroke="#0bbf9a" stroke-width="5"/>
      <text x="393" y="428" font-family="Arial" font-size="42" font-weight="700" fill="#0f8f75">IMG</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seedDb() {
  const now = Date.now();
  return {
    complaints: [
      {
        id: "CMP-1042",
        name: "Nirav Shah",
        phone: "+91 98765 43210",
        product: "Inverter Battery",
        company: "Voltix",
        type: "Battery Issue",
        status: "Working",
        submittedAt: now - 28 * 60 * 60 * 1000,
        estimatedHours: 34,
        priority: "High",
        smartNote: "Check battery health and charging circuit first.",
        billUrl: sampleBill("CMP-1042", "Nirav Shah", "Voltix Inverter Battery"),
        billName: "bill-cmp-1042.svg",
        productImageUrl: sampleProduct("CMP-1042", "Inverter Battery"),
        productImageName: "product-cmp-1042.svg",
      },
      {
        id: "CMP-1043",
        name: "Jigna Patel",
        phone: "+91 99000 22334",
        product: "LED TV",
        company: "BrightView",
        type: "Display Problem",
        status: "Pending",
        submittedAt: now - 39 * 60 * 60 * 1000,
        estimatedHours: 30,
        priority: "High",
        smartNote: "Display panel issue needs fast inspection.",
        billUrl: sampleBill("CMP-1043", "Jigna Patel", "BrightView LED TV"),
        billName: "bill-cmp-1043.svg",
        productImageUrl: sampleProduct("CMP-1043", "LED TV"),
        productImageName: "product-cmp-1043.svg",
      },
      {
        id: "CMP-1044",
        name: "Harsh Mehta",
        phone: "+91 91234 56780",
        product: "Bluetooth Speaker",
        company: "Soundio",
        type: "Sound Problem",
        status: "Accepted",
        submittedAt: now - 12 * 60 * 60 * 1000,
        estimatedHours: 24,
        priority: "Medium",
        smartNote: "Test speaker driver, Bluetooth board, and charging.",
        billUrl: sampleBill("CMP-1044", "Harsh Mehta", "Soundio Bluetooth Speaker"),
        billName: "bill-cmp-1044.svg",
        productImageUrl: sampleProduct("CMP-1044", "Bluetooth Speaker"),
        productImageName: "product-cmp-1044.svg",
      },
    ],
  };
}

function readDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seedDb(), null, 2));
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) {
        request.destroy();
        reject(new Error("Request body is too large"));
      }
    });
    request.on("end", () => resolve(body ? JSON.parse(body) : {}));
    request.on("error", reject);
  });
}

function serveStatic(request, response, url) {
  const requestedPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const filePath = path.resolve(root, requestedPath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    response.end(data);
  });
}

http
  .createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || `127.0.0.1:${port}`}`);

    try {
      if (url.pathname === "/api/complaints" && request.method === "GET") {
        sendJson(response, 200, readDb().complaints);
        return;
      }

      if (url.pathname === "/api/complaints" && request.method === "POST") {
        const complaint = await readBody(request);
        const db = readDb();
        db.complaints.unshift(complaint);
        writeDb(db);
        sendJson(response, 201, complaint);
        return;
      }

      const match = url.pathname.match(/^\/api\/complaints\/([^/]+)$/);
      if (match && request.method === "PATCH") {
        const id = decodeURIComponent(match[1]);
        const updates = await readBody(request);
        const db = readDb();
        const complaint = db.complaints.find((item) => item.id === id);
        if (!complaint) {
          sendJson(response, 404, { error: "Complaint not found" });
          return;
        }
        Object.assign(complaint, updates);
        writeDb(db);
        sendJson(response, 200, complaint);
        return;
      }

      serveStatic(request, response, url);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  })
  .listen(port, host, () => {
    console.log(`ServiceFlow running at http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`);
    console.log("For mobile testing, open this computer's LAN IP with the same port.");
  });
