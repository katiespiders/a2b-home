$(document).ready(function() {
  var map = loadMap();

  $("#submit").click(function(event) {

    event.preventDefault();

    var addressA = $("#pointA").val() + ' Seattle';
    var addressB = $("#pointB").val() + ' Seattle';

    var geocoder = new google.maps.Geocoder();
    var geoA, geoB;

    geocoder.geocode(
      { 'address': addressA },
      function(results, status) {
        geoA = results[0].geometry.location;
        callAPI(geoA, geoB);
      }
    );

    geocoder.geocode(
      { 'address': addressB },
      function(results, status) {
        geoB = results[0].geometry.location;
        callAPI(geoA, geoB);
      }
    );
  });
});

function callAPI(geoA, geoB) {
  if(!geoA || !geoB) { return false; }
  else {
    placePins(geoA, geoB);
    redrawMap(geoA, geoB);

    var host = 'http://localhost:3000/';
    var query = '?origin=' + geoA.toUrlValue() + '&destination=' + geoB.toUrlValue();

    var car = host + 'car' + query;
    getRoute(car, 'car', geoA, geoB);

    // var transit = host + 'transit' + query;
    // getRoute(transit, 'transit', geoA, geoB);

    getWalk(geoA, geoB);
  }
}

function getRoute(url, mode, geoA, geoB) {
  var routeBox = '#' + mode + '-info';

  $.ajax( {
    url: url,
    crossDomain: true,
    success: function(result) {
      var info;

      switch(mode) {
        case 'car':
          info = carInfo(result, geoA, geoB);
          break;
        case 'transit':
          info = transitInfo(result);
          break;
      }

      $(routeBox).html(info);
    },
    error: function(http) { $(routeBox).html(http.responseText); }
  });
}

function placePins(geoA, geoB) {
  new google.maps.Marker({
    position: geoA,
    map: map,
    icon: 'http://maps.gstatic.com/mapfiles/markers2/marker_greenA.png'
  });

  new google.maps.Marker({
    position: geoB,
    map: map,
    icon: 'http://maps.gstatic.com/mapfiles/markers2/markerB.png'
  });
}

function redrawMap(geoA, geoB) {
  var latA = geoA.lat();
  var latB = geoB.lat();
  var lngA = geoA.lng();
  var lngB = geoB.lng();

  var north = Math.max(latA, latB);
  var south = Math.min(latA, latB);
  var east = Math.max(lngA, lngB);
  var west = Math.min(lngA, lngB);

  var paddingNS = (north - south) / 48;
  var paddingEW = (east - west) / 48;

  var boundNE = new google.maps.LatLng(north + paddingNS, east + paddingEW);
  var boundSW = new google.maps.LatLng(south + paddingNS, west + paddingEW);
  var bounds = new google.maps.LatLngBounds(boundSW, boundNE);
  map.fitBounds(bounds);
}

function carInfo(result, geoA, geoB) {
  var coords = result['coordinates'];
  var address = result['address'];
  var carPosition = new google.maps.LatLng(coords['lat'], coords['long']);
  new google.maps.Marker({
    position: carPosition,
    map: map,
    icon: 'http://maps.gstatic.com/mapfiles/kml/pal4/icon23.png'
  });

  var planner = new google.maps.DirectionsService();

  var $routeBox = $('#car-info');
  var $verbiageBox = $('#verbiage');

  planner.route(
    { origin: geoA,
      destination: carPosition,
      travelMode: google.maps.TravelMode.WALKING
    },
    function(results, status) {
      var firstRoute = results['routes'][0];
      var directions = firstRoute['legs'][0];
      var duration = directions['duration']['text'];
      var distance = directions['distance']['text'];

      $routeBox.append('The nearest car is around ' + address + ', a ' + distance + ' (about ' +  duration + ') walk away.');
      $verbiageBox.append(firstRoute['warnings'][0]);
      $verbiageBox.append(' ' + firstRoute['copyrights']);

      renderDirections(directions, $routeBox);
      drawRoute(directions['steps'], map);
    });

  planner.route(
    { origin: carPosition,
      destination: geoB,
      travelMode: google.maps.TravelMode.DRIVING
    },
    function(results, status) {
      var directions = results['routes'][0]['legs'][0];
      var duration = directions['duration']['text'];
      var distance = directions['distance']['text'];

      $routeBox.append('After you pick up the car, it\'s about a ' + duration + ' minute drive:');

      renderDirections(directions, $routeBox);
      drawRoute(directions['steps'], map);
    });
};

function getWalk(geoA, geoB) {
  var planner = new google.maps.DirectionsService();

  var $routeBox = $('#walk-info');

  planner.route(
    { origin: geoA,
      destination: geoB,
      travelMode: google.maps.TravelMode.WALKING
    },
    function(results, status) {
      var firstRoute = results['routes'][0];
      var directions = firstRoute['legs'][0];
      var duration = directions['duration']['text'];
      var distance = directions['distance']['text'];

      $routeBox.append('It\'s a ' + distance + ' (about ' + duration + ') walk.');

      renderDirections(directions, $routeBox);
      drawRoute(directions['steps'], map);
    }
  );
};

function transitInfo(result) {
  var trip = result['directions'][0];
  var legs = trip['legs'];
  var instructions = '';

  for(var i=0; i<legs.length; i++)
    { instructions += (legs[i]['instructions'] + ' '); }

  return instructions;
}

function renderDirections(route, routeBox) {
  var steps = route['steps'];

  routeBox.append('<ol>');
  for(var i=0; i<steps.length; i++) {
    routeBox.append('<li>' + steps[i]['instructions'] + '</li>');
  }
  routeBox.append('</ol>');
}

function drawRoute(stepArray, map) {
  for(var i=0; i<stepArray.length; i++) {
   drawPolyline(stepArray[i]['polyline']['points'], map);
  }
}

function drawPolyline(encodedPoints, map) {
  var decodedPoints = google.maps.geometry.encoding.decodePath(encodedPoints);
  var line = new google.maps.Polyline( { path: decodedPoints } );
  line.setMap(map);
}

function loadMap() {
  var mapOptions = {
    center: { lat: 47.6097, lng: -122.3331 },
    zoom: 11
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
  return map;
}
