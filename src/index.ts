import { Client, LatLng, LatLngArray } from "@googlemaps/google-maps-services-js";
import { getRandomSeconds, getRandomUnixTimestamp } from "./utils.js";

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

type TimeSortedCardinalGroup = { [key in CardinalDirections]: (deliveryLocation & { critical: boolean })[] };

const departureOrigin: [number, number] = [43.72326803815062, -79.41623650546069];

//deliveryLocation schema
//{location: [lat, long], orderTime: unix, departureTime: unix, id: string }

const deliveryLocations: deliveryLocation[] = [
    {
        coordinates: [43.72947321185097, -79.43105726030298],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: getRandomSeconds(),
        minPrep: 600,
        locationId: 1,
    },
    {
        coordinates: [43.72706454609497, -79.42686694839242],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: getRandomSeconds(),
        locationId: 2,
        minPrep: 600,
    },
    {
        coordinates: [43.72145778073365, -79.42249100553528],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: getRandomSeconds(),
        locationId: 3,
        minPrep: 600,
    },
    {
        coordinates: [43.717581825336005, -79.40364474046002],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: getRandomSeconds(),
        locationId: 4,
        minPrep: 600,
    },
    {
        coordinates: [43.72620026835138, -79.40436323681135],
        orderTime: getRandomUnixTimestamp(),
        travelTime: getRandomSeconds(),
        deliveryTime: getRandomSeconds(),
        locationId: 5,
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

    const currentTime = getRandomUnixTimestamp();
    // let sortedGroup:CardinalGroup|null = null
    let sortedGroups: TimeSortedCardinalGroup | {} = {};
    //    first sort items inside each group
    for (let i = 0; i <= Object.keys(groups).length; i++) {
        if (groups[Object.keys(groups)[i]]) {
            sortedGroups[Object.keys(groups)[i]] = groups[Object.keys(groups)[i]]
                .sort((locationA, locationB) => {
                    const timeA = locationA.orderTime + locationA.deliveryTime - (currentTime + locationA.travelTime);
                    const timeB = locationB.orderTime + locationB.deliveryTime - (currentTime + locationB.travelTime);
                    return timeA - timeB;
                })
                .map(location => ({
                    ...location,
                    critical: currentTime + location.travelTime > location.orderTime + location.deliveryTime,
                    direction: Object.keys(groups)[i],
                }));
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

        if (locationsToWayPoint?.length>1) {
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

                // console.log(wayPointOrder);

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

sortByWaypoints(sortedGroups, departureOrigin).then(result => {
    console.log(result);
});
