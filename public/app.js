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

    var host = 'http://localhost:3000/'; //'http://api.seattle-a2b.com/';
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

  var $infoBox = $('#car-info');
  var $header = $infoBox.siblings('h3');
  $infoBox.toggle(true);

  var planner = new google.maps.DirectionsService();
  var walkTime, driveTime;

  planner.route(
    { origin: geoA,
      destination: carPosition,
      travelMode: google.maps.TravelMode.WALKING
    },
    function(results, status) {
      var route = results['routes'][0];
      var verbiage = route['warnings'][0] + ' ' + route['copyrights'];
      $('footer').html(verbiage);

      var directions = route['legs'][0];
      var distance = directions['distance']['value'];
      var duration = directions['duration']['value'];
      walkTime = duration;
      totalCarTime(walkTime, driveTime, $header);

      var $walkBox = $('#car-walk');
      $walkBox.toggle(true);
      var $walkSummary = $walkBox.children('.summary');

      $walkSummary.append('Walk <strong>' + showDuration(duration) + '</strong> (' + showDistance(distance) + '), to about ' + address);
      appendDirections(directionsHTML(directions), $walkBox)

      drawRoute(directions['steps'], 'green', map);
    });

  planner.route(
    { origin: carPosition,
      destination: geoB,
      travelMode: google.maps.TravelMode.DRIVING
    },
    function(results, status) {
      var directions = results['routes'][0]['legs'][0];
      var distance = directions['distance']['value'];
      var duration = directions['duration']['value'];
      driveTime = duration;
      totalCarTime(walkTime, driveTime, $header);

      var $driveBox = $('#car-drive');
      $driveBox.toggle(true)
      var $driveSummary = $driveBox.children('.summary');

      $driveSummary.append('Drive <strong>' + showDuration(duration) + '</strong> from there');

      appendDirections(directionsHTML(directions), $driveBox);
      drawRoute(directions['steps'], 'firebrick', map);
    });
};

function totalCarTime(walkTime, driveTime, $box) {
  if(!walkTime || !driveTime) { return false; }
  else {
    var totalTime = walkTime + driveTime
    var arrivalTime = new Date(Date.now() + totalTime * 1000)
    var totalMinutes = showDuration(totalTime);
    var cost = driveTime/60 * 35;
    $box.append('<span>: ' + showArrivalTime(totalTime) + ' (' + showMoney(cost) + ')</span>');
  }
}

function showMoney(cents) {
  return '$' + (cents/100).toFixed(2);
}

function showDistance(meters, metric) {
  var distance, unit;

  if(meters < 161){
    if(metric) { distance = meters; unit = 'meter'}
    else { distance = Math.round(meters / 1.60934); unit = 'foot' }
  }
  else {
    if(metric) { distance = (meters/1000).toFixed(1); unit = 'kilometer'; }
    else { distance = (meters/1609.34).toFixed(1); unit = 'mile'; }
  }

  return numberUnits(distance, unit);
}

function showDuration(seconds) {
  var minutes = Math.round(seconds/60)
  if(minutes<60) { return numberUnits(minutes, 'minute'); }
  else {
    var hours = Math.floor(seconds/3600);
    minutes = Math.ceil((seconds/3600 - hours) * 60);
    var timeString = numberUnits(hours, 'hour');
    if(minutes > 0) { timeString += (', ' +  numberUnits(minutes, 'minute')); }
    return timeString;
  }
}

function showArrivalTime(duration) {
  var now = Date.now();
  var arrival = new Date(now + duration * 1000);
  var hour = arrival.getHours();
  var minute = arrival.getMinutes();

  if(hour === 0) { hour = 12; var ampm = 'am'; }
  else if(hour <= 12) { var ampm = 'am'; }
  else { hour -= 12; var ampm = 'pm' }

  if(minute < 10) { minute = '0' + minute; }

  return hour + ':' + minute + ' ' + ampm;
}

function numberUnits(number, unit) {

  var numberString = number + ' ';
  if(unit === 'foot') { numberString += (number === 1.0 ? 'foot' : 'feet'); }
  else { numberString += (number === 1.0 ? unit : unit + 's'); }
  return numberString;
}

function getWalk(geoA, geoB) {
  var planner = new google.maps.DirectionsService();

  var $routeBox = $('#walk-info');
  var $headerBox = $routeBox.siblings('h3');
  var $loaderBox = $routeBox.siblings('.loader');
  var $summaryBox = $routeBox.children('.summary');
  var $directionsBox = $routeBox.children('.directions');

  planner.route(
    { origin: geoA,
      destination: geoB,
      travelMode: google.maps.TravelMode.WALKING
    },
    function(results, status) {
      $routeBox.toggle(true);
      $loaderBox.toggle(false);
      var firstRoute = results['routes'][0];
      var directions = firstRoute['legs'][0];
      var distance = directions['distance']['value'];
      var duration = directions['duration']['value'];

      $summaryBox.append(showDuration(duration) + ' (' + showDistance(distance) + ')');
      $headerBox.append('<span>' + showArrivalTime(duration) + ' (free)</span>');
      appendDirections(directionsHTML(directions), $routeBox);
      drawRoute(directions['steps'], 'green', map);
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

          if(i === legs.length-1) { transitSummary(legs); transitHeader(result)  }
        }
      );
    }
  });
}

function transitSummary(legs) {
  var $routeBox = $('#transit-info');
  var firstTransitIndex;

  legs.forEach(function(leg, i, legs) {
    if(leg['mode'] == 'WALK') {
      var summary = '<div class="leg"><div class="summary">Walk <strong>' + showDuration(leg['duration']) + ' </strong> (' + showDistance(leg['distance']) + ')</div><div class="directions"></div></div>';
      $routeBox.append(summary);
      appendDirections(directionsHTML(leg), $routeBox.children('.leg').last());
    }
    else {
      if(!firstTransitIndex) { firstTransitIndex = i; }
      var summary = '<div class="leg">At <strong>' + leg['board']['name'] + '</strong>, get the <strong>' + leg['route'] + '</strong> ' + leg['mode'].toLowerCase();
      if(i===firstTransitIndex) { summary += ' at <strong>' + leg['start_display'] + '</strong> ' + leg['board']['delta']; }
      summary += '<div>Get off at <strong>' + leg['alight']['name'] + '</strong></div>';

      $routeBox.append(summary);
    }
  });
}

function transitHeader(trip) {
  var $routeBox = $('#transit-info');
  var $headerBox = $routeBox.siblings('h3');
  var summary = trip['summary'];
  var fare = trip['fare'] ? showMoney(trip['fare']) : '?.??';

  $headerBox.append('<span>: ' + summary['arrival_time'] + ' (' + fare + ' or free)');
}

function directionsHTML(route) {
  var steps = route['steps'];
  var regex = /<div.*<\/div>/;

  var str = '<ul>';
  for(var i=0; i<steps.length; i++) {
    str += '<li>' + steps[i]['instructions'].replace(regex, '');
    str += ' for ' + showDistance(steps[i]['distance']['value']) + '</li>';
  }
  str += '</ul>';

  return str;
}

// DIRECTIONS RENDERING
function clearBoxes() {
  var headers = [
    $('#transit').children('h3'),
    $('#car').children('h3'),
    $('#walk').children('h3')
  ]

  headers.forEach(function($header) {
    $header.children('span').remove();
  })

  var boxes = [
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

function appendDirections(directions, $parentBox) {
  var $summaryBox = $parentBox.children('.summary');
  var $directionsBox = $parentBox.children('.directions');

  $summaryBox.append('<div class="inline-btn"><button class="display-btn">show directions</button></div>');
  $summaryBox.find('.display-btn').on('click', function() {
    return toggleDirections($directionsBox, $(this));
  });

  $directionsBox.append('<div>' + directions + '</div>');
}

function toggleDirections($directionsBox, $button) {
  if($button.html() === 'show directions') { $button.html('hide directions'); }
  else { $button.html('show directions'); }
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

function drawRoute(stepArray, color, map) {
  for(var i=0; i<stepArray.length; i++) {
   drawPolyline(stepArray[i]['polyline']['points'], color, map);
  }
}

function drawPolyline(encodedPoints, color, map) {
  var decodedPoints = google.maps.geometry.encoding.decodePath(encodedPoints);
  var line = new google.maps.Polyline( { path: decodedPoints, strokeColor: color } );
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
