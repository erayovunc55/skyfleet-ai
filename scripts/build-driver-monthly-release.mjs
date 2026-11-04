import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [controllerPath, indexPath, assetsPath, outputPath] = process.argv.slice(2);
if (!controllerPath || !indexPath || !assetsPath || !outputPath) {
  throw new Error("Usage: node scripts/build-driver-monthly-release.mjs <live-controller> <live-index> <live-assets-dir> <output-dir>");
}
const hash = content => createHash("sha256").update(content).digest("hex");
const originalController = await readFile(controllerPath);
const originalIndex = await readFile(indexPath);
if (hash(originalController) !== "c602698c02552f7ebf486482b197b5035061a4e055a4f52eb87d9e5c67a07b84" ||
    hash(originalIndex) !== "417a141342c55c801874bd1865d7985dd23639a96c2a101aefa2d67c5c27e1a7") {
  throw new Error("Production baseline changed. Reconcile and test it before creating a release.");
}

const buildIndex = await readFile(path.join(root, "driver-app", "dist", "index.html"), "utf8");
const entry = buildIndex.match(/src="\/driver\/assets\/([^"]+\.js)"/)?.[1];
if (!entry) throw new Error("Build the driver app before packaging the release.");
const source = await readFile(path.join(root, "backend", "app", "Http", "Controllers", "Api", "DriverController.php"), "utf8");
const monthlyBlock = source.match(/        \$timezone = \$user->supplierCompany->timezone[\s\S]*?            ->count\(\);/)?.[0];
if (!monthlyBlock || !monthlyBlock.includes("$completedThisMonth = Transfer::query()")) {
  throw new Error("Approved monthly controller block was not found.");
}
const scopedBlock = monthlyBlock.replace(
  "$completedThisMonth = Transfer::query()",
  "$completedThisMonth = Transfer::query()\n            ->driverOperations($user)\n            ->visibleInDriverHistory()",
);
let controller = originalController.toString("utf8");
const insertion = "        return response()->json([\n            'data' => [\n                'assigned' => $assigned,";
if (controller.split(insertion).length !== 2) throw new Error("Ambiguous dashboard insertion point.");
controller = controller
  .replace("use App\\Models\\Transfer;", "use App\\Models\\Transfer;\nuse Carbon\\CarbonImmutable;")
  .replace(insertion, `${scopedBlock}\n\n${insertion}\n                'completedThisMonth' => $completedThisMonth,`);

const bootstrapName = "guest-bootstrap-3fa0b00d285f.js";
const bootstrap = await readFile(path.join(assetsPath, bootstrapName), "utf8");
const oldImport = 'import("/driver/assets/index-dHlMVI5Y.js")';
if (bootstrap.split(oldImport).length !== 2 ||
    !bootstrap.includes('/driver/assets/guest-BrcKhPYe.js') ||
    !bootstrap.includes('/driver/assets/guest-DVRwCM5o.css')) {
  throw new Error("Guest bootstrap changed. Preserve and revalidate its current behavior.");
}
const newBootstrap = bootstrap.replace(oldImport, `import("/driver/assets/${entry}")`);
const newBootstrapName = `guest-bootstrap-monthly-${hash(newBootstrap).slice(0, 12)}.js`;
const oldScript = `/driver/assets/${bootstrapName}`;
const index = originalIndex.toString("utf8");
if (index.split(oldScript).length !== 2) throw new Error("Unexpected production driver entrypoint.");
const newIndex = index.replace(oldScript, `/driver/assets/${newBootstrapName}`);

await mkdir(outputPath);
await mkdir(path.join(outputPath, "assets"));
await cp(path.join(root, "driver-app", "dist", "assets"), path.join(outputPath, "assets"), { recursive: true });
await writeFile(path.join(outputPath, "assets", newBootstrapName), newBootstrap);
await writeFile(path.join(outputPath, "index.html"), newIndex);
await writeFile(path.join(outputPath, "DriverController.php"), controller);
const protectedFiles = [bootstrapName, "index-dHlMVI5Y.js", "index-B41wI7XD.css", "guest-BrcKhPYe.js", "guest-DVRwCM5o.css"];
const protectedHashes = {};
for (const file of protectedFiles) protectedHashes[file] = hash(await readFile(path.join(assetsPath, file)));
await writeFile(path.join(outputPath, "manifest.json"), JSON.stringify({
  driverEntry: entry,
  bootstrap: newBootstrapName,
  originalController: hash(originalController),
  originalIndex: hash(originalIndex),
  controller: hash(controller),
  index: hash(newIndex),
  protectedFiles: protectedHashes,
  databaseChanges: false,
}, null, 2));
console.log(`Release packaged in ${outputPath}. Existing guest assets and stylesheet must remain unchanged.`);
