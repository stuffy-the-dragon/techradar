Build Your Own Technology Radar.

Inspired by the ThoughtWorks Tech Radar: http://www.thoughtworks.com/radar/.

I love the ThoughtWorks Radar. But it is for all clients, averaged out across industries, organisational maturity and risk adverseness.

![Technology Radar Sample](/techradar_example.png?raw=true)

It is a powerful talking point, but I need it to be customised for particular circumstances.

This Technology Radar has pretty simple functionality, uses excel spreadsheet and renders SVG within html.

A sample spreadsheet is provided. The blips are automatically layed out accoriding to their stage and quadrant.
Some more options can be changed in the radarData.js file. If the quadrant or stage names are changed in the spreadsheet they should also be updated in the radarData.js file.

Internally polar coordinates are used to position the blips with 0 degrees starting in the east position.

See http://en.wikipedia.org/wiki/Polar_coordinates for more details.
