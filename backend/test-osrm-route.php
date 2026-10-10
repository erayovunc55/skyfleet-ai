<?php

$pickupLng = 28.9826056;
$pickupLat = 41.0374108;

$dropoffLng = 28.7050148;
$dropoffLat = 41.2628732;

$url =
    "https://router.project-osrm.org/route/v1/driving/" .
    "{$pickupLng},{$pickupLat};{$dropoffLng},{$dropoffLat}" .
    "?overview=full&geometries=geojson&steps=false";

$context = stream_context_create([
    'http' => [
        'timeout' => 20,
        'header' =>
            "User-Agent: SkyfleetRouteTest/1.0\r\n" .
            "Accept: application/json\r\n",
    ],
]);

$json = file_get_contents(
    $url,
    false,
    $context
);

if ($json === false) {
    echo "OSRM REQUEST FAILED" . PHP_EOL;
    exit(1);
}

$data = json_decode(
    $json,
    true
);

$geometry =
    $data['routes'][0]['geometry']['coordinates']
    ?? [];

$result = [
    'code' =>
        $data['code'] ?? null,

    'routes_count' =>
        count($data['routes'] ?? []),

    'geometry_points' =>
        count($geometry),

    'distance_km' =>
        isset($data['routes'][0]['distance'])
            ? round(
                $data['routes'][0]['distance'] / 1000,
                2
            )
            : null,

    'duration_minutes' =>
        isset($data['routes'][0]['duration'])
            ? round(
                $data['routes'][0]['duration'] / 60,
                1
            )
            : null,

    'first_points' =>
        array_slice(
            $geometry,
            0,
            5
        ),

    'last_points' =>
        array_slice(
            $geometry,
            -5
        ),
];

print_r($result);