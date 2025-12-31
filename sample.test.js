const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function runJakselSubmission() {
  const SUBMISSION_DIR = process.env.SUBMISSION_DIR || "/app";

  const possiblePaths = [
    path.join(SUBMISSION_DIR, "challenge", "ecommerce.jaksel"),
  ];

  let targetFile = possiblePaths.find((p) => fs.existsSync(p));

  if (!targetFile) {
    let filesInRoot = [];
    try {
      filesInRoot = fs.readdirSync(SUBMISSION_DIR);
    } catch (e) {}
    throw new Error(
      `File submission tidak ditemukan. Dicari di: ${possiblePaths.join(
        ", "
      )}. Files di ${SUBMISSION_DIR}: ${filesInRoot.join(", ")}`
    );
  }

  const JAKSEL_BIN_LOCAL = path.join(
    SUBMISSION_DIR,
    "node_modules",
    ".bin",
    "jaksel"
  );
  const JAKSEL_BIN_ALT = path.join(
    SUBMISSION_DIR,
    "node_modules",
    ".bin",
    "jaksel-language"
  );

  let finalCmd;
  if (fs.existsSync(JAKSEL_BIN_LOCAL)) {
    finalCmd = `${JAKSEL_BIN_LOCAL} ${targetFile}`;
  } else if (fs.existsSync(JAKSEL_BIN_ALT)) {
    finalCmd = `${JAKSEL_BIN_ALT} ${targetFile}`;
  } else {
    finalCmd = `jaksel ${targetFile}`;
  }

  try {
    const output = execSync(finalCmd, {
      encoding: "utf-8",
      cwd: SUBMISSION_DIR,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output;
  } catch (error) {
    throw new Error(
      `Runtime Error (Exit Code ${error.status}):\n${
        error.stderr || error.stdout || error.message
      }`
    );
  }
}

describe("Integration Tests - E-Commerce System", () => {
  let output;

  beforeAll(() => {
    console.log("Current working directory:", process.cwd());
    console.log("Submission directory:", process.env.SUBMISSION_DIR || "/app");

    try {
      output = runJakselSubmission();
    } catch (e) {
      console.error("CRITICAL ERROR DURING INITIALIZATION:");
      console.error(e.message);
      output = "RUNTIME_ERROR: " + e.message;
    }
  });

  test("Program harus bisa dijalankan (No Syntax Error)", () => {
    if (output.startsWith("RUNTIME_ERROR")) {
      throw new Error(output);
    }
    expect(output).not.toContain("SyntaxError");
    expect(output).not.toContain("ReferenceError");
  });

  test("Harus menampilkan Header System", () => {
    expect(output).toContain("E-COMMERCE ORDER MANAGEMENT SYSTEM");
  });

  test("Harus memproses Order #1 (Laptop)", () => {
    expect(output).toContain("ORDER #1 - Budi Santoso");
    expect(output).toContain("Product: Gaming Laptop RTX 4090");
    expect(output).toMatch(/Subtotal: Rp \d+/);
  });

  test("Harus memproses Order #2 (Smartphone)", () => {
    expect(output).toContain("ORDER #2 - Siti Nurhaliza");
    expect(output).toMatch(/Discount.*Rp/);
  });

  test("Harus memproses Order #3 (Keyboard)", () => {
    expect(output).toContain("ORDER #3 - Ahmad Dahlan");
  });

  test("Harus menampilkan Inventory Report di akhir", () => {
    expect(output).toContain("INVENTORY REPORT");
    expect(output).toContain("SUMMARY");
  });
});
