const AdmZip = require("adm-zip");
const fs = require("fs");

const zip = new AdmZip();
zip.addLocalFolder("dist");
zip.writeZip("batchingAlgo.zip", (error) => {
    if (error) {
        console.error("Error compressing the directory:", error);
        process.exit(1);
    }
    console.log("Compression completed successfully.");
});
