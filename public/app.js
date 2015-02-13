$(document).ready(function() {
  var map;
  loadMap();

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
    var modes = ['car', 'walk', 'transit'];
    for(var i=0; i<3; i++) {
      mode = modes[i];
      url = host + mode + query;
      getRoute(url, mode, geoA, geoB)}
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
        case 'walk':
          info = walkInfo(result);
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
  var a2b = [geoA, geoB];
  for(var i=0; i<2; i++) {
    new google.maps.Marker({
      position: a2b[i],
      map: map
    });
  }
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
  coords = result['coordinates'];
  carPosition = new google.maps.LatLng(coords['lat'], coords['long']);

  new google.maps.Marker({
    position: carPosition,
    map: map
  });

  var planner = new google.maps.DirectionsService();
  var renderer = new google.maps.DirectionsRenderer();
  renderer.setMap(map);

  planner.route(
    { origin: geoA,
      destination: carPosition,
      travelMode: google.maps.TravelMode.WALKING,
      provideRouteAlternatives: false
    },
    function(result, status) {
      renderer.setDirections(result);
      renderer.setPanel(document.getElementById('car-info'));
  });

  planner.route(
    { origin: carPosition,
      destination: geoB,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true
    },
    function(result, status) {
      renderer.setDirections(result);
    });
};

function walkInfo(result) {
  return 'It\'s a ' + result['duration'] / 60 + ' minute walk.'
};

function transitInfo(result) {
  var trip = result['directions'][0];
  var legs = trip['legs'];
  var instructions = '';

  for(var i=0; i<legs.length; i++)
    { instructions += (legs[i]['instructions'] + ' '); }

  return instructions;
}

function capitalize(str) {
  return str[0].toUpperCase(); + str.slice(1).toLowerCase();
}

function loadMap() {
  var mapOptions = {
    center: { lat: 47.6097, lng: -122.3331 },
    zoom: 11
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
}
