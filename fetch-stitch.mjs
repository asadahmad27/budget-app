import { stitch } from "@google/stitch-sdk";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PROJECT_ID = "13627851444357786879";
const SCREENS = [
  { name: "overview-dashboard", title: "Overview Dashboard", id: "2bb2ec2daa764d0ca83cc63e6f0b68a9" },
  { name: "log-transaction", title: "Log Transaction", id: "4ac5fe728c484cad9fa0e5ae3baf53ae" },
  { name: "wallet-categories", title: "Wallet & Categories View", id: "717a94eb180e42be99f6eee28ee2cdaf" },
  { name: "budget-specifications", title: "Budget Specifications", id: "bc5b5e0198024403b6402a4ef56af834" },
  { name: "jazzcash-tracker", title: "JazzCash Tracker", id: "d9d19d89d4414895912622de9d886c07" },
];

async function download(url, dest) {
  if (!url) return false;
  await execFileAsync("curl", ["-L", "-sS", "-o", dest, url]);
  return true;
}

async function fetchScreen(project, screenInfo, outDir) {
  console.log(`Fetching ${screenInfo.title} (${screenInfo.id})...`);
  const screen = await project.getScreen(screenInfo.id);
  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();

  const result = { ...screenInfo, htmlUrl, imageUrl };

  const htmlPath = `${outDir}/${screenInfo.name}.html`;
  const imagePath = `${outDir}/${screenInfo.name}.png`;

  if (await download(htmlUrl, htmlPath)) {
    result.htmlPath = htmlPath;
    console.log(`  html: ${htmlPath}`);
  } else {
    console.log(`  html: unavailable`);
  }

  if (await download(imageUrl, imagePath)) {
    result.imagePath = imagePath;
    console.log(`  image: ${imagePath}`);
  } else {
    console.log(`  image: unavailable`);
  }

  return result;
}

async function fetchDesignSystem(outDir) {
  console.log("Fetching Design System...");
  const response = await stitch.callTool("list_design_systems", {
    projectId: PROJECT_ID,
  });
  const designSystems = response?.designSystems ?? [];

  if (designSystems.length === 0) {
    console.log("  no design systems found");
    return null;
  }

  const ds = designSystems[0];
  const assetId = ds.name?.split("/").pop() ?? "design-system";
  const designMd = ds.designSystem?.theme?.designMd;
  const displayName = ds.designSystem?.displayName ?? "Design System";

  const result = {
    title: displayName,
    assetId,
    name: ds.name,
  };

  if (designMd) {
    const mdPath = `${outDir}/design-system.md`;
    await writeFile(mdPath, designMd);
    result.mdPath = mdPath;
    console.log(`  design md: ${mdPath}`);
  } else {
    console.log("  design md: unavailable");
  }

  const jsonPath = `${outDir}/design-system.json`;
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        name: ds.name,
        version: ds.version,
        displayName,
        styleGuidelines: ds.designSystem?.styleGuidelines,
        theme: ds.designSystem?.theme,
      },
      null,
      2,
    ),
  );
  result.jsonPath = jsonPath;
  console.log(`  metadata: ${jsonPath}`);

  return result;
}

async function main() {
  const outDir = "./stitch-designs";
  await mkdir(outDir, { recursive: true });

  const project = stitch.project(PROJECT_ID);
  const fetched = [];

  for (const screenInfo of SCREENS) {
    fetched.push(await fetchScreen(project, screenInfo, outDir));
  }

  const designSystem = await fetchDesignSystem(outDir);

  await writeFile(
    `${outDir}/manifest.json`,
    JSON.stringify({ projectId: PROJECT_ID, projectTitle: "Intelligent Web App Designer", screens: fetched, designSystem }, null, 2),
  );

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
