import { distance } from '@turf/turf';

// mock airport data
import airports from '../../data/airports.json';

////////////////////////////////////////////////////
// This file is used to generate random flight
// routes between airports when clicked on the map
////////////////////////////////////////////////////

// for a given source & destination, generate random flight routes
export function generateRoutes(start: any, dest: any) {
  const routes: any[] = [];

  if (dest === start) return [];

  if (Math.random() < 0.5) {
    routes.push([start, dest]);
  }

  for (const middle  of (airports.features as any)) {
    if (Math.random() < 0.03 && middle !== start && dest !== middle) {
      const startDistance = distance(start.geometry, middle.geometry);
      const endDistance   = distance(middle.geometry, dest.geometry);
      const totalDistance = distance(start.geometry, dest.geometry);

      if (
        startDistance < Math.min(2000, totalDistance) ||
        endDistance < Math.min(2000, totalDistance)
      ) {
        routes.push([start, middle, dest]);
      }
    }
  }
  return routes;
}
