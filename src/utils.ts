export const getRandomUnixTimestamp = () => {
    const randomOffset = Math.floor(Math.random() * 3600); // Random offset between 0 and 3600 seconds (1 hour)
    const currentUnixTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
    return currentUnixTimestamp - randomOffset;
};

export const getRandomSeconds = () => {
    return Math.floor(Math.random() * 1800) + 500; // Random value between 300 and 2100 seconds (5 to 35 minutes)
};
