import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import Radar from 'radar-sdk-js';
import { AddLayerObject, LngLatLike } from 'maplibre-gl';
import type {
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  LineString,
  Feature,
  MultiLineString,
} from 'geojson';
import { featureCollection } from '@turf/helpers';
import { greatCircle } from '@turf/turf'; // <-- USED FOR ARC DRAWING

import airports from '../data/airports.json';
import { generateRoutes } from './utils/routeGenerator';


// import CSS
import 'radar-sdk-js/dist/radar.css';


declare global {
  interface Window {
    setDestination: () => void;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  ngOnInit() {
    Radar.initialize('YOUR_RADAR_API_KEY_HERE');

    // This is the source destination on the map
    const atlantaAirport = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-84.428101, 33.6367],
      },
      properties: {
        id: 3384,
        ident: 'KATL',
        type: 'large_airport',
        name: 'Hartsfield Jackson Atlanta International Airport',
        elevation_ft: 1026.0,
        continent: 'NA',
        country_name: 'United States',
        iso_country: 'US',
        region_name: 'Georgia',
        iso_region: 'US-GA',
        local_region: 'GA',
        municipality: 'Atlanta',
        scheduled_service: true,
        gps_code: 'KATL',
        icao_code: 'KATL',
        iata_code: 'ATL',
        local_code: 'ATL',
        home_link: 'http://www.atlanta-airport.com/',
        wikipedia_link:
          'https://en.wikipedia.org/wiki/Hartsfield\u2013Jackson_Atlanta_International_Airport',
        keywords: '',
        score: 2002475,
        last_updated: '2024-04-02T16:26:01+00:00',
      },
    };

    // initialize map
    const map = Radar.ui.map({
      container: 'map-container',
      center: [-73.99055, 40.735225],
      zoom: 2,
      // cooperativeGestures: true, <-- set this do disable zoom on scrolling
    });

    // custom HTML for marker
    const markerContainer = document.createElement('div');
    markerContainer.style.display = 'flex';
    markerContainer.style.alignItems = 'center';
    markerContainer.style.gap = '5px';
    markerContainer.style.height = '10px';
    markerContainer.style.padding = '8px';
    markerContainer.style.border = 'solid white 2px';
    markerContainer.style.background = '#051434';
    markerContainer.style.color = 'white';
    markerContainer.style.borderRadius = '100px';

    const markerImg = document.createElement('img');
    markerImg.src = '/assets/images/delta_circle.png';
    markerImg.style.height = '15px';
    markerImg.style.width = '15px';

    const markerText = document.createElement('p');
    markerText.textContent = atlantaAirport.properties.iata_code;

    markerContainer.appendChild(markerImg);
    markerContainer.appendChild(markerText);

    const startMarker = Radar.ui
      .marker({
        element: markerContainer,
      })
      .setLngLat(atlantaAirport.geometry.coordinates as LngLatLike)
      .addTo(map);

    const destContainer = document.createElement('div');
    destContainer.style.display = 'flex';
    destContainer.style.alignItems = 'center';
    destContainer.style.gap = '5px';
    destContainer.style.height = '10px';
    destContainer.style.padding = '8px';
    destContainer.style.border = 'solid white 2px';
    destContainer.style.background = '#2F70A8';
    destContainer.style.color = 'white';
    destContainer.style.borderRadius = '100px';

    const destImage = document.createElement('img');
    destImage.src = '/assets/images/delta_circle.png';
    destImage.style.height = '15px';
    destImage.style.width = '15px';

    const destText = document.createElement('p');
    destText.textContent = atlantaAirport.properties.iata_code;

    destContainer.appendChild(destImage);
    destContainer.appendChild(destText);

    const destMarker = Radar.ui.marker({
      element: destContainer,
    });

    const popup = Radar.ui.popup({
      closeOnClick: false,
      anchor: 'bottom',
    });

    map.on('load', async () => {

      // load images into the map so they can be used as icons in a layer
      const deltaIcon = await map.loadImage('/assets/images/delta_circle.png');
      map.addImage('delta_circle', deltaIcon.data);

      // add GeoJSON source to map
      map.addSource('airports', {
        type: 'geojson',
        data: airports as FeatureCollection<Geometry, GeoJsonProperties>,
      });

      // add layers that target the GeoJSON source
      const layers = [
        {
          id: 'airports',
          type: 'circle',
          source: 'airports',
          paint: { // blue circles on map
            'circle-radius': 4,
            'circle-color': '#2F70A8',
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': 1,
          },
          filter: ['!', ['has', 'hub']],
        },
        {
          id: 'airport_hubs',
          source: 'airports',
          filter: ['==', ['get', 'hub'], true],
          type: 'symbol',
          layout: { // use the loaded delta circle icon
            'icon-image': 'delta_circle',
            'icon-size': 0.1,
          },
        },
      ];

      let destinationAirport: any = undefined;

      layers.forEach((layer) => {
        map.addLayer(layer as AddLayerObject);

        map.on('mouseenter', layer.id, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layer.id, () => {
          map.getCanvas().style.cursor = '';
        });

        // handle click on a data point
        map.on('mousedown', layer.id, (e) => {
          if (e?.features?.length && e?.features?.length > 0) {
            const feature = e.features[0];

            if (feature.geometry.type === 'Point') {
              const coords = feature.geometry.coordinates;

              window.setDestination = function () {
                destinationAirport = feature;

                popup.setOffset(15);
                destText.textContent = destinationAirport.properties['iata_code'];

                if (destinationAirport.geometry.type === 'Point') {
                  destMarker
                    .setLngLat(
                      destinationAirport.geometry.coordinates as LngLatLike
                    )
                    .addTo(map);
                }

                // fit the map to the source & destination
                map.fitToMarkers({ padding: 300 }, [startMarker, destMarker]);

                const lines: Feature<LineString | MultiLineString, GeoJsonProperties>[] = [];

                // ====================== CODE TO GENERATE ARCED LINE STARTS HERE =====================

                // generate random routes between source (Atlanta) and the selected destination
                const flights = generateRoutes(atlantaAirport, feature);
                flights.forEach((flight) => {
                  for (let i = 0; i < flight.length - 1; i++) {
                    const start = flight[i];
                    const end = flight[i + 1];

                    const partnerAirline = Math.random() < 0.3; // randomly generate whether or not partner airline

                    // use greatCircle to create arc between two points
                    const geodesicLine = greatCircle(
                      start.geometry.coordinates,
                      end.geometry.coordinates,
                    );
                    geodesicLine.properties = { partnerAirline };
                    lines.push(geodesicLine);
                  }
                });

                // remove any existing line layers before re-drawing
                if (map.getLayer('geodesic-lines-layer')) {
                  map.removeLayer('geodesic-lines-layer');
                }
                if (map.getLayer('geodesic-lines-partner-layer')) {
                  map.removeLayer('geodesic-lines-partner-layer');
                }
                if (map.getSource('geodesic-lines')) {
                  map.removeSource('geodesic-lines');
                }

                // create a new GeoJSON source from the arc lines
                const lineFeatures = featureCollection(lines);
                map.addSource('geodesic-lines', {
                  type: 'geojson',
                  data: lineFeatures,
                });

                // create new layers that targets the GeoJSON source

                // SOLID LINE
                map.addLayer({
                  id: 'geodesic-lines-layer',
                  type: 'line',
                  source: 'geodesic-lines',
                  paint: {
                    'line-color': 'black',
                    'line-width': 1,
                  },
                  filter: ['==', ['get', 'partnerAirline'], false],
                });

                // DASHED LINE
                map.addLayer({
                  id: 'geodesic-lines-partner-layer',
                  type: 'line',
                  source: 'geodesic-lines',
                  paint: {
                    'line-color': 'black',
                    'line-width': 1.5,
                    'line-dasharray': [4, 4], // [dash length, gap length]
                  },
                  filter: ['==', ['get', 'partnerAirline'], true],
                });
                map.moveLayer('geodesic-lines-layer', 'airports');
                map.moveLayer('geodesic-lines-partner-layer', 'airports');

                // ====================== CODE TO GENERATE ARCED LINE STARTS HERE =====================
              };

              popup
                .setLngLat(coords as LngLatLike)
                .setHTML(
                  `
                      <img src="/assets/images/${
                        Math.floor(Math.random() * 11) + 1
                      }.jpg" width="250" height="150" style="object-fit: cover; filter: brightness(80%);">
                      <strong style="
                        color: white;
                        width: 250px;
                        position: absolute;
                        left: 20px;
                        top: 100px;
                        font-size: medium;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        text-align: left;
                      ">${feature.properties['municipality']}, ${
                    feature.properties['country_name']
                  }</strong>

                      <strong style="
                        color: white;
                        width: 250px;
                        position: absolute;
                        left: 20px;
                        top: 120px;
                        font-size: small;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        text-align: left;
                      ">${feature.properties['name']}</strong>
                      <strong
                        onclick="setDestination()"
                        style="cursor: pointer;">
                        View Details
                      </strong>
                      `
                )
                .setOffset(8)
                .setMaxWidth('270px')
                .addTo(map);

              if (
                feature.properties['iata_code'] === 'ATL' ||
                feature.properties['iata_code'] ===
                  destinationAirport?.properties.iata_code
              ) {
                popup.setOffset(15);
              }
            }
          }
        });
      });
    });
  }
}
