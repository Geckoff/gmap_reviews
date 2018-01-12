<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
      /* Always set the map height explicitly to define the size of the div
       * element that contains the map. */
      #map {
        height: 100%;
      }
      /* Optional: Makes the sample page fill the window. */
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      /* The location pointed to by the popup tip. */
      .popup-tip-anchor {
        height: 0;
        position: absolute;
        /* The max width of the info window. */
        width: 200px;
      }
      /* The bubble is anchored above the tip. */
      .popup-bubble-anchor {
        position: absolute;
        width: 100%;
        bottom: /* TIP_HEIGHT= */ 8px;
        left: 0;
      }
      /* Draw the tip. */
      .popup-bubble-anchor::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        /* Center the tip horizontally. */
        transform: translate(-50%, 0);
        /* The tip is a https://css-tricks.com/snippets/css/css-triangle/ */
        width: 0;
        height: 0;
        /* The tip is 8px high, and 12px wide. */
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: /* TIP_HEIGHT= */ 8px solid white;
      }
      /* The popup bubble itself. */
      .popup-bubble-content {
        position: absolute;
        top: 0;
        left: 0;
        transform: translate(-50%, -100%);
        /* Style the info window. */
        background-color: white;
        padding: 5px;
        border-radius: 5px;
        font-family: sans-serif;
        overflow-y: auto;
        max-height: 60px;
        box-shadow: 0px 2px 10px 1px rgba(0,0,0,0.5);
      }
    </style>
    <script src="https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js"></script>
</head>
<body>
<div id="map" style="width: 100%; height: 700px;"></div>
<script>
function initMap() {

    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 3,
      center: {lat: -28.024, lng: 140.887}
    });

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    var markers = locations.map(function(location, i) {
      return new google.maps.Marker({
        position: location,
        label: '12',
        //icon: 'http://gmap-reviews.local:8888/reviews.svg'
        icon: new google.maps.MarkerImage('/reviews.svg',
        null, null, null, new google.maps.Size(50,50)),
          });
    });

    // Add a marker clusterer to manage the markers.
    var markerCluster = new MarkerClusterer(map, markers, {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

    var infoWindow = new google.maps.InfoWindow({
        content: '<h1 class="infowindow">Test</h1>'
    });

    markers.forEach((marker) => {
        marker.addListener('click', function(){
            console.log(this.internalPosition.lat());
            infoWindow.open(map, marker);
        });    
    });



    // turn coordinates into an address
    var geocoder = new google.maps.Geocoder();

    google.maps.event.addListener(map, 'click', function(event) {
      geocoder.geocode({
        'latLng': event.latLng
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            console.log(results[0].formatted_address);
          }
        }
      });
});





}
var locations = [
{lat: -31.563910, lng: 147.154312},
{lat: -33.718234, lng: 150.363181},
{lat: -33.727111, lng: 150.371124},
{lat: -33.848588, lng: 151.209834},
{lat: -33.851702, lng: 151.216968},
{lat: -34.671264, lng: 150.863657},
{lat: -35.304724, lng: 148.662905},
{lat: -36.817685, lng: 175.699196},
{lat: -36.828611, lng: 175.790222},
{lat: -37.750000, lng: 145.116667},
{lat: -37.759859, lng: 145.128708},
{lat: -37.765015, lng: 145.133858},
{lat: -37.770104, lng: 145.143299},
{lat: -37.773700, lng: 145.145187},
{lat: -37.774785, lng: 145.137978},
{lat: -37.819616, lng: 144.968119},
{lat: -38.330766, lng: 144.695692},
{lat: -39.927193, lng: 175.053218},
{lat: -41.330162, lng: 174.865694},
{lat: -42.734358, lng: 147.439506},
{lat: -42.734358, lng: 147.501315},
{lat: -42.735258, lng: 147.438000},
{lat: -43.999792, lng: 170.463352}
]
</script>


<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyASmYPQ8oqhA2QjMtTl0SsQN4u94HgHm_M&callback=initMap"></script>  

</body>
</html>      