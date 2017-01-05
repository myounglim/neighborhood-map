// Google Map
var map;

// Used for storing all the Google Map markers here
var markers = [];

/*
 * Featured locations on the Google Map
 * The Location model will use these attributes to store
 * Need to specify title and location to be shown on the map
 * The Yelp Id is used for the Yelp Api
 */
var myLocations = [{
        title: 'Los Angeles County Museum of Art',
        location: {
            lat: 34.0639323,
            lng: -118.3592293
        },
        yelpId: 'lacma-los-angeles-county-museum-of-art-los-angeles-3'
    },
    {
        title: 'Hollywood Sign',
        location: {
            lat: 34.1341151,
            lng: -118.3215482
        },
        yelpId: 'hollywood-sign-hollywood'
    },
    {
        title: 'Los Angeles Zoo',
        location: {
            lat: 34.1483926,
            lng: -118.284088
        },
        yelpId: 'los-angeles-zoo-and-botanical-gardens-los-angeles'
    },
    {
        title: 'Dodgers Stadium',
        location: {
            lat: 34.073851,
            lng: -118.2399583
        },
        yelpId: 'dodger-stadium-los-angeles'
    },
    {
        title: 'University of Southern California',
        location: {
            lat: 34.0223519,
            lng: -118.285117
        },
        yelpId: 'university-of-southern-california-los-angeles-14'
    },
    {
        title: 'Griffith Observatory',
        location: {
            lat: 34.1184341,
            lng: -118.3003935
        },
        yelpId: 'griffith-observatory-los-angeles-2'
    }
];

/* MODEL */
var Location = function(data) {
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.location);
    this.marker = new google.maps.Marker({
        map: map,
        position: data.location,
        title: data.title,
        animation: google.maps.Animation.DROP
    });
    this.yelpId = data.yelpId;
};

/* VIEWMODEL */
var ViewModel = function() {

    var self = this;
    this.locationList = ko.observableArray([]);
    var infowindow = new google.maps.InfoWindow();

    // populate ViewModel's locationList and attach click listeners to each of the markers
    myLocations.forEach(function(location) {
        var newLoc = new Location(location);
        markers.push(newLoc.marker);
        newLoc.marker.addListener('click', function() {
            self.populateInfoWindow(this);
            self.setBounceAnimation(this);
        });
        self.locationList.push(newLoc);
    });

    // open an infowindow on the marker
    // Credit to Udacity's Google Maps API course at https://www.udacity.com/course/google-maps-apis--ud864
    this.populateInfoWindow = function(marker) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent('<h4>' + marker.title + '</h4>' +
                '<h6>Total Reviews: ' + marker.yelpReviewCount + '</h6>' +
                '<img src=' + marker.yelpRatingImg + ' alt=Yelp rating of ' + marker.yelpRating + ' stars' + ' >' +
                '<h5><a href=' + marker.yelpUrl + ' target=_blank>' + 'Yelp Page' + '</a></h5>');
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    };

    // Set a bouncing animation on the marker
    // Only have one marker bouncing at a time so set all the markers animation to null beforehand
    this.setBounceAnimation = function(marker) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setAnimation(null);
        }
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 700 * 3);
    };

    // call populateInfoWindow and setBounceAnimation when user clicks an item on the list
    this.onListClicked = function(locObj) {
        self.populateInfoWindow(locObj.marker);
        self.setBounceAnimation(locObj.marker);
    };

    // Filter the list and the markers on the map based on what the user types in the search box
    // The filter variable stores the text in the input form and if filter is not null/undefined
    // return an array that contains the same string sequence as the searched term
    // if filter is null/undefined, simply return the whole list
    this.filter = ko.observable();
    this.filterList = ko.computed(function(param) {
        var filter = self.filter();
        if (filter) {
            var filteredArr = [];
            self.locationList().forEach(function(location) {
                if (location.title().toLowerCase().includes(filter.toLowerCase())) {
                    filteredArr.push(location);
                    location.marker.setVisible(true);
                } else
                    location.marker.setVisible(false);
            });
            return filteredArr;
        } else {
            self.locationList().forEach(function(location) {
                location.marker.setVisible(true);
            });
            return self.locationList();
        }
    });

};

/*
 * Initializes GoogleMap centering around Los Angeles
 * Once the map is initialized, create the viewModel and apply the bindings
 */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 34.045129,
            lng: -118.2438096
        },
        zoom: 12
    });

    // Set the map height dynamically to be equal to the width
    $('#map').css('height', function() {
        return $(this).width();
    });

    var viewModel = new ViewModel();
    ko.applyBindings(viewModel);
    viewModel.locationList().forEach(function(location) {
        yelp_call(location);
    });
}

/*
 * Called when Google Map API fails
 * Alert the user
 */
function mapError() {
    window.alert('Google Maps has failed to load. Try reloading the page.');
}

/*
 * Generates a random number and returns it as a string for OAuthentication
 * @return {string}
 */
function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
}

/*
 * Ajax request to Yelp Api using jQuery
 * Credit to Udacity's Mark Nguyen
 * https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699/4
 */
function yelp_call(locationObj) {
    var yelp_url = 'https://api.yelp.com/v2/business/' + locationObj.yelpId;
    var YELP_KEY = 'AjrnQAF5szygR6qPyuNXYw';
    var YELP_TOKEN = 'ecH6g864K_8N6ZOId3kH-JPLCXzOAT_u';
    var YELP_KEY_SECRET = 'X3zdDVBezqmcqMp5fb2Kgxk7FWs';
    var YELP_TOKEN_SECRET = '_XjdenoW_AXO6Uzn8ixVodoDJzo';

    var parameters = {
        oauth_consumer_key: YELP_KEY,
        oauth_token: YELP_TOKEN,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: '1.0',
        callback: 'cb' // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
    };

    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
    parameters.oauth_signature = encodedSignature;

    var settings = {
        url: yelp_url,
        data: parameters,
        cache: true, // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
        dataType: 'jsonp'
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings)
        .done(function(results) {
            locationObj.marker.yelpRating = results.rating;
            locationObj.marker.yelpUrl = results.mobile_url;
            locationObj.marker.yelpReviewCount = results.review_count;
            locationObj.marker.yelpRatingImg = results.rating_img_url;
        })
        .fail(function(error) {
            window.alert('Yelp API failed to load. Try reloading the page.');
        });
}