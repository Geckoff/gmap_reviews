/** Defines the Popup class. */
var $ = require("jquery");
import 'slick-carousel';


export default function(google) { 
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
        elem.innerHTML = `<span class="close ${this.constructor.name}"><i class="fas fa-times"></i></span>`;
        contentWrapper.classList.add('popup-content-wrapper');
        elem.appendChild(contentWrapper);
        this.contentWrapper = contentWrapper;
        this.elem = elem;
    }

    PopupBuilder.prototype.createPopup = function() {
        this.getHtml();
        this.getIsMarker();
        
        PopupBuilder.prototype.parent.call(this, this.latLng, this.elem, this.isMarker);

        this.anchor.querySelector('.close').addEventListener('click', (e) => {
                this.onRemove();
        });


        if (document.querySelector('.close')) {
            document.querySelector('.close').click();
        }
        this.setMap(this.map);
        this.setEvents();
    }


    /**
     * @param {Array} geodata
     * @param {Object} markerData - element of global marker data array
     * @param {google.maps.LatLng} eventLatLng - google maps latlng obj
     * @param {google.maps.Map} map - google maps map obj
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
        this.contentWrapper.classList.add('single-address-block');
        let comments = '';

        if (this.markerData) {
            this.markerData.comments.forEach((comment) => {
                comments += `<div class="address-comment-block"><div class="address-comment-block-header"><div class="address-comment-block-name">${comment.name}</div><div class="address-comment-block-location-date">${comment.location} - ${comment.date}</div></div><div class="address-comment-block-review">${comment.review}</div></div>`;     
            });     
        } else {
            comments = '<span style="color: #ccc">No comments yet...</span>';   
        }
        this.contentWrapper.innerHTML = `<div class="marker-address"><div><i class="fas fa-map-marker-alt"></i>&nbsp;${this.address}</div></div><div class="reviews-block">${comments}</div><div class="review-form"><div class="form-name">Your Review <span class="warning"></span></div><input type="text" class="name" placeholder="Name"><input type="text" class="location" placeholder="Location"><textarea class="review" rows="5" placeholder="Review"></textarea><div class="save-review save-button">Save</div></div>`;
    }

    MarkerPopupBuilder.prototype.getIsMarker = function() {
        this.isMarker = this.markerData ? true : false;
    }

    // click on Save Review button
    MarkerPopupBuilder.prototype.setEvents = function() {
        this.contentWrapper.querySelector('.save-review').addEventListener('click', () => {
                const review = escapeHtml(this.contentWrapper.querySelector('.review').value),
                      name = escapeHtml(this.contentWrapper.querySelector('.name').value),
                      location = escapeHtml(this.contentWrapper.querySelector('.location').value),    
                      date = getDate(),    
                      geoData = [this.address, this.geoId, this.addresslatLng],
                      commentObj = {name, location, review, date};

                // checking if all fields filled out      
                if (review && name && location) {
                    let markerData = this.markerData,
                        addNewLocation = false;

                    // for existing Marker just saving comment to Marker's object,
                    // for new Location creating new object with Marker Data    
                    if (markerData) {
                        this.markerData.comments.push(commentObj);      
                    } else {
                        markerData = {
                            lat: this.addresslatLng.lat(),
                            lng: this.addresslatLng.lng(),
                            address: this.address,
                            comments: [commentObj]
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

                    // removing existing popup and creating a new one
                    this.onRemove();
                    new MarkerPopupBuilder(geoData, markerData, false, this.map).createPopup();  
                } else {
                    this.contentWrapper.querySelector('.warning').textContent = "All fileds are required!"    
                } 

                function getDate() {
                    let today = new Date(),
                        dd = today.getDate(),
                        mm = today.getMonth()+1,
                        yyyy = today.getFullYear();

                    if(dd<10) {
                        dd = '0'+dd
                    } 
                    if(mm<10) {
                        mm = '0'+mm
                    } 

                    return mm + '/' + dd + '/' + yyyy;
                }     

                function escapeHtml(unsafe) {
                    return unsafe
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                }  
        });      
    }

    /**
     * @param {Object} geodata - object with marker objects and markers' data
     * @param {google.maps.LatLng} eventLatLng - google maps latlng obj
     * @param {google.maps.Map} map - google maps map obj
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
                addressInfo = `<div data-id="${geoId}" class="go-to-address cluster-address">${dataObj.address}</div>`; 
            
            dataObj.comments.forEach((comment) => {
                let clusteCommentsBlock = document.createElement('div'),
                    clusterComments = '';

                clusteCommentsBlock.classList.add('cluster-comments-block');
                clusterComments += addressInfo;
                clusterComments += `<div class='single-cluster-comment'><div class="single-cluster-comment-location">${comment.location}<span class="single-cluster-comment-date">${comment.date}</span></div><div class="single-cluster-comment-review">${comment.review}</div><div class="all-reviews go-to-address" data-id="${geoId}">All Reviews For This Address</div><div class="cluster-zoom-in">Double click on cluster to zoom in.</div></div>`;  
                clusteCommentsBlock.innerHTML = clusterComments;
                this.contentWrapper.appendChild(clusteCommentsBlock); 
            });
              
        }
        $(this.contentWrapper).slick({dots: true});
        this.contentWrapper.querySelector('.slick-next').click();
    }

    // setting clusters' addresses click events
    ClusterPopupBuilder.prototype.setEvents = function() {
        this.contentWrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('go-to-address')) {
                let geoId = e.target.dataset.id,
                    marker = this.geodata[geoId].clusterMarkerItself;

                this.map.setZoom(22);
                this.map.panToWithOffset(marker.position, 0, -220);

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
}