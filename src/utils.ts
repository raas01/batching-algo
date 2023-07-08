export const getRandomUnixTimestamp = () => {
    const randomOffset = Math.floor(Math.random() * 2700) + 1800; // Random offset between 1800 and 4500 seconds (30 minutes to 1 hour 15 minutes)
    const currentUnixTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
    return currentUnixTimestamp - randomOffset;
};

export const getTime25MinutesAgo = () => {
    const currentUnixTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
    const offsetSeconds = 25 * 60; // 25 minutes in seconds
    return currentUnixTimestamp - offsetSeconds;
};

export const getRandomSeconds = () => {
    return Math.floor(Math.random() * 1800) + 500; // Random value between 300 and 2100 seconds (5 to 35 minutes)
};
