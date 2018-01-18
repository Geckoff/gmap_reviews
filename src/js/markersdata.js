/**
* @param {google.maps.Map} map - google maps map obj
* @param {Object} google 
*/
let MarkersData = function(map, google) {
    this.map = map;
    this.google = google;
    this.storageData = localStorage.data ? JSON.parse(localStorage.data) : {}; // object stores markers' data
    this.markersObj = {}; // object stores google markers objects

    // add new marker data to local storage
    this.addToStorage = function(geoId, markerData) {
        this.storageData[geoId] = markerData;
        this.updateLocalStorage();
    }  

    // save storageData object o local storage
    this.updateLocalStorage = function() {
        localStorage.data = JSON.stringify(this.storageData);   
    } 

    // remove marker from map and from markersObj object
    this.removeMarker = function(geoId) {
        this.markersObj[geoId].setMap(null);  
        delete this.markersObj[geoId]; 
    }

    // update marker. used for updating reviews number on marker's icon
    this.updateMarker = function(geoId, cb) {
        this.removeMarker(geoId);   
        return this.placeMarker(geoId, cb);   
    }    

    // place new marker on the map
    // data for placing marker generated from storageData object
    this.placeMarker = function(geoId, cb) {
        const markerData = this.storageData[geoId],
              //image = new google.maps.MarkerImage('/src/img/marker.svg', null, null, null, new google.maps.Size(32,47)),
              image = {
                  url: '/src/img/marker.svg',
                  size: new google.maps.Size(32, 47),
                  scaledSize: new google.maps.Size(32, 47),
                  labelOrigin: new google.maps.Point(16, 15)
              },
              label = {
                  text: markerData.comments.length.toString(),
                  color: 'black',
                  fontSize: '12px',
                  x: '200',
                  y: '100'
              },
              marker = new google.maps.Marker({
                  position: {lat: parseFloat(markerData.lat), lng: parseFloat(markerData.lng)}, 
                  map: this.map,
                  label: markerData.comments.length.toString(),
                  customInfo: geoId,
                  icon: image
              });

        this.markersObj[geoId] = marker;
        if (cb) {
            cb(marker);
        }

        return marker;
    }

    // iterating over storageData to generate Markers and place them on the map
    this.buildMarkers = function(cb) {
        if (this.storageData) {
            for (var geoId in this.storageData) {
                this.placeMarker(geoId, cb);  
            }  
        }   
    }
}

export default MarkersData;