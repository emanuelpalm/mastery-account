var express = require('express');
var app = express();
var fs = require("fs");
var crypto = require("crypto");
var bodyparser = require('body-parser');
var jsonparser = bodyparser.json();
var config = require('./dataBase.json');
var router = express.Router();
var Sequelize = require('sequelize');
var FB = require('fb');

var sequelize = new Sequelize(config.database, config.user,
  config.password, {
    dialect: config.driver,
    logging: console.log,
    define: {
      timestamps: false
    }
  });

var Player = sequelize.define('players', {
  facebookId: Sequelize.INTEGER,
  avatarUrl: Sequelize.TEXT,
}, {
  instanceMethods: {
    add: function(onSuccess, onError) {
      var facebookId = this.facebookId;
      var avatarUrl = this.avatarUrl;

      Player.build({
          facebookId: facebookId,
          avatarUrl: avatarUrl,
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
    retrieveByFacebookId: function(facebookId, onSuccess, onError) {
      Player.find({
          where: {
            facebookId: facebookId
          }
        }, {
          raw: true
        })
        .success(onSuccess)
        .error(onError);
    },
    retrieveByAvatarName: function(avatarName, onSuccess, onError) {
      Player.find({
          where: {
            avatarUrl: avatarName
          }
        }, {
          raw: true
        })
        .success(onSuccess)
        .error(onError);
    },
    updateByFacebookId: function(facebookId, onSuccess, onError) {
      var facebookID = this.facebookId;
      var avatarUrl = this.avatarUrl;

      Player.update({
          avatarUrl: avatarUrl
        }, {
          where: {
            facebookId: facebookID
          }
        })
        .success(onSuccess)
        .error(onError);
    }
  }
});

function handleFacebook(token, onSuccess, onError) {
  FB.setAccessToken(token);
  FB.api('me/', function(res) {
    if (!res || res.error) {
      oneError(res.error);
      console.log(!res ? 'error occurred' : res.error);
      return;
    }
    onsuccess(res.id);
  });
}

router.post('/avatars', jsonparser, function(req, res) {
  var token = req.body.token;
  handleFacebook(token, function(facebook) {
    var player = Player.build();
    player.retrieveByFacebookId(facebook, function(players) {
      if (players) {
        var filename = crypto.randomBytes(24)
          .toString("hex") + ".png";
        fs.writeFile('./avatars/' + filename, req.body.data, "base64", function(err) {
          console.log(filename);
        });
        player = Player.build({
          facebookId: facebook,
          avatarUrl: filename
        });
        player.updateByFacebookId(facebook, function() {
          res.status(200)
            .json({
              location: player.avatarUrl
            });
        }, function(error) {
          res.json(error);
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

}, function(error) {
  res.json(err);
});

router.get('/:token', jsonparser, function(req, res) {
  var player = Player.build();
  console.log(req.query.token);
  var token = req.query.token;

  handleFacebook(token, function(facebook) {
    player.retrieveByFacebookId(facebook, function(players) {
      if (players) {
        res.json(players);
      } else {
        var player = Player.build({
          facebookId: facebook,
          avatarUrl: null
        });
        player.add(function(success) {
          res.json(success);
        }, function(err) {
          res.json(err);
        });
      }
    }, function(error) {
      res.json(error);
    });
  });

}, function(error) {
  res.json(err);
});

//working
router.get('/players/:playerId', jsonparser, function(req, res) {
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
});
//working
router.get('/avatars/:name', jsonparser, function(req, res) {
  var player = Player.build();
  player.retrieveByAvatarName(req.params.name, function(players) {
    if (players) {
      var base64data = null;
      fs.readFile('./avatars/' + req.params.name, function(error, data) {
        if (error) {
          res.json(error);
        } else {
          base64data = new Buffer(data)
            .toString('base64');
          res.json(base64data);
        }
      });
    } else {
      res.status(401)
        .json({
          message: "avatar not found"
        });
    }
  }, function(error) {
    res.json(error);
  });
});

var server = app.listen(8080, function() {
  var host = server.address()
    .address;
  var port = server.address()
    .port;
  console.log(" I'm listening " + host + " " + port);
});

app.use(bodyparser.json({
  limit: '5mb'
}));
app.use(router);