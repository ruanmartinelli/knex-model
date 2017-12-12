/**
 * Create the Database using the following script:
 * @TODO change this to use seeds and migrations
 */

// CREATE DATABASE `test_db`;

// CREATE TABLE `post` (
//   `id` bigint(20) NOT NULL AUTO_INCREMENT,
//   `title` varchar(100) NOT NULL,
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

// CREATE TABLE `user` (
//   `id` bigint(20) NOT NULL AUTO_INCREMENT,
//   `name` varchar(100) NOT NULL,
//   `post_id` bigint(20) NOT NULL,
//   PRIMARY KEY (`id`),
//   KEY `fk_post_user` (`post_id`),
//   CONSTRAINT `fk_post_user` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`)
// ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

// INSERT INTO `test_db`.`post` (`title`) VALUES ('Some cool title');

// INSERT INTO `test_db`.`user` (`name`, `post_id`) VALUES ('John', '1');


const knex = require('knex')

module.exports = knex({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test_db'
  }
})