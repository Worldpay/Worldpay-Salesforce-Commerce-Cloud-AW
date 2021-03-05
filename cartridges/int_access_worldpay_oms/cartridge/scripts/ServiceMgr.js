'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Site = require('dw/system/Site');
const currentSite = Site.current.ID;
const auth = require('./services/auth');
const rest = require('./services/rest');

const SERVICES = {
    auth: 'order.management.auth',
    rest: 'order.management.rest'
};

/**
 * Returns the service related to the given {serviceID} initialized with the given {definition}
 * @param {string} serviceID - ID of service
 * @param {Object} definition - Definition
 * @returns {dw/svc/Service} - service object
 */
function getService(serviceID, definition) {
    return LocalServiceRegistry.createService(serviceID, definition);
}

/**
 * Create the pattern for service based on Site ID
 * @param {string} serviceID - ID of service
 * @returns {string} - prepared name
 */
function buildServiceID(serviceID) {
    var fin = serviceID + '-' + currentSite;
    return fin;
}

module.exports = {
    // Returns a new instance of the OMS Auth Service
    auth: function () {
        return getService(buildServiceID(SERVICES.auth), auth);
    },

    restEndpoints: rest.endpoints,

    // Returns a new instance of the OMS REST Service initialized with the {get} definitions
    restGet: function () {
        return getService(buildServiceID(SERVICES.rest), rest.definitions.get);
    },

    // Returns a new instance of the OMS REST Service initialized with the {get} definitions
    restQuery: function () {
        return getService(buildServiceID(SERVICES.rest), rest.definitions.query);
    },

    // Returns a new instance of the Service Cloud REST Service initialized with the {create} definitions
    restCreate: function () {
        return getService(buildServiceID(SERVICES.rest), rest.definitions.create);
    },

    // Returns a new instance of the Service Cloud REST Service initialized with the {update} definitions
    restUpdate: function () {
        return getService(buildServiceID(SERVICES.rest), rest.definitions.update);
    }
};
