const fs = require("fs");

describe("Main Tests", () => {
  it("Node >=14", () => {
    const nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
    expect(nodeVersion).toBeGreaterThanOrEqual(14);
  });
  it("does not modify required dependencies", () => {
    const pkgJSON = require("./package.json");
    // expect(...). contains
    // console.log(pkgJSON.dependencies)
    const isOk = Boolean(
      pkgJSON.dependencies["blessed"] && pkgJSON.dependencies["ssh2"]
    );
    expect(isOk).toEqual(true);
  });
  it("Folder has a host key (must be tested before commit)", () => {
    const hasHostKey = fs.existsSync("./host.key");
    expect(hasHostKey).toEqual(true);
  });
});
