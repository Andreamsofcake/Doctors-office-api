'use strict';

process.env.NODE_ENV = 'testing';
// NODE_ENV=testing ./node_modules/.bin/knex migrate:latest

var _ = require('lodash');
var expect = require('chai').expect;
var bluebird = require('bluebird');
var request = bluebird.promisifyAll(require('request'));
var util = require('util');
var server = require('../server');
var app = server.app;
var knex = server.knex;
var Doctor = server.Doctor;
var server;
var port = 38239;
var baseURL = util.format('http://localhost:%d', port);


describe('api', function() {

  before(function(done) {
    server = app.listen(port, done);
  });

  after(function(done) {
    server.close(done);
  });
//two test one for doctors one for patients
  beforeEach(function(done) {
    knex('doctors').delete().then(function() {
      return knex.raw('alter sequence doctors_id_seq restart');
    }).then(function() { done(); }, done);
    // knex('patients').delete().then(function(){ done(); }, done);
  });

  it('handles POST /api/doctors', function(done) {
    var data = {
      name: 'Whitney Young',
      specialty: 'Proctologist',
    };
    request.post(baseURL + '/api/doctors', { form: data }, function(err, response, body) {
      Doctor.fetchAll().then(function(doctors) {
        expect(JSON.parse(body)).to.eql({
          doc: {
            id: 1,
            name: 'Whitney Young',
            specialty: 'Proctologist',
          }
        })
        expect(doctors.toJSON()).to.eql([{
          id: 1,
          name: 'Whitney Young',
          specialty: 'Proctologist',
        }]);
      })
      .done(done, done);
    });
  });

  it('rejects POST /api/doctors when there is too much info', function(done) {
    var data = {
      firstName: 'Whitney',
      lastName: 'Young',
      address: 'Chicago',
      puppies: '12 of them'
    };
    request.post(baseURL + '/api/doctors', { form: data }, function(err, response, body) {
      expect(JSON.parse(body)).to.eql({ error: 'Invalid request. Properties don\'t match allowed values.' });
      expect(response.statusCode).to.eql(400);
      Doctor.fetchAll().then(function(doctors) {
        expect(doctors.toJSON()).to.eql([]);
      })
      .done(done, done);
    })
  });

  it('handles GET /api/doctors', function(done) {
    var data = {
      name: 'Whitney Young',
      specialty: 'Proctologist',
    };
    Doctor.forge(data).save().then(function() {
      return request.getAsync(baseURL + '/api/doctors');
    }).spread(function(response, body) {
      expect(JSON.parse(body)).to.eql({
        doctors: [{
          id: 1,
          name: 'Whitney Young',
          specialty: 'Proctologist',
        }]
      });
    })
    .then(done, done);
  });
});
