var overlays = [];

$(document).ready(function() {
  loadMap();

  $('#clear').click(function(event) {
    event.preventDefault();

    clearBoxes();
    clearOverlays();
    resetMap();
    $('#pointA').val('');
    $('#pointB').val('');
  });

  $('#submit').click(function(event) {

    event.preventDefault();
    clearBoxes();
    clearOverlays();
    $('.loader').toggle(true);

    var addressA = $('#pointA').val() + ' Seattle';
    var addressB = $('#pointB').val() + ' Seattle';

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
    placePins(geoA, geoB);

    var host = 'http://api.seattle-a2b.com/'; //'http://localhost:3000/';
    var query = '?origin=' + geoA.toUrlValue() + '&destination=' + geoB.toUrlValue();

    var car = host + 'car' + query;
    getRoute(car, 'car', geoA, geoB);

    var transit = host + 'transit' + query;
    getRoute(transit, 'transit', geoA, geoB);

    getWalk(geoA, geoB);
  }
}

function getRoute(url, mode, geoA, geoB) {
  var routeBoxName = '#' + mode + '-info';
  var $routeBox = $(routeBoxName);
  var $loaderBox = $routeBox.siblings('.loader');

  $.ajax( {
    url: url,
    crossDomain: true,
    success: function(result) {
      $loaderBox.toggle(false);
      switch(mode) {
        case 'car':
          getCar(result, geoA, geoB);
          break;
        case 'transit':
          getTransit(result);
          break;
      }
    },
    error: function(http) { $(routeBoxName).html(http.responseText); }
  });
}

function getCar(result, geoA, geoB) {
  var nearest = result[0];
  var coords = nearest['coordinates'];
  var address = nearest['address'];
  var carPosition = new google.maps.LatLng(coords[0], coords[1]);
  overlays.push(new google.maps.Marker({
    position: carPosition,
    map: map,
    icon: 'http://maps.gstatic.com/mapfiles/kml/pal4/icon54.png'
  }));

  var planner = new google.maps.DirectionsService();

  var $verbiageBox = $('#verbiage');
  var $infoBox = $('#car-info');
  $infoBox.toggle(true);

  planner.route(
    { origin: geoA,
      destination: carPosition,
      travelMode: google.maps.TravelMode.WALKING
    },
    function(results, status) {
      var route = results['routes'][0];
      var directions = route['legs'][0];
      var duration = directions['duration']['text'];
      var distance = directions['distance']['text'];

      var verbiage = route['warnings'][0] + ' ' + route['copyrights'];
      $verbiageBox.html(verbiage);

      var $walkBox = $('#car-walk');
      $walkBox.toggle(true);
      var $walkSummary = $walkBox.children('.summary');

      $walkSummary.append('The nearest car is around ' + address + ', a ' + distance + ' (about ' +  duration + ') walk away.');
      appendDirections(directionsHTML(directions), ['show walking directions', 'hide walking directions'], $walkBox)

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

      var $driveBox = $('#car-drive');
      $driveBox.toggle(true)
      var $driveSummary = $driveBox.children('.summary');

      $driveSummary.append('After you pick up the car, it\'s about a ' + duration + ' minute drive:');

      appendDirections(directionsHTML(directions), ['show driving directions', 'hide driving directions'], $driveBox);
      drawRoute(directions['steps'], map);
    });
};

function getWalk(geoA, geoB) {
  var planner = new google.maps.DirectionsService();

  var $routeBox = $('#walk-info');
  var $summaryBox = $routeBox.children('.summary');
  var $directionsBox = $routeBox.children('.directions');

  planner.route(
    { origin: geoA,
      destination: geoB,
      travelMode: google.maps.TravelMode.WALKING
    },
    function(results, status) {
      $routeBox.toggle(true);
      var firstRoute = results['routes'][0];
      var directions = firstRoute['legs'][0];
      var duration = directions['duration']['text'];
      var distance = directions['distance']['text'];

      $summaryBox.append('It\'s a ' + distance + ' (about ' + duration + ') walk.');
      appendDirections(directionsHTML(directions), ['show walking directions', 'hide walking directions'], $routeBox);

      drawRoute(directions['steps'], map);
    }
  );
};

function getTransit(result) {
  $('#transit-info').toggle();

  var legs = result['legs'];
  var planner = new google.maps.DirectionsService();

  legs.forEach(function(leg, i, legs) {
    if(leg['mode'] == 'WALK') {
      planner.route(
        { origin: new google.maps.LatLng(leg['origin'][0], leg['origin'][1]),
          destination: new google.maps.LatLng(leg['destination'][0], leg['destination'][1]),
          travelMode: google.maps.TravelMode.WALKING
        },
        function(results, status) {
          var route = results['routes'][0];
          var directions = route['legs'][0];

          legs[i] = {
            distance: directions['distance']['value'],
            duration: directions['duration']['value'],
            steps: directions['steps'],
            mode: 'WALK',
          };

          if(i === legs.length-1) {
            transitSummary(legs); }
        }
      );
    }
  });
}

function transitSummary(legs) {
  var firstTransit, lastTransit;
  var walkTime = 0;
  var transitTime = 0;

  legs.forEach(function(leg, i, legs) {
    if(leg['mode'] != 'WALK') {
      firstTransit = firstTransit || leg;
      lastTransit = leg;
      transitTime += leg['duration'];
    }
    else {
      walkTime += leg['duration'];
    }
  });

  if(legs[0]['mode'] == 'WALK') { var firstWalk = legs[0]; }
  if(legs[legs.length-1]['mode'] == 'WALK') { var lastWalk = legs[legs.length-1] }
  var firstStop = firstTransit['board'];

  var str = 'Walk to ' + firstStop['name'] + ' (about a ' + firstWalk['duration']/60 + ' minute walk away) to catch the ' + firstTransit['route'] + ' at ' + firstTransit['start_display'] + ' ' + firstStop['delta'] + '.';

  $('#transit-info').children('.summary').append(str);
}

function transitHTML(leg) {

}

function directionsHTML(route) {
  var steps = route['steps'];

  var str = '<ol>';
  for(var i=0; i<steps.length; i++) {
    str += ('<li>' + steps[i]['instructions'] + '</li>');
  }
  str += '</ol>';

  return str;
}

// DIRECTIONS RENDERING
function clearBoxes() {
  boxes = [
    $('#transit-info'),
    $('#car-walk'),
    $('#car-drive'),
    $('#walk-info')
  ]

  boxes.forEach(function($box) {
    $box.toggle(false);
    $box.children().each(function() { $(this).empty(); });
   });

  $('#car-info').toggle(false);
}

function appendDirections(directions, buttonStates, $parentBox) {
  var $summaryBox = $parentBox.children('.summary');
  var $directionsBox = $parentBox.children('.directions');

  $summaryBox.append('<button class="display-btn">' + buttonStates[0] + '</button>');
  $summaryBox.children('.display-btn').on('click', function() {
    return toggleDirections(buttonStates, $directionsBox, $(this));
  });

  $directionsBox.append(directions);
}

function toggleDirections(buttonStates, $directionsBox, $button) {
  if($button.html() === buttonStates[0]) { $button.html(buttonStates[1]); }
  else { $button.html(buttonStates[0]); }
  $directionsBox.toggle();
}

// MAP DRAWING
function clearOverlays() {
  while(overlays[0]) { overlays.pop().setMap(null); }
}

function placePins(geoA, geoB) {
  overlays.push(new google.maps.Marker({
    position: geoA,
    map: map,
    icon: 'http://maps.gstatic.com/mapfiles/markers2/marker_greenA.png'
  }));

  overlays.push(new google.maps.Marker({
    position: geoB,
    map: map,
    icon: 'http://maps.gstatic.com/mapfiles/markers2/markerB.png'
  }));
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

  var paddingNS = 0; //(north - south) / 48;
  var paddingEW = 0; // (east - west) / 48;

  var boundNE = new google.maps.LatLng(north + paddingNS, east + paddingEW);
  var boundSW = new google.maps.LatLng(south + paddingNS, west + paddingEW);
  var bounds = new google.maps.LatLngBounds(boundSW, boundNE);
  map.fitBounds(bounds);
}

function drawRoute(stepArray, map) {
  for(var i=0; i<stepArray.length; i++) {
   drawPolyline(stepArray[i]['polyline']['points'], map);
  }
}

function drawPolyline(encodedPoints, map) {
  var decodedPoints = google.maps.geometry.encoding.decodePath(encodedPoints);
  var line = new google.maps.Polyline( { path: decodedPoints } );
  overlays.push(line);
  line.setMap(map);
}

function resetMap() {
  map.setCenter( { lat: 47.6097, lng: -122.3331 } );
  map.setZoom(11);
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
