/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__src_js_popup_js__ = __webpack_require__(1);


let MarkersData = function(map) {

    this.map = map;
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

console.log(google);

var gMapsApp = function() {

    let map, 
        popup, 
        markerCluster,
        markersDataFuncs;

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
            map.panTo(latLng);
        }

        return zoomIn;
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
        popup = Object(__WEBPACK_IMPORTED_MODULE_0__src_js_popup_js__["a" /* default */])(google);

        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -33.9, lng: 151.1},
            zoom: 18,
        });

        markersDataFuncs = new MarkersData(map);

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










// /** Defines the Popup class. */
// function definePopupClass(google) { 
//   /**
//    * A customized popup on the map.
//    * @param {!google.maps.LatLng} position
//    * @param {!Element} content
//    * @constructor
//    * @extends {google.maps.OverlayView}
//    */
//   let Popup = function(position, content, isMarker) {
//     this.isMarker = isMarker;
//     this.position = position;

//     content.classList.add('popup-bubble-content');

//     var pixelOffset = document.createElement('div');
//     pixelOffset.classList.add('popup-bubble-anchor');
//     pixelOffset.appendChild(content);

//     this.anchor = document.createElement('div');
//     this.anchor.classList.add('popup-tip-anchor');
//     this.anchor.appendChild(pixelOffset);

//     // Optionally stop clicks, etc., from bubbling up to the map.
//     this.stopEventPropagation();
//   };
//   // NOTE: google.maps.OverlayView is only defined once the Maps API has
//   // loaded. That is why Popup is defined inside initMap().
//   Popup.prototype = Object.create(thisgoogle.maps.OverlayView.prototype);

//   /** Called when the popup is added to the map. */
//   Popup.prototype.onAdd = function() {
//     this.getPanes().floatPane.appendChild(this.anchor);
//   };

//   /** Called when the popup is removed from the map. */
//   Popup.prototype.onRemove = function() {
//       if (this.anchor.parentElement) {
//       this.anchor.parentElement.removeChild(this.anchor);
//     }
//   };

//   /** Called when the popup needs to draw itself. */
//   Popup.prototype.draw = function() {
//     var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
//     // Hide the popup when it is far out of view.
//     var display =
//         Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
//         'block' :
//         'none';

//     var popupOffset = 0;  
//     if (this.isMarker) {
//       popupOffset = 40;
//     }

//     if (display === 'block') {
//       this.anchor.style.left = divPosition.x + 'px';
//       this.anchor.style.top = divPosition.y - popupOffset + 'px';
//     }
//     if (this.anchor.style.display !== display) {
//       this.anchor.style.display = display;
//     }
//   };

//   /** Stops clicks/drags from bubbling up to the map. */
//   Popup.prototype.stopEventPropagation = function() {
//     var anchor = this.anchor;
//     anchor.style.cursor = 'auto';

//     ['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart',
//      'pointerdown']
//         .forEach(function(event) {
//           anchor.addEventListener(event, function(e) {
//             e.stopPropagation();
//           });
//         });
//   }

//     const inherit = function(child, parent) {
//         child.prototype = Object.create(parent.prototype);
//         child.prototype.constructor = child;
//         child.prototype.parent = parent; 
//     }

    
//     let PopupBuilder = function(){};

//     inherit(PopupBuilder, Popup); 

//     PopupBuilder.prototype.getHtml = function() {
//         let elem = document.createElement('div'); 
//         let contentWrapper = document.createElement('div'); 
//         elem.innerHTML = '<span class="close" style="color:red; cursor: pointer">X</span>';
//         contentWrapper.classList.add('popup-content-wrapper');
//         elem.appendChild(contentWrapper);
//         this.contentWrapper = contentWrapper;
//         this.elem = elem;
//     }

//     PopupBuilder.prototype.createPopup = function() {
//         this.getHtml();
//         this.getIsMarker();
//         ////// ???????????
//         PopupBuilder.prototype.parent.call(this, this.latLng, this.elem, this.isMarker);

//         this.anchor.addEventListener('click', (e) => {
//             if (e.target.classList.contains('close')) {
//                 this.onRemove();
//             }
//         });


//         if (document.querySelector('.close')) {
//             document.querySelector('.close').click();
//         }
//         this.setMap(this.map);
//         this.setEvents();
//     }


//     /**
//      * @param {Array} geodata
//      * @param {Object} markerData
//      */
//     let MarkerPopupBuilder = function(geoData, markerData, eventLatLng, map, google) {
//         this.markerData = markerData;
//         this.address = geoData[0];
//         this.geoId = geoData[1];
//         this.addresslatLng = geoData[2];
//         this.map = map;
//         this.google = google;
//         //open Popup on click event latLng or on marker latLng if marker exists
//         if (markerData) {
//             this.latLng = geoData[2];   
//         } else {
//             this.latLng = eventLatLng; 
//         }
//     }

//     inherit(MarkerPopupBuilder, PopupBuilder); 

//     MarkerPopupBuilder.prototype.getHtml = function() {
//         this.parent.prototype.getHtml.call(this);
//         let comments = '';
//         if (this.markerData) {
//             this.markerData.comments.forEach((comment) => {
//                 comments += `<div>${comment}</div>`;     
//             });     
//         }
//         this.contentWrapper.innerHTML = `${this.address}<br>${this.geoId}<br><input type="text" class="input-review"><br><div class="reviews-block">${comments}</div><br><button class="save-review">Save</button>`;
//     }

//     MarkerPopupBuilder.prototype.getIsMarker = function() {
//         this.isMarker = this.markerData ? true : false;
//     }

//     // click on Save Review button
//     MarkerPopupBuilder.prototype.setEvents = function() {
//         this.contentWrapper.querySelector('.save-review').addEventListener('click', () => {
//                 const text = this.contentWrapper.querySelector('.input-review').value,
//                       geoData = [this.address, this.geoId, this.addresslatLng];
//                 let markerData = this.markerData,
//                     addNewLocation = false;

//                 // for existing Marker just saving comment to Marker's object,
//                 // for new Location creating new object with Marker Data    
//                 if (markerData) {
//                     this.markerData.comments.push(text);      
//                 } else {
//                     markerData = {
//                         lat: this.addresslatLng.lat(),
//                         lng: this.addresslatLng.lng(),
//                         address: this.address,
//                         comments: [text]
//                     }
//                     addNewLocation = markerData;  
//                 }

//                 // trigger custom event to update/add marker, listening for this event outside of the module
//                 let markerUpdate = new CustomEvent("markerUpdate", {
//                     detail: {
//                         geoId: this.geoId,
//                         addNewLocation: addNewLocation
//                     }
//                 });
//                 document.dispatchEvent(markerUpdate);

//                 this.onRemove();
//                 new MarkerPopupBuilder(geoData, markerData, false, this.map).createPopup();            
//         });      
//     }


//     /**
//      * @param {Object} geodata - object with marker objects and markers' data
//      * @param {Object} latLng
//      */
//     let ClusterPopupBuilder = function(geodata, latLng, map, google) {
//         this.geodata = geodata;      
//         this.latLng = latLng;    
//         this.map = map;
//         this.google = google;
//     }

//     inherit(ClusterPopupBuilder, PopupBuilder); 

//     ClusterPopupBuilder.prototype.getHtml = function() {
//         this.parent.prototype.getHtml.call(this);
//         this.contentWrapper.classList.add('infoblock');
//         for (let geoId in this.geodata) {
//             let dataObj = this.geodata[geoId].clusterMarkerInfo,
//                 addressBlock = document.createElement('div'),
//                 addressInfo = `<div data-id="${geoId}" class="cluster-address">${dataObj.address}</div>`;
            
//             addressBlock.classList.add('cluster-addressblock');
//             addressBlock.innerHTML = addressInfo;

//             let clusteCommentsBlock = document.createElement('div');
//             clusteCommentsBlock.classList.add('cluster-comments-block');

//             let clusterComments = '';
//             dataObj.comments.forEach((comment) => {
//                 clusterComments += `<div class='single-cluster-comment'>${comment}</div>`;  
//             });
//             clusteCommentsBlock.innerHTML = clusterComments;
//             addressBlock.appendChild(clusteCommentsBlock);
//             this.contentWrapper.appendChild(addressBlock);   
//         }
//     }

//     // setting clusters' addresses click events
//     ClusterPopupBuilder.prototype.setEvents = function() {
//         this.contentWrapper.addEventListener('click', (e) => {
//             if (e.target.classList.contains('cluster-address')) {
//                 let geoId = e.target.dataset.id,
//                     marker = this.geodata[geoId].clusterMarkerItself;

//                 this.map.setZoom(22);
//                 this.map.panTo(marker.position);

//                 let markerData = this.geodata[geoId].clusterMarkerInfo,
//                     latLng = new google.maps.LatLng(markerData.lat, markerData.lng);

//                 new MarkerPopupBuilder([
//                     markerData.address,
//                     geoId,
//                     latLng
//                 ], markerData, false, this.map).createPopup();
//             }
//         });  
//     }

//     ClusterPopupBuilder.prototype.getIsMarker = function() {
//         this.isMarker = false;
//     }

//     return {
//         ClusterPopupBuilder,
//         MarkerPopupBuilder     
//     }
// }

function initMap() {
    let app = gMapsApp();
    app.initMap();
}

initMap();

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Defines the Popup class. */

/* harmony default export */ __webpack_exports__["a"] = (function (google) { 
  /**
   * A customized popup on the map.
   * @param {!google.maps.LatLng} position
   * @param {!Element} content
   * @constructor
   * @extends {google.maps.OverlayView}
   */
  let Popup = function(position, content, isMarker) {
    this.isMarker = isMarker;
    this.position = position;

    content.classList.add('popup-bubble-content');

    var pixelOffset = document.createElement('div');
    pixelOffset.classList.add('popup-bubble-anchor');
    pixelOffset.appendChild(content);

    this.anchor = document.createElement('div');
    this.anchor.classList.add('popup-tip-anchor');
    this.anchor.appendChild(pixelOffset);

    // Optionally stop clicks, etc., from bubbling up to the map.
    this.stopEventPropagation();
  };
  // NOTE: google.maps.OverlayView is only defined once the Maps API has
  // loaded. That is why Popup is defined inside initMap().
  Popup.prototype = Object.create(google.maps.OverlayView.prototype);

  /** Called when the popup is added to the map. */
  Popup.prototype.onAdd = function() {
    this.getPanes().floatPane.appendChild(this.anchor);
  };

  /** Called when the popup is removed from the map. */
  Popup.prototype.onRemove = function() {
      if (this.anchor.parentElement) {
      this.anchor.parentElement.removeChild(this.anchor);
    }
  };

  /** Called when the popup needs to draw itself. */
  Popup.prototype.draw = function() {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
    // Hide the popup when it is far out of view.
    var display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
        'block' :
        'none';

    var popupOffset = 0;  
    if (this.isMarker) {
      popupOffset = 40;
    }

    if (display === 'block') {
      this.anchor.style.left = divPosition.x + 'px';
      this.anchor.style.top = divPosition.y - popupOffset + 'px';
    }
    if (this.anchor.style.display !== display) {
      this.anchor.style.display = display;
    }
  };

  /** Stops clicks/drags from bubbling up to the map. */
  Popup.prototype.stopEventPropagation = function() {
    var anchor = this.anchor;
    anchor.style.cursor = 'auto';

    ['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart',
     'pointerdown']
        .forEach(function(event) {
          anchor.addEventListener(event, function(e) {
            e.stopPropagation();
          });
        });
  }

    const inherit = function(child, parent) {
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
        child.prototype.parent = parent; 
    }

    
    let PopupBuilder = function(){};

    inherit(PopupBuilder, Popup); 

    PopupBuilder.prototype.getHtml = function() {
        let elem = document.createElement('div'); 
        let contentWrapper = document.createElement('div'); 
        elem.innerHTML = '<span class="close" style="color:red; cursor: pointer">X</span>';
        contentWrapper.classList.add('popup-content-wrapper');
        elem.appendChild(contentWrapper);
        this.contentWrapper = contentWrapper;
        this.elem = elem;
    }

    PopupBuilder.prototype.createPopup = function() {
        this.getHtml();
        this.getIsMarker();
        ////// ???????????
        PopupBuilder.prototype.parent.call(this, this.latLng, this.elem, this.isMarker);

        this.anchor.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                this.onRemove();
            }
        });


        if (document.querySelector('.close')) {
            document.querySelector('.close').click();
        }
        this.setMap(this.map);
        this.setEvents();
    }


    /**
     * @param {Array} geodata
     * @param {Object} markerData
     */
    let MarkerPopupBuilder = function(geoData, markerData, eventLatLng, map) {
        this.markerData = markerData;
        this.address = geoData[0];
        this.geoId = geoData[1];
        this.addresslatLng = geoData[2];
        this.map = map;
        //open Popup on click event latLng or on marker latLng if marker exists
        if (markerData) {
            this.latLng = geoData[2];   
        } else {
            this.latLng = eventLatLng; 
        }
    }

    inherit(MarkerPopupBuilder, PopupBuilder); 

    MarkerPopupBuilder.prototype.getHtml = function() {
        this.parent.prototype.getHtml.call(this);
        let comments = '';
        if (this.markerData) {
            this.markerData.comments.forEach((comment) => {
                comments += `<div>${comment}</div>`;     
            });     
        }
        this.contentWrapper.innerHTML = `${this.address}<br>${this.geoId}<br><input type="text" class="input-review"><br><div class="reviews-block">${comments}</div><br><button class="save-review">Save</button>`;
    }

    MarkerPopupBuilder.prototype.getIsMarker = function() {
        this.isMarker = this.markerData ? true : false;
    }

    // click on Save Review button
    MarkerPopupBuilder.prototype.setEvents = function() {
        this.contentWrapper.querySelector('.save-review').addEventListener('click', () => {
                const text = this.contentWrapper.querySelector('.input-review').value,
                      geoData = [this.address, this.geoId, this.addresslatLng];
                let markerData = this.markerData,
                    addNewLocation = false;

                // for existing Marker just saving comment to Marker's object,
                // for new Location creating new object with Marker Data    
                if (markerData) {
                    this.markerData.comments.push(text);      
                } else {
                    markerData = {
                        lat: this.addresslatLng.lat(),
                        lng: this.addresslatLng.lng(),
                        address: this.address,
                        comments: [text]
                    }
                    addNewLocation = markerData;  
                }

                // trigger custom event to update/add marker, listening for this event outside of the module
                let markerUpdate = new CustomEvent("markerUpdate", {
                    detail: {
                        geoId: this.geoId,
                        addNewLocation: addNewLocation
                    }
                });
                document.dispatchEvent(markerUpdate);

                this.onRemove();
                new MarkerPopupBuilder(geoData, markerData, false, this.map).createPopup();            
        });      
    }


    /**
     * @param {Object} geodata - object with marker objects and markers' data
     * @param {Object} latLng
     */
    let ClusterPopupBuilder = function(geodata, latLng, map) {
        this.geodata = geodata;      
        this.latLng = latLng;    
        this.map = map;
    }

    inherit(ClusterPopupBuilder, PopupBuilder); 

    ClusterPopupBuilder.prototype.getHtml = function() {
        this.parent.prototype.getHtml.call(this);
        this.contentWrapper.classList.add('infoblock');
        for (let geoId in this.geodata) {
            let dataObj = this.geodata[geoId].clusterMarkerInfo,
                addressBlock = document.createElement('div'),
                addressInfo = `<div data-id="${geoId}" class="cluster-address">${dataObj.address}</div>`;
            
            addressBlock.classList.add('cluster-addressblock');
            addressBlock.innerHTML = addressInfo;

            let clusteCommentsBlock = document.createElement('div');
            clusteCommentsBlock.classList.add('cluster-comments-block');

            let clusterComments = '';
            dataObj.comments.forEach((comment) => {
                clusterComments += `<div class='single-cluster-comment'>${comment}</div>`;  
            });
            clusteCommentsBlock.innerHTML = clusterComments;
            addressBlock.appendChild(clusteCommentsBlock);
            this.contentWrapper.appendChild(addressBlock);   
        }
    }

    // setting clusters' addresses click events
    ClusterPopupBuilder.prototype.setEvents = function() {
        this.contentWrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('cluster-address')) {
                let geoId = e.target.dataset.id,
                    marker = this.geodata[geoId].clusterMarkerItself;

                this.map.setZoom(22);
                this.map.panTo(marker.position);

                let markerData = this.geodata[geoId].clusterMarkerInfo,
                    latLng = new google.maps.LatLng(markerData.lat, markerData.lng);

                new MarkerPopupBuilder([
                    markerData.address,
                    geoId,
                    latLng
                ], markerData, false, this.map).createPopup();
            }
        });  
    }

    ClusterPopupBuilder.prototype.getIsMarker = function() {
        this.isMarker = false;
    }

    return {
        ClusterPopupBuilder,
        MarkerPopupBuilder     
    }
});

/***/ })
/******/ ]);