import { Client, LatLngArray } from "@googlemaps/google-maps-services-js";
import { getRandomSeconds, getRandomUnixTimestamp, getTime25MinutesAgo } from "./utils.js";

type deliveryLocation = {
    coordinates: [number, number];
    orderTime: number;
    travelTime: number;
    deliveryTime: number;
    locationId: number;
    minPrep: number;
};

enum CardinalDirections {
    NE = "NE",
    NW = "NW",
    SE = "SE",
    SW = "SW",
}

type CardinalGroup = { [key in CardinalDirections]: deliveryLocation[] };

type TimeSortedCardinalGroup = {
    [key in CardinalDirections]: (deliveryLocation & { critical: boolean; timeRemaining: number })[];
};

const departureOrigin: [number, number] = [43.72326803815062, -79.41623650546069];

//deliveryLocation schema
//{location: [lat, long], orderTime: unix, departureTime: unix, id: string }

const deliveryLocations: deliveryLocation[] = [
    {
        coordinates: [43.73221793487148, -79.42894328403473],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 6,
        minPrep: 600,
    },
    {
        coordinates: [43.73028765458277, -79.42518438573987],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 7,
        minPrep: 600,
    },
    {
        coordinates: [43.72786827690832, -79.42073667195824],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 8,
        minPrep: 600,
    },
    {
        coordinates: [43.72279390175652, -79.41568081824905],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 9,
        minPrep: 600,
    },
    {
        coordinates: [43.72027950239434, -79.40789034608078],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 10,
        minPrep: 600,
    },
    {
        coordinates: [43.72495464990148, -79.40743697006518],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 11,
        minPrep: 600,
    },
    {
        coordinates: [43.73262080132046, -79.40221724948072],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 12,
        minPrep: 600,
    },
    {
        coordinates: [43.72828967956287, -79.39989760943432],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 13,
        minPrep: 600,
    },
    {
        coordinates: [43.72540986376909, -79.39532082240848],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 14,
        minPrep: 600,
    },
    {
        coordinates: [43.71869248685203, -79.39752658789466],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: 3000,
        locationId: 15,
        minPrep: 600,
    },
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

const groupLocationsByCardinalDirection = (locations: deliveryLocation[], center: [number, number]) => {
    const groups: CardinalGroup = { NE: [], NW: [], SE: [], SW: [] };

    for (let location of locations) {
        const { x, y } = convertGPSToCartesianWRTCenter({ location: location.coordinates, center });

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

const sortGroupsByTime = (groups: CardinalGroup): TimeSortedCardinalGroup => {
    //TODO:uncomment for prod
    // const currentTime = Math.floor(Date.now() / 1000);

    const currentTime = getTime25MinutesAgo();
    // let sortedGroup:CardinalGroup|null = null
    let sortedGroups: TimeSortedCardinalGroup | {} = {};
    console.log(currentTime);
    //    first sort items inside each group
    for (let i = 0; i <= Object.keys(groups).length; i++) {
        if (groups[Object.keys(groups)[i]]) {
            sortedGroups[Object.keys(groups)[i]] = groups[Object.keys(groups)[i]]
                .sort((locationA, locationB) => {
                    const remainingTimeForLocationA =
                        locationA.orderTime + locationA.deliveryTime - (currentTime + locationA.travelTime);
                    const remainingTimeForLocationB =
                        locationB.orderTime + locationB.deliveryTime - (currentTime + locationB.travelTime);
                    return remainingTimeForLocationA - remainingTimeForLocationB;
                })
                .map(location => {
                    const timeRemaining =
                        location.orderTime + location.deliveryTime - currentTime - location.travelTime;

                    return {
                        ...location,
                        critical: currentTime + location.travelTime >= location.orderTime + location.deliveryTime,
                        timeRemaining: timeRemaining,
                        direction: Object.keys(groups)[i],
                    };
                });
        }
    }

    return sortedGroups as TimeSortedCardinalGroup;
};

const sortByWaypoints = async (groups: TimeSortedCardinalGroup, departureOrigin: LatLngArray) => {
    const cardinalDirections = Object.keys(groups);
    let sortedGroups: TimeSortedCardinalGroup | {} = {};
    const client = new Client({});

    for (let i = 0; i < cardinalDirections.length; i++) {
        const criticalLocations = groups[cardinalDirections[i]]?.filter(location => location.critical) ?? [];
        const wayPointDepartureOrigin = criticalLocations?.slice(-1)[0]?.coordinates ?? departureOrigin;

        const deliveriesToWayPoint = groups[cardinalDirections[i]]?.filter(location => !location.critical);

        const locationsToWayPoint = deliveriesToWayPoint?.map(location => location.coordinates);

        if (locationsToWayPoint?.length > 1) {
            try {
                const wayPointResult = await client.directions({
                    params: {
                        //TODO: #security - remove api key for production
                        key: "AIzaSyB2pmyvWdxGDeuGpK6oG_eGLmUjrFqTgGE",
                        origin: wayPointDepartureOrigin,
                        destination: departureOrigin,
                        waypoints: locationsToWayPoint,
                        optimize: true,
                    },
                });

                const wayPointOrder = wayPointResult.data.routes[0].waypoint_order;

                console.log("waypoints optimized -> ", cardinalDirections[i], wayPointOrder);
                sortedGroups[cardinalDirections[i]] = criticalLocations.concat(
                    wayPointOrder.map(index => deliveriesToWayPoint[index])
                );
            } catch (e) {
                console.log("oops");
                throw new Error(e);
            }
        } else {
            sortedGroups[cardinalDirections[i]] = groups[cardinalDirections[i]];
        }
    }

    return sortedGroups;
};

const groupedLocation = groupLocationsByCardinalDirection(deliveryLocations, departureOrigin);

const sortedGroups = sortGroupsByTime(groupedLocation);
console.log(sortedGroups);
sortByWaypoints(sortedGroups, departureOrigin).then(result => {
    console.log(result);
});
