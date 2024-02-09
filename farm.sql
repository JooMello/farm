-- MySQL Workbench Synchronization
-- Generated: 2022-12-26 14:38
-- Model: New Model
-- Version: 1.0
-- Project: Name of the project
-- Author: paoqu

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `farm` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;

CREATE TABLE IF NOT EXISTS `farm`.`compras` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `data` DATE NOT NULL,
  `quantidade` VARCHAR(255) NOT NULL,
  `unitario` VARCHAR(255) NOT NULL,
  `total` VARCHAR(255) NOT NULL,
  `dolar` VARCHAR(255) NOT NULL,
  `amount` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `investidoreId` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `investidoreId` (`investidoreId` ASC) VISIBLE,
  CONSTRAINT `compras_ibfk_1`
    FOREIGN KEY (`investidoreId`)
    REFERENCES `farm`.`investidores` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 43
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `farm`.`dcs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `data` DATE NOT NULL,
  `valor` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `investidoreId` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `investidoreId` (`investidoreId` ASC) VISIBLE,
  CONSTRAINT `dcs_ibfk_1`
    FOREIGN KEY (`investidoreId`)
    REFERENCES `farm`.`investidores` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `farm`.`investidores` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `cpf` VARCHAR(255) NOT NULL,
  `cep` VARCHAR(255) NOT NULL,
  `logradouro` VARCHAR(255) NOT NULL,
  `uf` VARCHAR(255) NOT NULL,
  `cidade` VARCHAR(255) NOT NULL,
  `number` VARCHAR(255) NOT NULL,
  `obs` TEXT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 15
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `farm`.`mortes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `data` DATE NOT NULL,
  `quantidade` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `investidoreId` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `investidoreId` (`investidoreId` ASC) VISIBLE,
  CONSTRAINT `mortes_ibfk_1`
    FOREIGN KEY (`investidoreId`)
    REFERENCES `farm`.`investidores` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 18
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `farm`.`saques` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `data` VARCHAR(255) NOT NULL,
  `valor` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `investidoreId` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `investidoreId` (`investidoreId` ASC) VISIBLE,
  CONSTRAINT `saques_ibfk_1`
    FOREIGN KEY (`investidoreId`)
    REFERENCES `farm`.`investidores` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 26
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `farm`.`vendas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `data` DATE NOT NULL,
  `quantidade` VARCHAR(255) NOT NULL,
  `unitario` VARCHAR(255) NOT NULL,
  `total` VARCHAR(255) NOT NULL,
  `dolar` VARCHAR(255) NOT NULL,
  `amount` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `investidoreId` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `investidoreId` (`investidoreId` ASC) VISIBLE,
  CONSTRAINT `vendas_ibfk_1`
    FOREIGN KEY (`investidoreId`)
    REFERENCES `farm`.`investidores` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 21
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
