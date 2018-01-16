/** Defines the Popup class. */


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
    export let MarkerPopupBuilder = function(geoData, markerData, eventLatLng, map) {
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
    export let ClusterPopupBuilder = function(geodata, latLng, map) {
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


    

    // return {
    //     ClusterPopupBuilder,
    //     MarkerPopupBuilder     
    // }
