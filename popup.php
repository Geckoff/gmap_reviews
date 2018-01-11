<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <title>Creating a Custom Popup</title>
    <script src="https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js"></script>
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
       //width: 200px;
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
        //max-height: 60px;
        box-shadow: 0px 2px 10px 1px rgba(0,0,0,0.5);
      }
      .infoblock {
        width: 250px;
      }
      .cluster-infoblock {
        width: 250px;
      }
      .cluster-addressblock {
        margin-bottom: 10px;
        border-bottom: 1px solid #ccc;
      }
      .cluster-address {
        text-decoration: underline;
        color: blue;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      'use strict';
var map, popup, testpopup, Popup, PopupBuilder, MarkerPopupBuilder, ClusterPopupBuilder, storageData, markersObj = {}, markerCluster, openedPopup = false;

storageData = localStorage.data ? JSON.parse(localStorage.data) : {};

ClusterIcon.prototype.onAdd = function() {
  this.div_ = document.createElement('DIV');
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);

    var markers = this.cluster_.markers_;
    var reviewsCount = 0;
    markers.forEach((marker) => {
        var id = marker.customInfo;

        reviewsCount += storageData[id].comments.length;
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
    setTimeout(() => {
      openedPopup.onRemove();
    }, 0);
  });
};

//definePopupClass();

/** Initializes the map and the custom popup. */
function initMap() {
  definePopupClass();

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -33.9, lng: 151.1},
    zoom: 18,
  });

  google.maps.event.addListener(map, 'click', openPopup);

  map.addListener('zoom_changed', function() {
    if (document.querySelector('.close')) {
      document.querySelector('.close').click();
    }
  });

  buldMarkers();   
  markerClicks(); 
  generateClusters();
}

function generateClusters() {
    if (typeof markerCluster === 'object') {
      markerCluster.clearMarkers();
    }
    var markersArr = [];
    for (var marker in markersObj) {
      markersArr.push(markersObj[marker]); 
    }
    markerCluster = new MarkerClusterer(map, markersArr, {
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      zoomOnClick: false
    });

  google.maps.event.addListener(markerCluster, 'clusterclick', function(cluster) {
      var latLng = new google.maps.LatLng(cluster.center_.lat(), cluster.center_.lng()); 
      var geodata = cluster.markers_;
      //createPopup('cluster', geodata, latLng);
      new ClusterPopupBuilder(geodata, latLng).createPopup();
  }); 
}

function openPopup(event) {
    var isMarker = false;
    var address = '';

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
                  var coords = [location.lat(), location.lng()];
                  var coordsId = 'id' + lat + lng;
                  resolve([address, coordsId, coords]); 
              });                
          });
      })
      //.then((geodata) => {createPopup('location', geodata, event.latLng)})
      .then((geodata) => {
            new MarkerPopupBuilder(geodata, event.latLng).createPopup();
      })
      .catch((e) => {console.log(e)});
  }














function createPopup(type, geodata, latLng = false) {

  var elem = document.createElement('div');

  if (type === 'location') {
    var comments = "",
      isMarker = false;

    if (storageData.hasOwnProperty(geodata[1])) {
        isMarker = true;
        var obj = storageData[geodata[1]];
        latLng = new google.maps.LatLng(obj.lat, obj.lng); 
         obj.comments.forEach((comment) => {
        comments += `<div>${comment}</div>`;   
      });
        
    } 

    elem.innerHTML = `${geodata[0]}<br>${geodata[1]}<br><input type="text" data-address="${geodata[0]}" data-lat="${geodata[2][0]}" data-lng="${geodata[2][1]}" data-geodataid="${geodata[1]}" class="input-review"><br><div class="reviews-block">${comments}</div><br><button class="save-review">Save</button><span class="close" style="color:red; cursor: pointer">X</span>`;

    var testpopup = new Popup(
        latLng,
        elem,
        isMarker
    ); 
  } else if (type === 'cluster') {
     var close = `<span class="close" style="color:red; cursor: pointer">X</span>`;
      var dataBlock = document.createElement('div');
      dataBlock.innerHTML = close;
      dataBlock.classList.add('infoblock');
      geodata.forEach((cluster) => {
          var id = cluster.customInfo;
          var dataObj = storageData[id];
          var addressBlock = document.createElement('div');
          addressBlock.classList.add('addressblock');
          var addressInfo = `<div data-id="${id}" class="cluster-address">${dataObj.address}</div>`;
          addressBlock.innerHTML = addressInfo;

          var clusteCommentsBlock = document.createElement('div');
          clusteCommentsBlock.classList.add('cluster-comments-block');

          var clusterComments = '';
          dataObj.comments.forEach((comment) => {
            clusterComments += `<div class='single-cluster-comment'>${comment}</div>`;  
          });
          clusteCommentsBlock.innerHTML = clusterComments;
          addressBlock.appendChild(clusteCommentsBlock);
          dataBlock.appendChild(addressBlock);
      });

      dataBlock.addEventListener('click', (e) => {
        if (e.target.classList.contains('cluster-address')) {
            var addressId = e.target.dataset.id;
            var marker = markersObj[addressId];
            map.setZoom(22);
            map.panTo(marker.position);

            var storageElem = storageData[addressId];

            createPopup('location', [
              storageElem.address,
              addressId,
              [storageElem.lat, storageElem.lng]
            ]);
        }
      });
      //var testpopup = new Popup(
      testpopup = new Popup(
        latLng,
        dataBlock,
        false
      );
  }

  if (openedPopup) {    
    openedPopup.onRemove();  
  }
  openedPopup = testpopup;

  testpopup.anchor.addEventListener('click', (e) => {
      if (e.target.classList.contains('close')) {
        testpopup.onRemove();
      }
  });

  testpopup.setMap(map);
}


function placeMarker(location, quantity, id) {
  
  var marker = new google.maps.Marker({
      position: location, 
      map: map,
      label: quantity,
      customInfo: id
  });
  markersObj[id] = marker;
  marker.addListener('click', openPopup); 
}

function addToStorage(id, comment, lat, lng, address) {
  if (!(id in storageData)) {
    storageData[id] = {};  
    var elem = storageData[id];
    elem.lat = lat;
    elem.lng = lng;
    elem.address = address;
    elem.comments = [];
  } 
  var elem = storageData[id]; 
  elem.comments.push(comment);
  localStorage.data = JSON.stringify(storageData);
}

function buldMarkers() {
  if (localStorage.data) {
      var markersData = JSON.parse(localStorage.data);
      for (var marker in markersData) {
        var location = {lat: parseFloat(markersData[marker].lat), lng: parseFloat(markersData[marker].lng)};
        var quantity = markersData[marker].comments.length.toString();
        var id = marker;
        placeMarker(location, quantity, id);  
      }  
  }
}

function markerClicks() {
  for (var marker in markersObj) {
    markersObj[marker].addListener('click', openPopup);   
  }
}



/** Defines the Popup class. */
function definePopupClass() {
  /**
   * A customized popup on the map.
   * @param {!google.maps.LatLng} position
   * @param {!Element} content
   * @constructor
   * @extends {google.maps.OverlayView}
   */
  Popup = function(position, content, isMarker) {
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
            if (e.type === 'click' && e.target.classList.contains('save-review')) {
                var text = e.target.parentNode.querySelector('.input-review').value;
                var id = e.target.parentNode.querySelector('.input-review').dataset.geodataid;
                var lat = parseFloat(e.target.parentNode.querySelector('.input-review').dataset.lat);
                var lng = parseFloat(e.target.parentNode.querySelector('.input-review').dataset.lng);
                var address = e.target.parentNode.querySelector('.input-review').dataset.address;
                var commentNode = document.createElement('div');
                commentNode.textContent = text;

                var newLocation = false;
                if (!storageData.hasOwnProperty(id)) {
                    newLocation = true;
                }

                addToStorage(id, text, lat, lng, address);

                if (!newLocation) {
                  markersObj[id].setMap(null); 
                  markersObj[id] = null;                  
                } 

                this.querySelector('.reviews-block').appendChild(commentNode);

                var quant = storageData[id].comments.length.toString();

                placeMarker({lat: lat, lng: lng}, quant, id);

                if (newLocation) {
                  this.querySelector('.close').click();
                  var geodata = [];
                  geodata[0] = address;
                  geodata[1] = id;
                  geodata[2] = [];
                  geodata[2][0] = lat;
                  geodata[2][1] = lng;
                  createPopup('location', geodata);
                }                 
                
                generateClusters(); 
            }
            
          });
        });
  }

    const inherit = function(child, parent) {
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child; // в этом случае constructor не нужен, но его можно и оставить
        child.prototype.parent = parent; 
    }

    
    /**
     * @param {Array} geodata
     * @param {Object} latLng
     */
    PopupBuilder = function(geodata, latLng) {
        this.setData(geodata, latLng);               
        this.getIsMarker();
    }

    inherit(PopupBuilder, Popup); 

    PopupBuilder.prototype.setData = function(geodata, latLng) {
        this.geodata = geodata;
        this.latLng = latLng;
    }

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

        PopupBuilder.prototype.parent.call(this, this.latLng, this.elem, this.isMarker);
        
        if (openedPopup) {    
            openedPopup.onRemove();
        } 
        openedPopup = this;

        this.anchor.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                this.onRemove();
            }
        });

        this.setMap(map);
    }

    /**
     * @param {Array} geodata
     * @param {Object} latLng
     */
    MarkerPopupBuilder = function(geodata, latLng) {

        this.parent.call(this, geodata, latLng);
        this.getMarkerData();
        this.getLatLng(); 
        this.getHtml();
    }

    inherit(MarkerPopupBuilder, PopupBuilder); 

    MarkerPopupBuilder.prototype.getMarkerData = function() {
        if (storageData.hasOwnProperty(this.geodata[1])) {
            console.log(this.geodata[1]);
            this.markerData = storageData[this.geodata[1]];
            console.log(this.markerData );
        } else {
            this.markerData = false;
        }
    }

    MarkerPopupBuilder.prototype.getLatLng = function() {
        if (this.markerData) {
            this.latLng =  new google.maps.LatLng(this.markerData.lat, this.markerData.lng);       
        }  
    }

    MarkerPopupBuilder.prototype.getIsMarker = function() {
        this.isMarker = storageData.hasOwnProperty(this.geodata[1]) ? true : false;
    }

    MarkerPopupBuilder.prototype.getHtml = function() {
        this.parent.prototype.getHtml.call(this);
        let comments = '';
        if (this.markerData) {
            console.log(this.markerData);
            this.markerData.comments.forEach((comment) => {
                comments += `<div>${comment}</div>`;     
            });     
        }
        this.contentWrapper.innerHTML = `${this.geodata[0]}<br>${this.geodata[1]}<br><input type="text" data-address="${this.geodata[0]}" data-lat="${this.geodata[2][0]}" data-lng="${this.geodata[2][1]}" data-geodataid="${this.geodata[1]}" class="input-review"><br><div class="reviews-block">${comments}</div><br><button class="save-review">Save</button>`;
    }

    /**
     * @param {Array} geodata - array of marker objects
     * @param {Object} latLng
     */
    ClusterPopupBuilder = function(geodata, latLng) {
        this.parent.call(this, geodata, latLng);        
        this.getHtml();
        this.setClusterClicks();
    }

    inherit(ClusterPopupBuilder, PopupBuilder); 

    ClusterPopupBuilder.prototype.getHtml = function() {
        this.parent.prototype.getHtml.call(this);
        this.contentWrapper.classList.add('infoblock');
        this.geodata.forEach((marker) => {
            let id = marker.customInfo;
            let dataObj = storageData[id];
            let addressBlock = document.createElement('div');
            addressBlock.classList.add('cluster-addressblock');
            let addressInfo = `<div data-id="${id}" class="cluster-address">${dataObj.address}</div>`;
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
        });
    }

    ClusterPopupBuilder.prototype.setClusterClicks = function() {
        this.contentWrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('cluster-address')) {
                var addressId = e.target.dataset.id;
                var marker = markersObj[addressId];
                map.setZoom(22);
                map.panTo(marker.position);

                var storageElem = storageData[addressId];
                new MarkerPopupBuilder([
                    storageElem.address,
                    addressId,
                    [storageElem.lat, storageElem.lng]
                ], false).createPopup();
            }
        });  
    }

    ClusterPopupBuilder.prototype.getIsMarker = function() {
        this.isMarker = false;
    }







    // var close = `<span class="close" style="color:red; cursor: pointer">X</span>`;
    //   var dataBlock = document.createElement('div');
    //   dataBlock.innerHTML = close;
    //   dataBlock.classList.add('infoblock');
    //   geodata.forEach((cluster) => {
    //       var id = cluster.customInfo;
    //       var dataObj = storageData[id];
    //       var addressBlock = document.createElement('div');
    //       addressBlock.classList.add('addressblock');
    //       var addressInfo = `<div data-id="${id}" class="cluster-address">${dataObj.address}</div>`;
    //       addressBlock.innerHTML = addressInfo;

    //       var clusteCommentsBlock = document.createElement('div');
    //       clusteCommentsBlock.classList.add('cluster-comments-block');

    //       var clusterComments = '';
    //       dataObj.comments.forEach((comment) => {
    //         clusterComments += `<div class='single-cluster-comment'>${comment}</div>`;  
    //       });
    //       clusteCommentsBlock.innerHTML = clusterComments;
    //       addressBlock.appendChild(clusteCommentsBlock);
    //       dataBlock.appendChild(addressBlock);
    //   });

    //   dataBlock.addEventListener('click', (e) => {
    //     if (e.target.classList.contains('cluster-address')) {
    //         var addressId = e.target.dataset.id;
    //         var marker = markersObj[addressId];
    //         map.setZoom(22);
    //         map.panTo(marker.position);

    //         var storageElem = storageData[addressId];

    //         createPopup('location', [
    //           storageElem.address,
    //           addressId,
    //           [storageElem.lat, storageElem.lng]
    //         ]);
    //     }
    //   });
    //   //var testpopup = new Popup(
    //   testpopup = new Popup(
    //     latLng,
    //     dataBlock,
    //     false
    //   );
}





    </script>
    <script 
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyASmYPQ8oqhA2QjMtTl0SsQN4u94HgHm_M&callback=initMap">
    </script>

    <script>
          
    </script>
  </body>
</html>