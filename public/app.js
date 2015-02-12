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
      success: function(result) { $("#car").after(result['address']); },
      error: function(http) { $("#car").after(http.responseText); }
    });

    $.ajax( {
      url: host + 'walk' + query,
      crossDomain: true,
      success: function(result) { $("#walk").after(walkInfo(result)); },
      error: function(http) { $("#walk").after(http.responseText); }
    });

    $.ajax( {
      url: host + 'transit' + query,
      crossDomain: true,
      success: function(result) { $("#transit").after(transitInfo(result)); },
      error: function(http) { $("#transit").after(http.responseText); }
    });

  });
});

function makeQueryString(query) {
  return query.replace(/\s/g, '+') + '+Seattle'
};

function walkInfo(result) {
  return 'It\'s a ' + result['duration'] / 60 + ' minute walk.'
};

function transitInfo(result) {
  return 'Your bus is going from ' + result['from'] + ' to ' + result['to'] + '. Also, your API sucks.';
}
