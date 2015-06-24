/* jshint mocha: true */

var debug = require('debug')('loopback-ds-pagination-mixin');

var loopback = require('loopback');
var lt = require('loopback-testing');

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var sinon = require('sinon');
chai.use(require('sinon-chai'));
require('mocha-sinon');

// Create a new loopback app.
var app = loopback();

// Set up promise support for loopback in non-ES6 runtime environment.
global.Promise = require('bluebird');

// import our Changed mixin.
require('./')(app);

// Configure datasource
dbConnector = loopback.memory();

describe('loopback datasource paginate mixin', function() {

  beforeEach(function(done) {

    // A model with 2 Changed properties.
    var Item = this.Item = loopback.PersistedModel.extend('item', {
      name: String,
      description: String,
      status: String
    }, {
      mixins: {
        Paginate: {
          options: {
            limit: '10'
          }
        }
      }
    });

    Item.attachTo(dbConnector);
    app.model(Item);

    app.use(loopback.rest());
    app.set('legacyExplorer', false);
    done();
  });

  lt.beforeEach.withApp(app);

  describe('Testing behaviour', function() {
    for(var i = 1; i <= 49; i++) {
      lt.beforeEach.givenModel('item', {
        name:'Item' + i,
        description: 'This is item with id' + i,
        status: 'active'
      }, 'item' + i);
    }


    describe('Model.find', function() {
      it('Default find operation.', function(done) {

        this.Item.find().then(function(result){
          assert.equal(result.length, 49, 'Should return all items');
          done();
        });

      });
    });

    describe('Model.paginate', function() {
      it('Paginate without parameters', function(done) {
        this.Item.paginate().then(function(result){
          console.log('result', result.paging);
          assert.equal(result.paging.totalItems, 49, 'Should return total items');
          assert.equal(result.paging.totalPages, 5, 'Should return total pages');
          assert.equal(result.paging.itemsPerPage, 10, 'Should items per page');
          assert.equal(result.paging.currentPage, 1, 'Should return current page');
          assert.equal(result.result.length, 10, 'Should return one page');
          done();
        });
      });

      it('Paginate with where filter', function(done) {
        var page = 1;
        var limit = 10;
        this.Item.paginate(page, limit, {
          where: {
            name: 'Item1'
          }
        }).then(function(result){
          assert.equal(result.paging.totalItems, 1, 'Should return total items');
          assert.equal(result.paging.totalPages, 1, 'Should return total pages');
          assert.equal(result.paging.itemsPerPage, limit, 'Should items per page');
          assert.equal(result.paging.currentPage, page, 'Should return current page');
          assert.equal(result.result.length, 1, 'Should return the right number of items');
          done();
        });
      });


      it('Paginate with small page', function(done) {
        var page = 1;
        var limit = 4;
        this.Item.paginate(page, limit).then(function(result){
          assert.equal(result.paging.totalItems, 49, 'Should return total items');
          assert.equal(result.paging.totalPages, 13, 'Should return total pages');
          assert.equal(result.paging.itemsPerPage, limit, 'Should items per page');
          assert.equal(result.paging.currentPage, page, 'Should return current page');
          assert.equal(result.result.length, limit, 'Should return the right number of items');
          done();
        });
      });
    });

  });
});
