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
    redrawMap(geoA, geoB);

    var host = 'http://localhost:3000/';
    var query = '?origin=' + geoA.toUrlValue() + '&destination=' + geoB.toUrlValue();
    var modes = ['car', 'walk', 'transit'];
    for(var i=0; i<3; i++) {
      mode = modes[i];
      url = host + mode + query;
      getRoute(url, mode)}
  }
}

function getRoute(url, mode) {
  var routeBox = '#' + mode + '-info';

  $.ajax( {
    url: url,
    crossDomain: true,
    success: function(result) {
      var info;

      switch(mode) {
        case 'car':
          info = carInfo(result);
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

function redrawMap(geoA, geoB) {
  var a2b = [geoA, geoB];
  for(var i=0; i<2; i++) {
    new google.maps.Marker({
      position: a2b[i],
      map: map
    });
  }

  var latGeoC = (geoA.lat() + geoB.lat()) / 2;
  var lngGeoC = (geoA.lng() + geoB.lng()) / 2;

  var geoC = new google.maps.LatLng(latGeoC, lngGeoC);
  map.setCenter(geoC);
}

function carInfo(result) {
  var address = result['address'];

  var walk = result['itinerary']['walk'][0];
  var distance = walk['distance'];
  var duration = walk['duration']/60;

  var walkInfo = 'There\'s a car about ' + distance +  ' meters away at ' + address + ', about a ' + duration + ' minute walk. ';

  var drive = result['itinerary']['drive'][0];
  var distance = drive['distance'];
  var duration = drive['duration']/60;

  var driveInfo = 'From there, it\'s a ' + duration + ' minute drive to your destination.';

  return walkInfo + driveInfo;
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
