-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: smartseed
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `farmers`
--

DROP TABLE IF EXISTS `farmers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmers` (
  `farmer_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `extension_name` varchar(10) DEFAULT NULL,
  `address` text,
  `contact_number` varchar(20) DEFAULT NULL,
  `crop_type` varchar(50) DEFAULT NULL,
  `farm_size` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`farmer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmers`
--

LOCK TABLES `farmers` WRITE;
/*!40000 ALTER TABLE `farmers` DISABLE KEYS */;
INSERT INTO `farmers` VALUES (1,'Juan','Dela Cruz','Santos','Jr.','Palanan, Isabela','09123456789','NSIC Rc 300',3.80),(2,'Maria','Clara','Ibanez','Jr.','Cauayan City','09987654321','NSIC Rc 216 (Tubigan 17)',3.00),(3,'Miguel','Gonzales','Salazar','','Angadanan, Isabela','0922165977','NSIC Rc 222 (Tubigan 18)',2.50),(4,'Kaye','Lopez','Marquez','Jr.','Angadanan, Isabela','0935690568','NSIC Rc 300 (Tubigan 24)',2.98),(5,'Rafael','Santos','Santiago','Sr.','Benito Soliven, Isabela','0990793981','NSIC Rc 300 (Tubigan 24)',2.61),(6,'Kaye','Reyes','Ibanez','','Benito Soliven, Isabela','0918662374','NSIC Rc 222 (Tubigan 18)',4.57),(7,'Leo','Garcia','Salazar','','Burgos, Isabela','0964909069','NSIC Rc 216 (Tubigan 17)',4.24),(8,'Maria','Dela Cruz','Garcia','','Burgos, Isabela','0987043473','NSIC Rc 222 (Tubigan 18)',4.47),(9,'Miguel','Lopez','Lopez','','Cabagan, Isabela','0972612935','NSIC Rc 222 (Tubigan 18)',3.07),(10,'Arvin','Navarro','Padilla','','Cabagan, Isabela','0961619428','NSIC Rc 160',3.64),(11,'Jose','Navarro','Lopez','Sr.','Cordon, Isabela','0922826216','NSIC Rc 300 (Tubigan 24)',2.91),(12,'Carla','Torres','Salazar','','Cordon, Isabela','0913442932','NSIC Rc 216 (Tubigan 17)',3.84),(13,'Jose','Rivera','Cruz','','Dinapigue, Isabela','0994919325','NSIC Rc 160',4.89),(14,'Cindy','Navarro','Marquez','','Dinapigue, Isabela','0960307323','NSIC Rc 160',4.18),(15,'Luis','Navarro','Santiago','','Divilacan, Isabela','0989127334','NSIC Rc 222 (Tubigan 18)',3.43),(16,'Diana','Rivera','Cruz','','Divilacan, Isabela','0952405765','NSIC Rc 222 (Tubigan 18)',3.83),(17,'Miguel','Reyes','Cruz','Jr.','Echague, Isabela','0923169147','NSIC Rc 222 (Tubigan 18)',3.57),(18,'Rafael','Santos','Salazar','','Echague, Isabela','0987034559','NSIC Rc 222 (Tubigan 18)',3.10),(19,'Kaye','Santos','Ibanez','','Gamu, Isabela','0965297218','NSIC Rc 160',2.91),(20,'Luis','Lopez','Ibanez','','Gamu, Isabela','0923291632','NSIC Rc 160',3.11),(21,'Mark','Navarro','Marquez','Sr.','City of Ilagan, Isabela','0926595747','NSIC Rc 160',3.21),(22,'Jomar','Gonzales','Lopez','','City of Ilagan, Isabela','0938479204','NSIC Rc 300 (Tubigan 24)',2.88),(23,'Liza','Dela Cruz','Garcia','','Jones, Isabela','0952101489','NSIC Rc 160',3.38),(24,'Diana','Lopez','Ibanez','','Jones, Isabela','0924444249','NSIC Rc 222 (Tubigan 18)',4.83),(25,'Cindy','Lopez','Marquez','Jr.','Maconacon, Isabela','0976492442','NSIC Rc 222 (Tubigan 18)',2.61),(26,'Jose','Lopez','Lopez','','Maconacon, Isabela','0937989642','NSIC Rc 216 (Tubigan 17)',2.91),(27,'Rafael','Torres','Santiago','Sr.','Naguilian, Isabela','0954022717','NSIC Rc 216 (Tubigan 17)',4.86),(28,'Luis','Lopez','Santiago','','Naguilian, Isabela','0926267812','NSIC Rc 222 (Tubigan 18)',3.11),(29,'Cindy','Rivera','Ibanez','Sr.','Palanan, Isabela','0911124432','NSIC Rc 216 (Tubigan 17)',4.10),(30,'Grace','Lopez','Ibanez','','Palanan, Isabela','0914981659','NSIC Rc 300 (Tubigan 24)',3.31),(31,'Leo','Ramos','Lopez','','Quezon, Isabela','0986434539','NSIC Rc 216 (Tubigan 17)',4.35),(32,'Arvin','Dela Cruz','Marquez','','Quezon, Isabela','0962215809','NSIC Rc 216 (Tubigan 17)',2.56),(33,'Juan','Navarro','Ibanez','','Ramon, Isabela','0934373786','NSIC Rc 300 (Tubigan 24)',4.08),(34,'Carla','Navarro','Lopez','','Ramon, Isabela','0912953586','NSIC Rc 300 (Tubigan 24)',2.71),(35,'Grace','Lopez','Ibanez','','Reina Mercedes, Isabela','0916331042','NSIC Rc 160',4.76),(36,'Kaye','Dela Cruz','Cruz','','Reina Mercedes, Isabela','0926114527','NSIC Rc 222 (Tubigan 18)',4.40),(37,'Carla','Navarro','Ibanez','','San Agustin, Isabela','0920355608','NSIC Rc 160',4.92),(38,'Noel','Dela Cruz','Lopez','','San Agustin, Isabela','0986743252','NSIC Rc 222 (Tubigan 18)',4.70),(39,'Diana','Ramos','Cruz','','San Guillermo, Isabela','0974765676','NSIC Rc 160',4.62),(40,'Noel','Gonzales','Ibanez','','San Guillermo, Isabela','0911316105','NSIC Rc 216 (Tubigan 17)',4.63),(41,'Luis','Navarro','Ibanez','','San Isidro, Isabela','0961261349','NSIC Rc 216 (Tubigan 17)',2.68),(42,'Cindy','Ramos','Santiago','','San Isidro, Isabela','0925091166','NSIC Rc 300 (Tubigan 24)',4.59),(43,'Nina','Gonzales','Lopez','','San Mariano, Isabela','0960831510','NSIC Rc 222 (Tubigan 18)',3.68),(44,'Diana','Navarro','Cruz','','San Mariano, Isabela','0952963637','NSIC Rc 216 (Tubigan 17)',3.14),(45,'Cindy','Navarro','Santiago','','San Mateo, Isabela','0916928722','NSIC Rc 160',3.47),(46,'Liza','Rivera','Salazar','','San Mateo, Isabela','0961511934','NSIC Rc 160',3.67),(47,'Liza','Lopez','Lopez','','San Pablo, Isabela','0923536189','NSIC Rc 300 (Tubigan 24)',4.28),(48,'Leo','Gonzales','Garcia','','San Pablo, Isabela','0996596855','NSIC Rc 300 (Tubigan 24)',3.88),(49,'Juan','Gonzales','Salazar','','Santa Maria, Isabela','0916215701','NSIC Rc 222 (Tubigan 18)',4.94),(50,'Cindy','Lopez','Ibanez','','Santa Maria, Isabela','0954977715','NSIC Rc 216 (Tubigan 17)',3.52),(51,'Cindy','Navarro','Marquez','','Santo Tomas, Isabela','0975352371','NSIC Rc 222 (Tubigan 18)',4.20),(52,'Leo','Reyes','Salazar','','Santo Tomas, Isabela','0930514626','NSIC Rc 300 (Tubigan 24)',4.96),(53,'Jomar','Lopez','Garcia','','Santiago City','0929232014','NSIC Rc 222 (Tubigan 18)',3.12),(54,'Nina','Navarro','Marquez','','Santiago City','0999619354','NSIC Rc 216 (Tubigan 17)',2.81),(55,'Jose','Ramos','Salazar','','Tumauini, Isabela','0957221516','NSIC Rc 300 (Tubigan 24)',2.89),(56,'Kaye','Reyes','Ibanez','','Tumauini, Isabela','0976749626','NSIC Rc 160',4.61),(57,'Arvin','Rivera','Ibanez','','Delfin Albano, Isabela','0983366324','NSIC Rc 160',3.86),(58,'Kaye','Rivera','Salazar','','Delfin Albano, Isabela','0937379183','NSIC Rc 222 (Tubigan 18)',4.67),(59,'Miguel','Ramos','Ibanez','','City of Cauayan, Isabela','0994489440','NSIC Rc 160',2.70),(60,'Rafael','Rivera','Marquez','','City of Cauayan, Isabela','0912781378','NSIC Rc 222 (Tubigan 18)',4.70);
/*!40000 ALTER TABLE `farmers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-21  7:17:58
