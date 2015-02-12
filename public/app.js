$(document).ready(function() {
  $("#submit").click(function(event) {

    event.preventDefault();

    var pointA = makeQueryString( $("#pointA").val() );
    var pointB = makeQueryString( $("#pointB").val() );

    var host = 'http://localhost:3000/';
    var query = '?origin=' + pointA + '&destination=' + pointB;

    $.ajax( {
      url: host + 'car' + query,
      crossDomain: true,
      success: function(result) {
        console.log(result);
        if(result) {  $("#car-info").html(carInfo(result)); }
        else { $("#car-info").html('No nearby cars :('); }
      },
      error: function(http) { $("#car-info").html(http.responseText); }
    });

    $.ajax( {
      url: host + 'walk' + query,
      crossDomain: true,
      success: function(result) { console.log(result); $("#walk-info").html(walkInfo(result)); },
      error: function(http) { $("#walk-info").html(http.responseText); }
    });

    $.ajax( {
      url: host + 'transit' + query,
      crossDomain: true,
      success: function(result) { console.log(result); $("#transit-info").html(transitInfo(result)); },
      error: function(http) { $("#transit-info").html(http.responseText); }
    });
  });
});

function makeQueryString(query) {
  return query.replace(/\s/g, '+') + '+Seattle';
};

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
