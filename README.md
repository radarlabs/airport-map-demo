# Radar Airport Map Demo

This repository cotains a sample AngularJS app for redendering arced lines on a Radar Map.

[Live Demo](https://vkw2md-4200.csb.app/)

<img width="1000" alt="image" src="https://github.com/user-attachments/assets/0e85fbe3-389e-46ff-84ea-fd733c9f1d92" />



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
