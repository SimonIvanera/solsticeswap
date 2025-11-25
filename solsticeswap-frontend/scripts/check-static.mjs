import * as fs from "fs";
import * as path from "path";

const violations = [];

function checkDirectory(dir, basePath = "") {
  const fullPath = path.join(basePath, dir);
  if (!fs.existsSync(fullPath)) {
    return;
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry.name);
    const relativePath = path.join(basePath, dir, entry.name);

    if (entry.isDirectory()) {
      // Check for dynamic route segments
      if (entry.name.includes("[") && entry.name.includes("]")) {
        const paramsFile = path.join(entryPath, "generateStaticParams.ts");
        const paramsFileAlt = path.join(entryPath, "generateStaticParams.tsx");
        const pageFile = path.join(entryPath, "page.tsx");
        const pageFileAlt = path.join(entryPath, "page.ts");
        
        // Check if generateStaticParams exists in page.tsx/page.ts
        let hasGenerateStaticParams = false;
        if (fs.existsSync(pageFile) || fs.existsSync(pageFileAlt)) {
          const pageContent = fs.readFileSync(
            fs.existsSync(pageFile) ? pageFile : pageFileAlt,
            "utf-8"
          );
          if (pageContent.includes("generateStaticParams")) {
            hasGenerateStaticParams = true;
          }
        }
        
        // Also check for separate generateStaticParams file
        if (!hasGenerateStaticParams && !fs.existsSync(paramsFile) && !fs.existsSync(paramsFileAlt)) {
          violations.push(
            `❌ Dynamic route "${relativePath}" missing generateStaticParams`
          );
        }
      }

      // Skip node_modules and .next
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== "out") {
        checkDirectory(entry.name, fullPath);
      }
    } else if (entry.isFile()) {
      // Check for SSR/ISR/API Route violations
      if (
        entryPath.includes("/api/") ||
        entryPath.includes("/pages/api/") ||
        entryPath.includes("route.ts") ||
        entryPath.includes("route.tsx")
      ) {
        violations.push(`❌ API Route found: ${relativePath}`);
      }

      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const content = fs.readFileSync(entryPath, "utf-8");

        // Check for SSR violations
        if (
          content.includes("getServerSideProps") ||
          content.includes("getStaticProps") ||
          content.includes("getInitialProps")
        ) {
          violations.push(`❌ SSR function found: ${relativePath}`);
        }

        // Check for server-only imports
        if (content.includes("from 'server-only'")) {
          violations.push(`❌ server-only import found: ${relativePath}`);
        }

        // Check for next/headers
        if (content.includes("from 'next/headers'")) {
          violations.push(`❌ next/headers import found: ${relativePath}`);
        }

        // Check for cookies()
        if (content.includes("cookies()") && !content.includes('"use client"')) {
          violations.push(`❌ cookies() found without "use client": ${relativePath}`);
        }

        // Check for dynamic = 'force-dynamic'
        if (content.includes("dynamic = 'force-dynamic'")) {
          violations.push(`❌ force-dynamic found: ${relativePath}`);
        }
      }
    }
  }
}

console.log("🔍 Checking for static export violations...\n");

// Check app directory
checkDirectory("app", ".");

// Check pages directory if exists
if (fs.existsSync("pages")) {
  checkDirectory("pages", ".");
}

// Check for API routes
if (fs.existsSync("app/api")) {
  violations.push("❌ app/api directory found (API routes not allowed)");
}

if (fs.existsSync("pages/api")) {
  violations.push("❌ pages/api directory found (API routes not allowed)");
}

// Report results
if (violations.length > 0) {
  console.error("❌ Static export violations found:\n");
  violations.forEach((v) => console.error(`  ${v}`));
  console.error("\n");
  process.exit(1);
} else {
  console.log("✅ No static export violations found!\n");
  process.exit(0);
}


