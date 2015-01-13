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

var avatarRoot = (process.argv.length == 3) ? process.argv[2] : __dirname + '/avatars/';
var sequelize = new Sequelize(config.database, config.user,
  config.password, {
    dialect: config.driver,
    logging: console.log,
    define: {
      timestamps: false
    }
  });
var emsg = {
  "id": null,
  "avatar-url": null
};

var Player = sequelize.define('players', {
  facebookId: Sequelize.TEXT,
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
  //  console.log(new Error()
  //    .stack);
  FB.setAccessToken(token);
  FB.api('me/', function(res) {
    if (!res || res.error) {
      onError(res.error);
      console.log(!res ? 'error occurred' : res.error);
      return;
    }
    onSuccess(res.id);
  });
}

router.post('/avatars', jsonparser, function(req, res) {
  //  var token = req.body.token;
  var authorization = req.get('Authorization');
  console.log(authorization);

  if (typeof authorization !== 'string') {
    authorization = "";
    console.log('------------------');
  }
  var shards = authorization.split(' ');
  //  console.log(shards);
  if (shards.length != 2) {
    res.status(400)
      .json({
        message: "Access token required"
      });
    return;
  }
  var token = shards[1];
  handleFacebook(token, function(facebook) {
    var player = Player.build();
    player.retrieveByFacebookId(facebook, function(players) {
      if (players) {
        var filename = crypto.randomBytes(24)
          .toString("hex") + ".png";
        console.log(avatarRoot + filename);
        fs.writeFile(avatarRoot + filename, req.body.data, "base64", function(err) {
          console.log(filename);
        });
        player = Player.build({
          facebookId: facebook,
          avatarUrl: '/avatars/' + filename
        });
        player.updateByFacebookId(facebook, function() {
          res.set('location', player.avatarUrl);
          res.status(204)
            .end();

        }, function(error) {
          res.status(500)
            .json(error);
        });
      } else {
        res.status(401)
          .json({
            message: "Player not found"
          });
      }
    }, function(error) {
      res.status(500)
        .json(error);
    });
  }, function(error) {
    res.status(500)
      .json(error);
  });

}, function(error) {
  res.json(err);
});

router.get('/favicon.ico', function(req, res) {
  res.status(404)
    .end();
});

router.get('/me', jsonparser, function(req, res) {
  var player = Player.build();
  console.log(req.query);
  var token = req.query.token;

  handleFacebook(token, function(facebook) {
    player.retrieveByFacebookId(facebook, function(players) {
      if (players) {
        emsg.id = players.id;
        emsg["avatar-url"] = players.avatarUrl;
        res.json(emsg);
      } else {
        var player = Player.build({
          facebookId: facebook,
          avatarUrl: null
        });
        player.add(function(success) {
          emsg.id = success.id;
          emsg["avatar-url"] = success.avatarUrl;
          console.log(emsg);
          res.json(emsg);
        }, function(error) {
          res.status(500)
            .json(error);
        });
      }
    }, function(error) {
      res.status(500)
        .json(error);
    });
  }, function(error) {
    res.status(500)
      .json(error);
  });

}, function(error) {
  res.status(500)
    .json(error);
});

//working
router.get('/players/:playerId', jsonparser, function(req, res) {
  var player = Player.build();
  player.retrieveById(req.params.playerId, function(players) {
    if (players) {
      emsg.id = players.id;
      emsg["avatar-url"] = players.avatarUrl;
      res.json(emsg);
    } else {
      res.status(500)
        .json({
          message: "Player not found"
        });
    }
  }, function(error) {
    res.status(500)
      .json(error);
  });
});
//working
router.get('/avatars/:name', jsonparser, function(req, res) {
  var player = Player.build();
  player.retrieveByAvatarName(req.params.name, function(players) {
    if (players) {
      res.sendFile(req.params.name, {
        root: avatarRoot,
        dotfiles: 'deny'
      }, function(error) {
        res.status(500)
          .end();
      });
      /*  var base64data = null;
        fs.readFile('./avatars/' + req.params.name, function(error, data) {
          if (error) {
            res.json(error);
          } else {
            base64data = new Buffer(data)
              .toString('base64');
            res.sendFile('./avatars/' + req.params.name);

          }
        });
        */
    } else {
      res.status(401)
        .json({
          message: "avatar not found"
        });
    }
  }, function(error) {
    console.log(error);
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
