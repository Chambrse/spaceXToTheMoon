var csv = require("csvtojson");
var fs = require('fs');
// Convert a csv file with csvtojson
csv()
  .fromFile('./3m_combined.csv')
  .then(function(jsonArrayObj){ //when parse finished, result will be emitted here.
    jsonArrayObj.forEach(element => {
        element['x-booster (km)'] = parseInt(element['x-booster (km)']);
        element['y-booster (km)'] = parseInt(element['y-booster (km)']);
        element['z-booster (km)'] = parseInt(element['z-booster (km)']);
        element['x-moon (km)'] = parseInt(element['x-moon (km)']);
        element['y-moon (km)'] = parseInt(element['y-moon (km)']);
        element['z-moon (km)'] = parseInt(element['z-moon (km)']);
        element['dateTime'] = parseInt((new Date(element.Date + " " + element.Time + " " + "+00:00").getTime() / 1000).toFixed(0));
    });
    fs.writeFile('3m_combined.json', JSON.stringify(jsonArrayObj), 'utf8', () => {});

    console.log(jsonArrayObj); 
   })