# Radar Airport Map Demo

This repository cotains a sample AngularJS app for redendering arced lines on a Radar Map.

[Live Demo](https://vkw2md-4200.csb.app/)

## Usage

First, add your Radar Publishable API Key to the code where it says `YOUR_RADAR_API_KEY_HERE`
```js
export class AppComponent implements OnInit {
  ngOnInit() {
    Radar.initialize('YOUR_RADAR_API_KEY_HERE');
    ...
```

Then install dependnecines
```
npm install
```

And start the local server
```
npm run start
```

It should be running at [http://localhost:4200/](http://localhost:4200/)
