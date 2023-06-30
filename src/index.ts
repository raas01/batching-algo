type deliveryLocation = { location: [number, number]; orderTime: number; prepTime: number; id: number };

const departureOrigin: [number, number] = [43.78306497973275, -79.39129673339313];

const deliveryLocations: deliveryLocation[] = [
    { location: [43.783718721409336, -79.39110768325116], orderTime: 0, prepTime: 0, id: 1 },
    { location: [43.769314076734275, -79.38508187058218], orderTime: 0, prepTime: 0, id: 2 },
    { location: [43.80570802348434, -79.37984689185826], orderTime: 0, prepTime: 0, id: 3 },
    { location: [43.79841905309967, -79.39163729406775], orderTime: 0, prepTime: 0, id: 4 },
    { location: [43.79097982424352, -79.4036487103881], orderTime: 0, prepTime: 0, id: 5 },
    { location: [43.78897442561237, -79.40774803349144], orderTime: 0, prepTime: 0, id: 6 },
    { location: [43.76387162621909, -79.41290367410582], orderTime: 0, prepTime: 0, id: 7 },
    { location: [43.75444135125813, -79.41531518710218], orderTime: 0, prepTime: 0, id: 8 },
];
const convertGPSToCartesianWRTCenter = ({ location, center }: { [key in "location" | "center"]: [number, number] }) => {
    //radius of earth in meters
    const R = 6371000;

    //step 1: convert all coordinates to positive degrees
    const centerPositive = center.map(angle => (angle < 0 ? angle + 360 : angle));
    const locationPositive = location.map(angle => (angle < 0 ? angle + 360 : angle));

    //step 2 : convert each to cartesian coordinates
    const centerCartesian = centerPositive.map(angle => (angle * 2 * Math.PI * R) / 360);
    const locationCartesian = locationPositive.map(angle => (angle * 2 * Math.PI * R) / 360);

    //step 3: find the difference between the two points
    const latDiff = locationCartesian[0] - centerCartesian[0];
    const lonDiff = locationCartesian[1] - centerCartesian[1];

    return { x: lonDiff / 1000, y: latDiff / 1000 };
};

const groupLocationsByCordinalDirection = (locations: deliveryLocation[], center: [number, number]) => {
    const groups: { [key in "NE" | "NW" | "SE" | "SW"]: deliveryLocation[] } = { NE: [], NW: [], SE: [], SW: [] };

    for (let location of locations) {
        const { x, y } = convertGPSToCartesianWRTCenter({ location: location.location, center });

        if (x >= 0 && y >= 0) {
            groups.NE.push(location);
        } else if (x >= 0 && y < 0) {
            groups.SE.push(location);
        } else if (x < 0 && y >= 0) {
            groups.NW.push(location);
        } else if (x < 0 && y < 0) {
            groups.SW.push(location);
        }
    }

    return groups;
};

const groupedLocation = groupLocationsByCordinalDirection(deliveryLocations, departureOrigin);

console.log(groupedLocation);
