let MarkersData = function(map, google) {
    this.map = map;
    this.google = google;
    this.storageData = localStorage.data ? JSON.parse(localStorage.data) : {};
    this.markersObj = {};

    this.addToStorage = function(geoId, markerData) {
        this.storageData[geoId] = markerData;
        this.updateLocalStorage();
    }  

    this.updateLocalStorage = function() {
        localStorage.data = JSON.stringify(this.storageData);   
    } 

    this.removeMarker = function(geoId) {
        this.markersObj[geoId].setMap(null);  
        delete this.markersObj[geoId]; 
    }

    this.updateMarker = function(geoId, cb) {
        this.removeMarker(geoId);   
        return this.placeMarker(geoId, cb);   
    }    

    this.placeMarker = function(geoId, cb) {
        let markerData = this.storageData[geoId],
            marker = new google.maps.Marker({
                position: {lat: parseFloat(markerData.lat), lng: parseFloat(markerData.lng)}, 
                map: this.map,
                label: markerData.comments.length.toString(),
                customInfo: geoId
            });

        this.markersObj[geoId] = marker;
        if (cb) {
            cb(marker);
        }

        return marker;
    }

    this.buildMarkers = function(cb) {
        if (this.storageData) {
            for (var geoId in this.storageData) {
                this.placeMarker(geoId, cb);  
            }  
        }   
    }
}

export default MarkersData;