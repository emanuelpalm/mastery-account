var express = require('express');
var app = express();



var bodyparser = require('body-parser');
var jsonparser = bodyparser.json();

var config = require('./dataBase.json');

var router = express.Router();

var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.user,
  config.password, {
    dialect: config.driver,
    logging: console.log,
    define: {
      timestamps: false
    }
  });


var Player = sequelize.define('players', {
  firstName: Sequelize.STRING(20),
  lastName: Sequelize.STRING(20),
}, {
  instanceMethods: {
    add: function(onSuccess, onError) {
      var firstName = this.firstName;
      var lastName = this.lastName;

      Player.build({
          firstName: firstName,
          lastName: lastName
        })
        .save()
        .success(onSuccess)
        .error(onError);
    },
    retrieveById: function(playerId, onSuccess, onError) {
      Player.find({
          where: {
            id: playerId
          }
        }, {
          raw: true
        })
        .success(onSuccess)
        .error(onError);
    },
    removeById: function(playerId, onSuccess, onError) {
      Player.destroy({
          where: {
            id: playerId
          }
        })
        .success(onSuccess)
        .error(onError);
    }
  }

});

router.route('/player/:playerId')

.all(function(req, res, next) {
  console.log("router is invoked");
  next();
})

.get(jsonparser, function(req, res) {
    var player = Player.build();
    player.retrieveById(req.params.playerId, function(players) {
      if (players) {
        res.json(players);
      } else {
        res.status(401)
          .json({
            message: "Player not found"
          });
      }
    }, function(error) {
      res.json(error);
    });
  })
  .delete(jsonparser, function(req, res) {
    var player = Player.build();

    player.removeById(req.params.playerId, function(players) {
      if (players) {
        res.json({
          message: "Player removed!"
        });
      } else {
        res.status(401)
          .json({
            message: "Player not found"
          });
      }
    }, function(error) {
      res.json(error);
    });
  });
router.put('/player', jsonparser, function(req, res) {

  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var player = Player.build({
    firstName: firstName,
    lastName: lastName
  });

  player.add(function(success) {
    res.json(success);
  }, function(err) {
    res.json(err);
  });
});

var server = app.listen(8080, function() {
  var host = server.address()
    .address;
  var port = server.address()
    .port;
  console.log(" I'm listening " + host + " " + port);
});


app.use(router);