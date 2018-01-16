import definePopupClass from './src/js/popup.js';
import MarkersData from './src/js/markersdata.js';

let gMapsApp = function() {
    let map, 
        popup, 
        markerCluster,
        markersDataFuncs;

    // extending native api functionality to be able to zoom into a marker with offset    
    google.maps.Map.prototype.panToWithOffset = function(latlng, offsetX, offsetY) {
        var map = this;
        var ov = new google.maps.OverlayView();
        ov.onAdd = function() {
            var proj = this.getProjection();
            var aPoint = proj.fromLatLngToContainerPixel(latlng);
            aPoint.x = aPoint.x+offsetX;
            aPoint.y = aPoint.y+offsetY;
            map.panTo(proj.fromContainerPixelToLatLng(aPoint));
        }; 
        ov.draw = function() {}; 
        ov.setMap(this); 
    };

    // extending native ClusterIcon function
    ClusterIcon.prototype.onAdd = function() {
        this.div_ = document.createElement('DIV');
        if (this.visible_) {
            var pos = this.getPosFromLatLng_(this.center_);
            this.div_.style.cssText = this.createCss(pos);

            var markers = this.cluster_.markers_;
            var reviewsCount = 0;
            markers.forEach((marker) => {
                var id = marker.customInfo;

                reviewsCount += markersDataFuncs.storageData[id].comments.length;
            });    

            this.div_.innerHTML = this.sums_.text + '/' + reviewsCount;
        }

        var panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.div_);

        var that = this;
        google.maps.event.addDomListener(this.div_, 'click', function(e) {
            e.stopPropagation(); 
            that.triggerClusterClick();
        });

        google.maps.event.addDomListener(this.div_, 'dblclick', function(e) {
            e.stopPropagation(); 
            that.map_.fitBounds(that.cluster_.getBounds());
            // ?????????
            setTimeout(() => {
                if (document.querySelector('.close')) {
                    document.querySelector('.close').click();
                }
            }, 0);
        });
    };    
    
    const addEventsToMarker = function(marker) { 
        marker.addListener('click', openPopup); 
        generateClusters();
    }


    const zoomInToClusterMarker = function(geoId) {
        if (markerCluster !== undefined) {
            let zoomIn = false,
                latLng;

            markerCluster.clusters_.forEach((cluster) => {
                if (cluster.markers_.length > 1) {
                    cluster.markers_.forEach((marker) => {
                        if (marker.customInfo === geoId) {
                            zoomIn = true;    
                            latLng = marker.position;
                        }
                    });   
                }
            });            

            if (zoomIn) {
                map.setZoom(22);
                map.panToWithOffset(latLng, 0, -220);
            }

            return zoomIn;
        }
    }


    const openPopup = function(event) {
        let address = '',
            eventLatLng;     
        // turn coordinates into an address
        var geocoder = new google.maps.Geocoder();

        var geo = function(){
            return new Promise((resolve, reject) => {
                geocoder.geocode({
                    'latLng': event.latLng
                }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[0]) {
                            address = results[0].formatted_address;
                            resolve(address);
                            eventLatLng = event.latLng;
                        }
                    }
                });   
            });
        }

        geo()
            .then((address) => {
                return new Promise((resolve, reject) => {
                    geocoder.geocode({
                        "address": address
                    }, function(results) {
                        var location = results[0].geometry.location; //LatLng
                        var lat = location.lat().toString().replace('-', 'n').replace('.', '');
                        var lng = location.lng().toString().replace('-', 'n').replace('.', '');
                        var coordsId = 'id' + lat + lng;
                        resolve([address, coordsId, location]); 
                    });                
                });
            })
            .then((geoData) => {
                let latLng = geoData[2],
                    markerData = false,
                    geoId = geoData[1];

                if (markersDataFuncs.storageData.hasOwnProperty(geoId)) {
                    markerData = markersDataFuncs.storageData[geoData[1]];                  
                }

                // check if there is a marker on current location and if this marker
                // is cirrently a part of a cluster. If it is, we should to zoom in to
                // this marker to display popup correctly
                zoomInToClusterMarker(geoId);
                new popup.MarkerPopupBuilder(geoData, markerData, eventLatLng, map).createPopup();
            })
            .catch((e) => {console.log(e)});
    }

    const generateClusters = function() { 
        if (typeof markerCluster === 'object') {
          markerCluster.clearMarkers();
        }
        var markersArr = [];
        for (var marker in markersDataFuncs.markersObj) {
          markersArr.push(markersDataFuncs.markersObj[marker]); 
        }

        markerCluster = new MarkerClusterer(map, markersArr, {
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            zoomOnClick: false
        });

        google.maps.event.addListener(markerCluster, 'clusterclick', function(cluster) {
            let latLng = new google.maps.LatLng(cluster.center_.lat(), cluster.center_.lng()),
                geodata = cluster.markers_,
                clusterMarkersObj = {};   

            cluster.markers_.forEach((clusterMarker) => {
            let clusterMarkerItself = clusterMarker,
                clusterMarkerInfo = markersDataFuncs.storageData[clusterMarker.customInfo];

                // build up object containing both marker data and marker map objects    
                clusterMarkersObj[clusterMarker.customInfo] = {};
                clusterMarkersObj[clusterMarker.customInfo].clusterMarkerItself = clusterMarkerItself;
                clusterMarkersObj[clusterMarker.customInfo].clusterMarkerInfo = clusterMarkerInfo;
            });    

            new popup.ClusterPopupBuilder(clusterMarkersObj, latLng, map).createPopup();
        });  
    }

    /** Initializes the map and the custom popup. */
    const initMap = function() {
        popup = definePopupClass(google);

        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -33.9, lng: 151.1},
            zoom: 18,
        });

        markersDataFuncs = new MarkersData(map, google);

        // attaching function to event that triggers when save button was hit
        document.addEventListener('markerUpdate', (e) => {
            if (e.detail.addNewLocation) {
                let zoomIn = false,
                    currentMarker;

                markersDataFuncs.addToStorage(e.detail.geoId, e.detail.addNewLocation);
                currentMarker = markersDataFuncs.placeMarker(e.detail.geoId, addEventsToMarker); 

                // check if new marker was written into a cluster
                // ???????? - how to wait until cluster marker object was built
                setTimeout(() => {
                    if (zoomInToClusterMarker(e.detail.geoId)) {
                        let markerData = markersDataFuncs.storageData[e.detail.geoId],
                            latLng = new google.maps.LatLng(markerData.lat, markerData.lng);  

                        new popup.MarkerPopupBuilder(
                            [
                                markerData.address,
                                e.detail.geoId,
                                latLng
                            ], 
                            markersDataFuncs.storageData[e.detail.geoId], 
                            false,
                            map
                        ).createPopup();  
                    }
                }, 100);                
            } else {
                markersDataFuncs.updateLocalStorage();
                markersDataFuncs.updateMarker(e.detail.geoId, addEventsToMarker); 
            }
        });

        google.maps.event.addListener(map, 'click', openPopup);
        map.addListener('zoom_changed', function() {
            if (document.querySelector('.close')) {
                document.querySelector('.close').click();
            }
        });
        markersDataFuncs.buildMarkers(addEventsToMarker);     
    }

    return {
        initMap 
    } 
}

// start app
function initMap() {
    let app = gMapsApp();
    app.initMap();
}

window.initMap = initMap;