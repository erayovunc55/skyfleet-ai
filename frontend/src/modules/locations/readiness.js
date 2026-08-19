export function calculateLocationReadiness(item = {}) {
  const isAirport = String(item?.type?.code || "").toLowerCase() === "airport";
  const terminals = Number(item?.airport?.terminals_count || 0);
  const pickup = Number(item?.pickup_points_count || 0);
  const dropoff = Number(item?.dropoff_points_count || 0);
  const totalPoints = Number(item?.operational_points_count || 0);
  const mappedPoints = Number(item?.mapped_points_count || 0);
  const geofence = Number(item?.geofence_radius_meters || 0);

  const checks = {
    terminal: !isAirport || terminals > 0,
    pickup: pickup > 0,
    dropoff: dropoff > 0,
    geofence: geofence > 0,
    mapped: totalPoints > 0 && mappedPoints >= totalPoints,
  };

  const weights = {
    terminal: 20,
    pickup: 25,
    dropoff: 20,
    geofence: 15,
    mapped: 20,
  };

  const score = Object.entries(weights).reduce(
    (total, [key, weight]) => total + (checks[key] ? weight : 0),
    0
  );

  const level = score >= 85 ? "ready" : score >= 50 ? "partial" : "setup";

  return { score, level, checks };
}
