CREATE DATABASE IF NOT EXISTS mastery;

GRANT SELECT, INSERT, UPDATE
    ON mastery.*
    TO '{{db.user}}'@'localhost' IDENTIFIED BY '{{db.password}}';

CREATE TABLE IF NOT EXISTS mastery.players (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    facebookId BIGINT UNSIGNED NOT NULL,
    avatarUrl TEXT NULL,
    PRIMARY KEY (id),
    INDEX index_facebook_id (facebookId)
) CHARSET=utf8;

