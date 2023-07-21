const AWS = require("aws-sdk");

function getCurrentlyConfiguredProfile() {
    const awsConfig = new AWS.Config();
    return awsConfig.credentials?.profile?.trim() || null;
}

function checkProfile() {
    const configuredProfile = getCurrentlyConfiguredProfile();

    const profileToCheck = "dms-orchestrator"; // Replace with the profile you want to check
    if (!configuredProfile || configuredProfile !== profileToCheck) {
        console.error(
            `Currently configured AWS CLI profile "${configuredProfile}" does not match the deployment profile "${profileToCheck}". Deployment aborted.`
        );
        process.exit(1);
    }

    console.log(`Using profile "${profileToCheck}" for deployment.`);
}

checkProfile();
