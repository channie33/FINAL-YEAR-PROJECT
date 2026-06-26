-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: better_space
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
-- Table structure for table `adminmessages`
--

DROP TABLE IF EXISTS `adminmessages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adminmessages` (
  `AdminMessageID` int NOT NULL AUTO_INCREMENT,
  `AdminID` int NOT NULL,
  `StudentID` int DEFAULT NULL,
  `ProfessionalID` int DEFAULT NULL,
  `MessageText` text NOT NULL,
  `SentAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Sender` enum('Student','Professional','Admin') NOT NULL,
  PRIMARY KEY (`AdminMessageID`),
  KEY `AdminID` (`AdminID`),
  KEY `StudentID` (`StudentID`),
  KEY `ProfessionalID` (`ProfessionalID`),
  CONSTRAINT `adminmessages_ibfk_1` FOREIGN KEY (`AdminID`) REFERENCES `admins` (`AdminID`),
  CONSTRAINT `adminmessages_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`),
  CONSTRAINT `adminmessages_ibfk_3` FOREIGN KEY (`ProfessionalID`) REFERENCES `mentalhealthprofessionals` (`ProfessionalID`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adminmessages`
--

LOCK TABLES `adminmessages` WRITE;
/*!40000 ALTER TABLE `adminmessages` DISABLE KEYS */;
INSERT INTO `adminmessages` VALUES (1,10,1,NULL,'enc:derived-v1:8giod4vMDN7rk7mZlrMuuf91BMoWImGbOHA_PxgTS3tjfIV9mJKn-dwbnw-Hlfu3H2oWrH8pMkcqMgK_W5QocxZzhUPye7apb56nY3LimyNzGv-vToQa0w==','2026-02-08 23:48:38','Student'),(2,10,1,NULL,'enc:derived-v1:3MiqVdB2ks-McPi9CCeZ_LW0RAl3dWX30NUWYZDJbh_UnuS4jMa91iMsdfHYkwFU1l3GclG14WyDx9BTx3K6qhOnYdqwoA==','2026-02-17 23:08:23','Admin'),(3,10,2,NULL,'enc:derived-v1:bUARlbLLNsnT0NGbckDBbKpMgeBRoF8aN0vLda3zvBTu0yp9zYJkCeRop4eK4Ip6B2bO66Qnh6vcLyIZiinLZg==','2026-03-01 21:23:35','Student'),(4,10,NULL,10,'enc:derived-v1:ILnJY7sir8jItBMYJIvYW44TFsetxza9ivAf4zaw3f3tXO28-1IlrQMTyhxXZPNCtCNaCaK-hWKj_VHouD-cMaDhv0MfGfOHKAut-Ku6wgk=','2026-03-12 22:42:23','Professional'),(5,10,5,NULL,'enc:derived-v1:SWGTcWlzt1_TLHztLOd_ridxvInV8ShG-maWqyIkyGoJlFjHbmXZ7dVaTWe0bBIk44SWpCCRmeveUFBSQhHoir-QkcU68Zvb1dmKKtjGGPI=','2026-03-12 22:48:16','Student'),(6,10,NULL,3,'enc:derived-v1:jDH1Z1GY58cZ_dnOy1AJnwPVx2Mr0HA_3VNsbxmvfIRi0OTluoeJ3nqAo8RQnuUnr8uXKcQuWqUzFfQ71yikHA==','2026-03-12 22:57:57','Professional'),(7,10,NULL,3,'enc:derived-v1:k4YfInHzQNtOlilxd0uaYSyQMO84StZPJydKTJnI7qyBSYfQFwXfdtfM9fXilBZ_fCa81KxdgmQBOqGmlymwcnXyG_uyKg==','2026-03-13 01:44:39','Admin'),(8,10,5,NULL,'enc:derived-v1:QvuMtdX3hPkKQdL0QamccPJKe2iu11pQdwjEwCXE4YTaPq2EwcKmWFWf_fdw','2026-03-13 01:44:48','Admin'),(9,10,NULL,10,'enc:derived-v1:NQ8en-lsKPAul9NrAck_eWg3SyOqtcpfZSo5013M8sgWmJbkRd2oshy6skKA','2026-03-13 01:44:57','Admin'),(10,10,3,NULL,'enc:derived-v1:tuxD0J-uWk6lYXITnrrHbNcDifN__pxadBdFBVlltxzAcbgUdBt_AkTnvImGuwh3v3weGp9gQI74E-ywhTnqBjolPsM=','2026-03-13 11:32:27','Student'),(11,10,3,NULL,'enc:derived-v1:PC8oCdt2Bz1atqhNfngueDLt_sUW46syCm-jqzo-b-fA_N1wWVQoeQksulwLPWA3oNz4oH6sonw_wUkYLC_06E8R6XbzSCgH0Nsv5iHLnOXkTIwuRHc=','2026-03-13 11:33:34','Admin'),(12,10,7,NULL,'enc:derived-v1:empcFwejSv1cD0OycWgpqKGxXa3N3FYeoFJi5j-KefQoOm1anOAAKUkmzpLOXUoPA-ExZspW4FIQgYEYzjh10bl55eX6ElhxlkLnHmeKj8IPj1F6','2026-06-13 20:25:36','Student'),(13,10,7,NULL,'enc:derived-v1:VfFlnDPXwYneVxvUApIKeitPP1AuH6GCb2X7WsE3RVlsJjbK8OdthIk7B64exOmLrGbhp5t8TMg0gR2q5F_5Q2PvuUeXhBcIn0QtaPkiLSjgi4zS','2026-06-13 20:26:33','Student'),(14,10,23,NULL,'enc:derived-v1:xOgKb-dOvMl3wmbLych4bXlBFgnGy8WOIKMGU86rONx7q85k4ThYTad53lf5g_bGXmwg_4V3unixF-VcV3W7-nAuGbo2M8c5mxyKtMostE6wUkR9jFmhayzY0WCblYyBpA==','2026-06-13 22:56:14','Student'),(15,10,23,NULL,'enc:derived-v1:GAx1mqAunNvCR3ShtqYVhTzl0MfjTSI_WWnJYZ0FA1JMb8z18ZrMewiew_HQMZDobcbmPpktq19PrjcBc9VZu94=','2026-06-14 12:25:22','Admin'),(16,10,7,NULL,'enc:derived-v1:9gSWkSHXm1pD478QgBptrLqvag1PP9VreIuAJMK3faYmBYBcM7KC-vhldQf9X-ouBNok3NiaHto6G8AZ0ve2y76-qX2h8hcQcMKNgM5GpmgDW0B6LeI2Gj_emwQjAHse4nlkpbksdUxC_p1dKug8txY93HVdoGpNOW4=','2026-06-14 12:34:42','Admin'),(17,10,7,NULL,'enc:derived-v1:UKP9mrc-UVdhKInEati8TDwjW7ZQt4Ybyah7yS9Rn0LVin-0TRjodch1','2026-06-14 12:43:22','Admin'),(18,10,7,NULL,'enc:derived-v1:Qu92YV0NPJV5o8pp8C7t9cZKK4kXIAsxk-3YZeuCewx_BFjggKxNgowZonjw6gWqTBw=','2026-06-14 12:43:33','Admin'),(19,10,7,NULL,'enc:derived-v1:q8ynE6ah8AUiFA4OdQqkR_8774cTJQBMj5Cvmf0O2j8rlhEbxldUlP54pjLgXZHMyOPasAIVMCeqiOvNYQ5VBw2tEG2jLq7lsQFz--PUJhzIbFeV-Gs1HSr2BK1ydr65s3J9iBADIeQfyV-dhAK6qVR_pRblQ3BMXsFuq7aTk-Q14w==','2026-06-14 12:44:18','Admin'),(20,10,7,NULL,'enc:derived-v1:4ku7ed74fLTTrl7bs9ybMR2qamePwtGOIDwtKKvu8WYt-rf9CnhgbYe1LDbyxXDX5vOdpCSSBGX4-3Rqe7fi4-AZTpa6ggm-i0qWd1-0ElxilmBUpa2mRg==','2026-06-14 12:44:31','Admin'),(21,10,7,NULL,'enc:derived-v1:rKGgV4p6K66I_j32tgEmXGk8wLhDmyIFBiFzUzNBzJigPFAl2UleG6tFbXxB9iKkTWTbgziN5xv11N24q-CfDZwWqVbm_M-tg-KF','2026-06-14 13:00:31','Student'),(22,10,7,NULL,'enc:derived-v1:wvkV3i8pkBpW4gaG4zKvUUPSbLhGl1S5OkJVx73gDvS2GttkT546CH8jip-c_5yHB8rBkgf1AkxNWhfAqqgFPy_FT-Q=','2026-06-14 13:00:45','Student'),(23,10,7,NULL,'enc:derived-v1:7u6xPl4QOJNoNbjXgECZbOSXLHfdpiE-q395ANUJgOX-y4vwKJRQ-YLi','2026-06-14 13:03:23','Admin'),(24,10,7,NULL,'enc:derived-v1:gJ0UERRUxqRSodqOVM0kBbN3qYQ-g6389J6vZp7BkUvYz29bbF9GCwSXF7rcyrzgC9UJaxVIF2o52cj_q4aTfdMNJ6xSvdc728DzEBUo','2026-06-14 13:03:36','Admin'),(25,10,7,NULL,'enc:derived-v1:dgbsmfYQG2KCx01AflHxM8JyDnK3XRnhbsrRf-ugL5Qj75dbRBfhhhNth4QE5jgTOd9roj_z-R03ak4fHYwFEni40gmL5g==','2026-06-14 13:13:42','Admin'),(26,10,7,NULL,'enc:derived-v1:KGl7uqG0udDgv8p8r1Q_BtG6Q0AtM2T-sAk_vKuwjagWNyDMtnL7hgHEB_N_72ipo9PfLybs6ZQZfoU34LbU6AoNpmgHQMQzEW0_EnPnmNybLSY4HU4n3rZ7U8CnULJQWbu43A==','2026-06-14 13:29:08','Admin'),(27,10,7,NULL,'enc:derived-v1:_iVfMXeXJ6tghWz8UkGmQfs7_Y6O2bJ_8R12HzwqJ8z9YFAd7UP-cvTFC-Ca5p9b9v7h2MET_IL0E8q4ce011bCw07dK7aL13bGFMZgKDyyw-7BK_TitAjvf0IgfPc1K_g==','2026-06-14 13:31:38','Student'),(28,10,NULL,5,'enc:derived-v1:KluIW27kryTwjr24DdpLsIPuXSP7JehUl7SOqQwWQPt35y8_8vOXz9qrSryFPwjvg7VVZTo-FT8X93VUTx3ruEVE','2026-06-14 13:39:20','Professional'),(29,10,NULL,5,'enc:derived-v1:X2oNyHqw-73Z5PPEu97BtKl23TjYSbkGkC6mwSxsT3TBKThjKwXKuwh7bldbJrL82-uUTI6zOx9VF_iiq8fefOZ4XMXgPRcf3aTQUKmU8cU5yoaUCDJoS7AAjG9FMV1Ocd308OV7UnFuVPOV_nbOS9gVLpqwbUstkCaolaCZs4XW_EkI4mc_56HYjZ8A_exzzM0k','2026-06-14 13:42:34','Admin'),(30,10,NULL,5,'enc:derived-v1:cy956oL52WhodepbSpqfT2DnEDfBWVgcHobZ-Cvj2DiIx7IBJsZ7n3Y9','2026-06-14 13:43:52','Professional'),(31,10,NULL,5,'enc:derived-v1:1b2o08pmodh5obhYgqyApafeynZSwVv5KC4spCuw03VmYTtFIeQS7_OjUz_Fx6eQd40=','2026-06-14 14:03:33','Admin'),(32,10,NULL,5,'enc:derived-v1:Rulljl81YzVELw-XMJZkfZdfYpb5n6YdFYjOQarEsA4MPx6WZqHPrnfec38=','2026-06-14 14:14:31','Admin'),(33,10,NULL,5,'enc:derived-v1:z0Cp6NKCN89Jr4kKW47Dp1FPJrkR8l-rqV1-ChRKVtSKZhnmDvBS1VgbtfOy','2026-06-14 14:15:33','Professional'),(34,10,NULL,5,'enc:derived-v1:4Ne3tZJUF4nrXQI1E86qjX0sWkmfk4DwlNqbIELa6NQF67TN8nmeIfo=','2026-06-14 18:28:32','Admin'),(35,10,7,NULL,'enc:derived-v1:nQiEhAUMnsyYwaO9094I6AMBpLbxhd14XGCxF4zrluPAAsi3R1SiBiaGRuWetiYNMDMVsj71h3co5f523o10','2026-06-14 18:28:46','Admin'),(36,10,7,NULL,'enc:derived-v1:24b6RQum9iGG-KdeFitLCjXvoaBzA174fjin3xd7571pElvRrlZOIxE=','2026-06-14 18:32:33','Student'),(37,10,7,NULL,'enc:v1:5LXk5_2rGJ4PbOrzyLLDbbww_udpa52kWNqNu53Lc3Cly5A=','2026-06-14 19:05:55','Admin'),(38,10,7,NULL,'enc:v1:59GdIPQnajRvt3YzOKRMa6odPAog2OVEG12JsWSUCxVRHIftkJr_AUSjN7Up2NMqCUjb6Bj7bibWiJSn2lAsD1CHrlv1qA==','2026-06-14 19:06:10','Admin'),(39,10,7,NULL,'enc:v1:GERqGVt8Gb6dgXXr_RjhcRfwGed8ZJ3yGbXlye3iOf9JVTz-Li0XkSUJ','2026-06-14 19:07:09','Student'),(40,10,23,NULL,'enc:v1:Se4TAqpyiX5PdKSkPatGSmcblD1XIZ7Sj_UlUq0br2n_zeNmacJZm1RL3WGqvkX1kqui11RM8ElJq4k=','2026-06-14 19:14:21','Admin'),(41,10,23,NULL,'enc:v1:xJbEUVJ4uPJOkCx6fENGLv4EvTOaSDM3TOwVWmAT6WxAHgbcINt4Uh6hRRJ5WYk=','2026-06-14 19:18:27','Student'),(42,10,23,NULL,'enc:v1:EcP98uZ9rsA4U95Pz6PbIYWipVhzwTybd3GJFnDcSYCdJs-dl_9bbKey','2026-06-15 08:41:28','Admin');
/*!40000 ALTER TABLE `adminmessages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `AdminID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(250) NOT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`AdminID`),
  UNIQUE KEY `Username` (`Username`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (10,'admin','admin@local','$2b$12$7PWAYArLVmcHie.1DtYHguF6dw1UtQfXxI5cyV5Ww.ZiGVjBtvBbG','2026-02-08 23:48:38');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedbackratings`
--

DROP TABLE IF EXISTS `feedbackratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedbackratings` (
  `FeedbackID` int NOT NULL AUTO_INCREMENT,
  `StudentID` int NOT NULL,
  `ProfessionalID` int NOT NULL,
  `Rating` int DEFAULT NULL,
  `FeedbackText` text,
  PRIMARY KEY (`FeedbackID`),
  KEY `StudentID` (`StudentID`),
  KEY `ProfessionalID` (`ProfessionalID`),
  CONSTRAINT `feedbackratings_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`),
  CONSTRAINT `feedbackratings_ibfk_2` FOREIGN KEY (`ProfessionalID`) REFERENCES `mentalhealthprofessionals` (`ProfessionalID`),
  CONSTRAINT `feedbackratings_chk_1` CHECK ((`Rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbackratings`
--

LOCK TABLES `feedbackratings` WRITE;
/*!40000 ALTER TABLE `feedbackratings` DISABLE KEYS */;
INSERT INTO `feedbackratings` VALUES (1,1,1,5,'I really felt heard, and I would recommend her services for anyone dealing with anxiety and depression who does not know where to start or how to talk about it.'),(2,2,1,4,'I felt heard, and it was helpful, but not specific to OCD'),(3,2,13,5,'great experience !'),(4,15,19,5,'Madison helped me navigate my anxiety healthily. I always felt like my anxiety was paralyzing, but after a session with her, I feel more human and capable than ever. I would definitely recommend.'),(5,21,18,5,'I was always afraid of having a session with a therapist, so I thought a peer specialist would be a good place to start. I had a good session. It was very helpful. I would do this again'),(6,10,17,5,'I had a great experience with Victor. It was extremely helpful. I  would definitely recommend a session with him when you are specifically looking for help regarding family issues.'),(7,9,10,4,'I had a good experience. I may need to have a couple more sessions in order to be able to feel more at ease with everything. Lydia was great. I am thankful'),(8,5,20,5,'Very helpful!'),(9,5,3,4,'I had an excellent session! I would definitely recommend'),(10,11,11,5,'Great experience! Would definitely recommend having a session with him, it was really helpful'),(11,14,13,5,'Emilie really helped me navigate my anxiety. I felt very ashamed of it before I had a session with her, but now I feel much better. I would recommend a session with her. I really benefited from it.'),(12,20,19,5,'Had a great session!'),(13,4,14,5,'Great session. very helpful. I recommend'),(14,8,2,5,'I have had a hard time navigating my mental health, and this session has helped me navigate it better. I would highly recommend a session with Kyle.'),(15,7,14,5,'Such a helpful session!'),(16,19,6,4,'It was a good session. I felt seen and heard'),(17,12,15,5,'I have been struggling with substance abuse for a while now. After my session with Tom, I was finally able to admit that I had a problem. I would recommend Tom to anybody who might be struggling with the same !'),(18,13,9,5,'Had a wonderful session with Phoebe. It was very helpful'),(19,6,7,5,'Great session! \nIf you need to speak to a peer specialist, I recommend Ruth'),(20,22,4,5,'I had a really good session with Kofi. I have been feeling really stressed lately with school, and a session with Kofi was really helpful'),(21,3,16,5,'I had a really lovely session with Julien. I quite enjoyed it. I would recommend'),(22,3,21,4,'I had a really good meeting with Saul. It was very beneficial.'),(23,7,5,4,'had a really good session , felt very seen and heard ... would recommend !');
/*!40000 ALTER TABLE `feedbackratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentalhealthprofessionals`
--

DROP TABLE IF EXISTS `mentalhealthprofessionals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentalhealthprofessionals` (
  `ProfessionalID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(255) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Category` enum('General Mental Health','Depression & Anxiety','Trauma','Substance Abuse','Marriage & Family','pastoral counsellors','peer specialist') NOT NULL,
  `VerificationStatus` enum('Pending','Verified','Rejected') NOT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ProfessionalID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentalhealthprofessionals`
--

LOCK TABLES `mentalhealthprofessionals` WRITE;
/*!40000 ALTER TABLE `mentalhealthprofessionals` DISABLE KEYS */;
INSERT INTO `mentalhealthprofessionals` VALUES (1,'Mary Heath','mheath@gmail.com','$2b$12$YrOi2z5jxfyQFydkzOgTMuGmiybWTY0zLGg31BcTovoGn9zAhICfS','Depression & Anxiety','Verified','2026-02-08 22:14:10'),(2,'Kyle Njau','knjau@gmail.com','$2b$12$xlNvd3YBwdFu.XLJ7b1fmOMJl/kWbuPjrfnfaYfvCDv2IkPYvveoS','Trauma','Verified','2026-03-01 21:45:01'),(3,'Wanjiru Mwangi','Wmwangi@gmail.com','$2b$12$fqOSb.8IboVTuvqVSPif9e/bcg5Q65KK7rvntzXSvKikZRP1BvvBy','General Mental Health','Verified','2026-03-01 21:49:29'),(4,'Kofi Abel','kabel@gmail.com','$2b$12$N0ujsDvXND73ma06mGzRh.z8n4/iuwj9dY7KRRNvDmVKApphdHpxS','General Mental Health','Verified','2026-03-01 21:52:05'),(5,'Lizzy Mac','lmac@gmail.com','$2b$12$qQeGvQIOEosif6Alv5/uF.fXZppkFSsdCyswrp4TMPydnQE.RrATi','General Mental Health','Verified','2026-03-01 21:55:37'),(6,'Noah  Khan','nkhann@gmail.com','$2b$12$LnYNfAw1KNKlYJi14u9lCuuBnP5dFImSVand/EngjgfjdMgMnmqWW','Marriage & Family','Verified','2026-03-01 22:23:38'),(7,'Ruth Hope','rhope@gmail.com','$2b$12$RsTiIpf5ztOesMVNpetOSOLE4SG73Y.CzPPiNfZXuJY9CxQQIXUrq','peer specialist','Verified','2026-03-01 22:26:33'),(8,'Killian Karanja','Kikaranja@gmail.com','$2b$12$//noGsoxkzfwTbqhwTr.CepYCQgZXcF89cbl1yZChTmMCnDkqzd.u','Substance Abuse','Verified','2026-03-01 22:35:58'),(9,'Phoebe Hall','Phall@gmail.com','$2b$12$82cKfK2yeCYxQqzp8H1M8uXFJlLwZDIt2DNUEWKIl//UM3VsW6wvW','pastoral counsellors','Verified','2026-03-01 22:42:05'),(10,'Lydia Nyambura','Lnyambura@gmail.com','$2b$12$/DzchC3z.69bBxVhFl2Ib.Dz6H3OF3LiCj5IqIW2W7oT5iDqNMzAu','Depression & Anxiety','Verified','2026-03-01 22:45:02'),(11,'Brian Kamau','Bkamau@gmail.com','$2b$12$ftb4GeYqz8FTlHmvzFcXeeDmOp/ABTnzM6fA1NnPRxmBM4bLLzHFC','Trauma','Verified','2026-03-01 22:48:41'),(12,'Kieth Khol','kikhol@gmail.com','$2b$12$Wz3753s0/01g438jDzO6Ie/hZKhw1S19ouisumO45NA/k0RyNe.bK','Substance Abuse','Verified','2026-03-01 22:52:26'),(13,'Emilie Wanjala','Ewanjala@gmail.com','$2b$12$8fUJHh9QtE519vsEalrtMObej8qLdf3/RBDNmGD4gCrCd/PSaypbS','Depression & Anxiety','Verified','2026-03-02 00:20:46'),(14,'Tyler Owalla','Towalla@gmail.com','$2b$12$.Uy4qyrINfGVCw3BxziHeedIpEJ/iHbWGkDvavK9GQgTfinpmzNHC','Trauma','Verified','2026-03-02 00:23:25'),(15,'Tom Sawyer','Tsawyer@gmail.com','$2b$12$arRqiSR.oAJCpKi0n4SFROajuKUJ.C5WYOwlN72LfhnwcFtuk1Ili','Substance Abuse','Verified','2026-03-02 00:25:53'),(16,'Julien Njeri','Jnjerii@gmail.com','$2b$12$6rXQkQnAT3chQ30P.y4uYeYFO/fKLa18WclkR/5FDGrcEHDlPZi5C','Substance Abuse','Verified','2026-03-02 00:28:46'),(17,'Victor Otieno','Votieno@gmail.com','$2b$12$zKxwK8KNwq5P2SbptAmVSOdvttuSaN1DyEMQzS8RgYTLIlweR29we','Marriage & Family','Verified','2026-03-02 00:31:22'),(18,'Olsen Owens','Owens1@gmail.com','$2b$12$nXmrhUBz8DDF5D99LnpSTesYyLhMojjuT1ELkS/FZluOpAqBsNizW','peer specialist','Verified','2026-03-02 00:33:30'),(19,'Madison Adhiambo','Madhiambo@gmail.com','$2b$12$jWt.fGKPw4F6t4XjFQenOeM.DD3DJjkmbFt/snaUJm.0KMaU1qNSq','Depression & Anxiety','Verified','2026-03-02 00:35:27'),(20,'Lisa Laurens','Llaurens@gmail.com','$2b$12$Zii4xGK3n1puZTBXR/EjZO5oG/HIVVisUHkXpX9B8VUfnjhOiAKKS','Substance Abuse','Verified','2026-03-02 00:37:33'),(21,'Saul Lewis','Slewis@gmail.com','$2b$12$eqfwIypstT9PNu6zFsTcB.99I9SpnnXWnSFvl1YDu8LvLntuRuoQu','peer specialist','Verified','2026-03-02 00:39:43'),(22,'Kevin Omolo','komolo@gmail.com','$2b$12$qrhWzdc.qYgY9VN7Jhi/Duf0rJyFGue0OMry8P/u94Tzav2WSRmHy','Depression & Anxiety','Verified','2026-03-13 11:45:53'),(23,'Claude Ochieng','Claudoch@gmail.com','$2b$12$fHqyJnrzYxWSE.c2zgLR/eL44soOpArRa5YIt7wdNqJ0I3avLAN8G','Trauma','Rejected','2026-06-13 23:12:49'),(24,'Jackie Salome','Jsalome@gmail.com','$2b$12$8s5HSygDixbObCkejIVtwOvcb1r3jvFKY0ChJAiwYKCgsacvWLHSm','Substance Abuse','Verified','2026-06-15 08:23:38');
/*!40000 ALTER TABLE `mentalhealthprofessionals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `MessageID` int NOT NULL AUTO_INCREMENT,
  `StudentID` int NOT NULL,
  `ProfessionalID` int NOT NULL,
  `MessageText` text NOT NULL,
  `SentAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Sender` enum('Student','Professional') NOT NULL,
  PRIMARY KEY (`MessageID`),
  KEY `StudentID` (`StudentID`),
  KEY `ProfessionalID` (`ProfessionalID`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`),
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`ProfessionalID`) REFERENCES `mentalhealthprofessionals` (`ProfessionalID`)
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,1,'enc:derived-v1:zQ1BqwKQE7Q1OxTXFbtoHBSfZj3MB2Ud8k1U-MPxHnS9AwISxk4H9fhF-sd6r94iyBn0Xj9R8mDYJ2Qofkl-jVUMmho=','2026-02-17 23:44:45','Student'),(2,1,1,'enc:derived-v1:s8ehkbH7TtJNebUj5RRXNOGRDV3w7vV8x05mRklyICEEVo4RH4Q_i6tyiZVfZfVvZ55VSlJNg7zqJ9wSPbinXm7VSPMOSLjdIhJj','2026-02-18 00:13:27','Student'),(3,1,1,'enc:derived-v1:LluB4Gt-Rcs6VNEDKQ3_ycJ4zOZwHZ1zFPzVmWrLVLiHpwCZAn4CoA==','2026-02-18 00:21:32','Professional'),(4,1,1,'enc:derived-v1:mNDzcOJBuRHOUmQYxFdmscsMx3Gspv7Ppt6hVV_hM6wkmfKAQ0wGg8td-R56Bp3s45sPe35qsq0n7cV-mWIUz_woW4Y=','2026-02-18 00:29:31','Student'),(5,1,1,'enc:derived-v1:jfC4aJHdV5dFzSyWqn8-gx-WNVHQzLBp7iSSOWY8m9lOi7fM9skVADhuNv9FIkNwKzT7MTp-DUtU_Br_LNIrBGvhJ5A=','2026-02-18 00:29:31','Student'),(6,1,1,'enc:derived-v1:9AZqceQfwcEWmSTysvDA4EFiZXfb1R1kcN5oa47KveTo0X-wZzcbX3JYytKDl3CYow3IGb07j1ginM0DmCGqCONwyoE=','2026-02-18 00:29:31','Student'),(7,1,1,'enc:derived-v1:ESkeZYkobswNtZpDtpql4Im1TwjvY_SZVo36exwrbGAVf67NzBclMkqQ4YTVhX3S6Tc_XE1QdCjzuOrF5iu7P4jboPM=','2026-02-18 00:29:31','Student'),(8,1,1,'enc:derived-v1:KSsurRyynCE-N6ER1V3aPjHD3MEV-HBCD4UUQ-vMIJaK6ar_lgYucJHuRfAaEGRwBS8DkyBwynOmGocBFD9H45m7oKc=','2026-02-18 00:29:31','Student'),(9,1,1,'enc:derived-v1:aHkTdMwg15H9iElyH1ZIB0us-_VW3bnjnGzZEUMKwvt4K9uYs3kFEMF_qSDti_sLjXt9xc2HHS8-LUbWmuj0ni6VRAA=','2026-02-18 00:29:31','Student'),(10,1,1,'enc:derived-v1:IC7mZbjUUGMzA0nXqAMVscN7vo8fZ3YnGVzv4Hf-zwmaSu3dJnYtkddrGinvdnbfmXbNYAX-asL3NAKC7rgaIG-QuvA=','2026-02-18 00:29:31','Student'),(11,1,1,'enc:derived-v1:QcWIUiINdoPqJggYQFrEV9pSjXWvMvH9wAPCXgXDzxPWvS-k7o1IadprkqxG0hlSjjtYKIXr1LumJk56esuimZ0r-3Y=','2026-02-18 00:29:31','Student'),(12,1,1,'enc:derived-v1:6DJfUscB8LUZDCXBTrvuLfgx3RNnywPaCsQsvsS55ttpstubJUpcGZOnU9rDPAx1ZSyoWn-1tMkHZtQPem7EIn_H5Uo=','2026-02-18 00:29:31','Student'),(13,2,13,'enc:derived-v1:w60FBSs678zZ-Gf8WtpeJ1cw0nOqMRraid0Xe6yg4AJ0K9RqMDF-GnRNSlgvs6k4H1khjU8fSTmFmc66FdZ2YhQ56TM=','2026-03-04 01:07:19','Student'),(14,2,13,'enc:derived-v1:c-m9ZnbHxDYaFjTBNqcaJ2ydlcj_nNwpv0MFPTQLN8D3TBqQ6SQbFMofwKfHuh9kdkqzx22WW_Q8p47IXFUw1R4TBUARsLC4lBTCkwlYJEZwPrrpkk1OmvL3lFXeXPRhmOAgSbPhLAAHDG5jp8nlSJ3AaNpxeSI_dwsLlbo6v6jkPGXfyA==','2026-03-04 01:08:16','Student'),(15,7,14,'enc:derived-v1:UZVwnfhULV6icko9wkcxuSUEAIg4Wa67z24B_IY2O5KNsNqU4CPhuvvJfDLvXmAHtllu4DXWSJZrVlr0iFPcqg7JuBI=','2026-03-11 23:53:52','Student'),(16,15,19,'enc:derived-v1:er0u3dgiD0TxNWJgojEbzePwQNZGwb4MSl-IBitCkyybxQG-DpkJRo_lfjCNSpF_pDc0DLo8zCbeyVUFoCiQucRv20A=','2026-03-12 21:12:54','Student'),(17,15,19,'enc:derived-v1:AZTOz_3qoYlp6h6_VN-uu54YlC_geHY4BeDqCsgfJDXNm8uINaQO5KkEbkwSKP_xur1LAs99tsT8xhCDcxqKrlPHDiC2GY-gZVNmH8np7v9a0ME9JSrbM9JhXb_x9PvBE8NlmmZrs8z2o7YnSC0_PBdKUQ==','2026-03-12 21:13:29','Student'),(18,15,19,'enc:derived-v1:jecpNB8j1SniFvQFOUJHYTZlW_OeYySkexi7mLcrCNx6dqSy9fOTTmHM2cMzPYp-amA=','2026-03-12 21:13:58','Student'),(19,21,18,'enc:derived-v1:7noEhrzT6zkU0_w4FMzG-QKjbCC9jhfqSTHT7Wzh3jslDlapcL-712q07JvhJkhf0BwRJsuIoIAM8YTP1tD_2zdNBYE=','2026-03-12 21:19:19','Student'),(20,21,18,'enc:derived-v1:j10dGoqWvb69Fd1Jn5TVBPDqj8T4uXtuDDKfreKDVTpweaiC93lCbDqDgFLZOpY0wwjW0_uoFcCqqpSzkbnS28sQn_k9-ka2hTZT1TNJl_o4','2026-03-12 21:19:39','Student'),(21,21,18,'enc:derived-v1:03anbAAo-P_4lFQPuxSRBzrXiOuRrBZSFcj8gU7VFuylkOkulz-zhtAwMIhnq7vrWb2BbUt9hrW4vtagNJ4fDtOL0LqHKoIIeGw4OtAriKAL7JTBS47MfnRj6OnVpw==','2026-03-12 21:20:08','Student'),(22,21,18,'enc:derived-v1:2PuanVqM29W53Vb30wNcIkbh-pSaf7BeQhaao4MVZmlsfO2MTIV8qdtr5rREM6ZZ0TU1','2026-03-12 21:22:11','Professional'),(23,21,18,'enc:derived-v1:YaWLlQGZ9LEw1IXs5ZSC1330AWmvc3mfbLYvpX-apSdPH5seT68o00dzKSt2Zeun5VlBe4zYxfkxbEffH1Mtv1vQk-mlQRRLv53ZShHQzA==','2026-03-12 21:22:27','Professional'),(24,21,18,'enc:derived-v1:fcSXDkJcs3tdIUrbAGQ0V6nCkcJNTAb7Z2Fh_n20Z_KOlXUkXyT29gw_bgPC1ODF0ZWYhFTe9w9zYscttQX_tT7gggB4uds_9S0-jNBNdKT6tGJN9g==','2026-03-12 21:22:51','Professional'),(25,21,18,'enc:derived-v1:j9YvXM3Supor0JvYA2ayOB9sHv5Ha7E6KpL6fcFrB1ouPxAnon8hlQRQ-WKmU1y_29ffPA==','2026-03-12 21:24:40','Student'),(26,10,17,'enc:derived-v1:XnfxdY16Kk1Oy3WqtS-jxSW0yHUT_LevDNXFVyl55F6Wg_YN01p0WzeaW_-HBFZltaoJ4AsMzICCuD3J_ppRh3oMYks=','2026-03-12 21:58:17','Student'),(27,10,17,'enc:derived-v1:oP2__JWCfWrVq5cvbQYOFBx8XzsMSD1pXiWiYE3AJirtDAJk2Soo5dEww_4gj4yRHmoXw1EPO_EPEPtzMv-Gy4RzcLYi-JHJnROl2rEqh4QSDcIaZ1CmWH4JvrtrHpUJ28TVe6jMrYphn7V7JRVxxit0fhn8lOs4MYuLc9I9-LlUHA43jdm7xPrFLXOtXvpUm3NwKA==','2026-03-12 22:00:04','Student'),(28,10,17,'enc:derived-v1:6JpSjzQ69ZO3bWfZnOK_ZdV49caFzYt8B4mk9MOt852wNJ7-Wxg-ryb440D_XGGKQoH4L9EqrmxdQuQfaYZaBatTC7Luem3hpR_isfqkdUA=','2026-03-12 22:06:01','Professional'),(29,10,17,'enc:derived-v1:ioOwVfcW7ZtFZKDBnXdMTUJDMAaQZg0NF_AOOb1pt7jYe_iMRF-2EZSAbNZCNj4Atk6rW-TCoiBXu48T-nwVYSs9DOjIPjf_JQ==','2026-03-12 22:06:30','Professional'),(30,10,17,'enc:derived-v1:vhRsTt2ERpsPFxQrzHDN3l72xRjXDk3x2soOYM6yqJ5yppp7UFhzUO1dblTh7x-TaI86DuUbLAHi6dnFU7wlOx69ROyJqAEgIJ4M0uQ=','2026-03-12 22:09:42','Student'),(31,9,10,'enc:derived-v1:aLI28MHLfSG9j5eyH31YcG0V7SchRJpwVi1gZ2aC2Alu44Trk3qYWCu6GI3O-Cdp-rowAfquw00eMREDRQeutVz_rQs=','2026-03-12 22:24:17','Student'),(32,9,10,'enc:derived-v1:LQlF-gStPx9a1MFoO7l2-I7MYefIOAQiAUmz_HqJQSr31BmoKfiBAMAmwbN5ULWLpp6OipRVp6HNOxMJiQ6iDHk2PZZA9jYXGIhPlL4=','2026-03-12 22:24:47','Student'),(33,9,10,'enc:derived-v1:-tO99E8n-JwWR3OfyGnwvKetZW3httGnFAGrN__YADQWd2cvPyWH','2026-03-12 22:24:55','Student'),(34,9,10,'enc:derived-v1:bIah6jvILlpXwpy-35v_stMAwlFyntsbzaUab1oTO5tzfNQp3Dw=','2026-03-12 22:40:23','Professional'),(35,9,10,'enc:derived-v1:Np7NZv7nh8QvkfKOPbA4wmUddQHHUBy94NJiHBvzg42j8tplgLOMgQ==','2026-03-12 22:40:28','Professional'),(36,5,20,'enc:derived-v1:82HttHWUAjyq6lg3ChGwA9ZMxnZl1bDmZA05sWTIL_HPwB7z1EIm7i1ZwRUB3bxOJ2Xo02Dh0OTQHZOqdfgFU13ag0I=','2026-03-12 22:45:04','Student'),(37,5,20,'enc:derived-v1:pPa-ssE59cWy5u_yYlKCIGmkrtv_jtZTlwVd728YWJrkP36Zrd8YZ9XBBU5dcq0rf1_7TAUTkfvKH9RK31tDSGA2NjRzx2iU2Q==','2026-03-12 22:45:20','Student'),(38,5,20,'enc:derived-v1:79nIISZm5cM-72-C2yhx5hAx3JC2xDT8hm9MBnjxXgfh899upP_xtQET-tUAGzjCzkcqcZ_5bh7TyBscBlezeFKSV40dtjXIkryuM84=','2026-03-12 22:45:59','Student'),(39,5,3,'enc:derived-v1:6hwSBXM_dPhelDLD4LSeIy0rFHFef_X6572S3nhKG0gho2wyALGdlKOdn-5LSS8pO8v9CClmjLWLRCQ2OhKo_QFDsIE=','2026-03-12 22:47:18','Student'),(40,5,3,'enc:derived-v1:9d4FgqFglKgIHM80uw3qmyVPDAo11XTlm83faX9wgtgb9Z5juKdKMvYe6LSrsBA7weBDaGnUCFiJmS-UFtg9wOAZ_DiMRv7Qyd0YlD-7_FYsJEgQ','2026-03-12 22:47:49','Student'),(41,5,20,'enc:derived-v1:ilE3mtsPsoAP-KDJewkPyHESQrs1S9cYyvjtmGgg2NP_p7OEdPg6bLdhsS-X1Q==','2026-03-12 22:51:43','Professional'),(42,5,20,'enc:derived-v1:pnvJqajqBTwES7f6f548rI4v0bFJwpqvfukSG9-1RVyvP9sVpk-ZKg==','2026-03-12 22:51:51','Professional'),(43,5,20,'enc:derived-v1:2ptco8BfHuabD0OAvGAIXIa5McJaNDgQebPYuYtmHhI_hOt1jUqlxri7Qtl00FLLZPdjlHUuaOxdpwwn7asssOPovUkH0e2P3n4=','2026-03-12 22:51:57','Professional'),(44,5,3,'enc:derived-v1:bX_TaiiRh0yhYpBYRNNS0q9vRaFTnjG6hwNzaIhAPb01Q11PC8KKfYvP55VbnerbXtouLoBUQbO90IiL3jbAABE=','2026-03-12 22:57:11','Professional'),(45,5,3,'enc:derived-v1:hOCW6GbfqyZFSoSKbuMABNPnaEZC9pUvtQGGXleVXtq6K7BUOAOfyg==','2026-03-12 22:57:17','Professional'),(46,5,3,'enc:derived-v1:RnH1SsKwMLhJiF3H7QVcSXkIx9ye5isnjzoAaQsieRbYq7z5QKsgx_E5','2026-03-12 22:57:20','Professional'),(47,11,11,'enc:derived-v1:y6knqNbYEoero-J4t17JAsEakFatUwtFuumX7RoXEnWj_0qDKK75J2cCbZhjHD1KQh0HISTCJBQUY0_UU0hdcdDeZd8=','2026-03-12 22:59:48','Student'),(48,11,11,'enc:derived-v1:28vfXLBA8ji1Jkev4J0wzQ6Gx6eb1XHYC1OM4O8tC19EKmidsIxtniEYhaLvXM30V3wO4QGe_1cHXGrGCH8D1FVwK_7kaOyfZOht','2026-03-12 23:00:19','Student'),(49,11,11,'enc:derived-v1:cA7vnmQru80Qm8dodJUbV1MA3YrTY2Kf-mYFnMKZ4wnKKKG27nU=','2026-03-12 23:07:21','Professional'),(50,11,11,'enc:derived-v1:D0cVmVUtlZ5Y-xMvd_U8BvJ03O_EOre0gzDrqAQewR9LjnklZ7LaHg==','2026-03-12 23:07:43','Professional'),(51,11,11,'enc:derived-v1:-ALTz9W-BtI8-nWhnSnWtnPmNPgy8UWI0lqHRYmxVsxaZxS-hCC8pnogCDqei88C_wutu2HaKc4IA8ooB7IIJKS0jUDDWJxiyQ8=','2026-03-12 23:07:47','Professional'),(52,14,13,'enc:derived-v1:BVvnhSqX62G7szxrZlyIAivUVg9v-q1iKZdCAlIVZj0nyXrLsjgPclnTLJm8nYXjG4mQFdj2F2KOIANfDeqKEgE0xcI=','2026-03-12 23:18:57','Student'),(53,14,13,'enc:derived-v1:ftm52jeJ574kU7R8oBOI2KPxLOAyGyBE5pxAXK-v8qIM6k3pqAPDfk5p5bk4E9lEI0MhoaYkdMy0Lp35bO_GxOuZmY67cmeF3PDXX-9JOYY=','2026-03-12 23:19:59','Student'),(54,14,13,'enc:derived-v1:wQE6kjDMFjia6B7iNucsNnTBKbfItzt8SALrkBQSyL3p8F6z-V7Fwc5FNkdILQ==','2026-03-12 23:20:13','Student'),(55,2,13,'enc:derived-v1:xYZsTOCAjXc1-qyi-LQV_GS0INrc4vOnf2Pnj8CdtBcz88ME9Dw=','2026-03-12 23:34:52','Professional'),(56,2,13,'enc:derived-v1:FLtkiGnbQol74XBtpYRjopMow2OjgePF41EsN05ZErCRC4Lqs9AktJRl','2026-03-12 23:34:59','Professional'),(57,14,13,'enc:derived-v1:kG4gY_J2TT8UO82LkCV9l__0VBcpU9B9vMQT9Mrf2ni6HcRX5rlwMa8zGKz_U2MJZzN_2VqvzsN7ExwcAYI=','2026-03-12 23:50:51','Professional'),(58,2,13,'enc:derived-v1:BsrbJf3ZqM7xwEI6rgtytofQ6XYGZ_h_nM4iAEUMQTeH2Ai-fw==','2026-03-12 23:55:25','Professional'),(59,20,19,'enc:derived-v1:4zAxUTXfT_UXaR8GeqFq_zKqIB6pqS0W8iMjDdkfSMIXpSDUwiBGBDwvbeYwXhj9nLwKuKW3Wy8pcGcOi36aGpzNdJg=','2026-03-13 00:00:52','Student'),(60,20,19,'enc:derived-v1:G1u14iwG-bs94fb4-b57_6vwO4yEkmqPzgbwtSyw4iKWF5MlhTjPNXDsUAlbpvL_wD-zMF_R0sOYa403Dfxv','2026-03-13 00:01:51','Student'),(61,20,19,'enc:derived-v1:Gwx1yggYqQPplAYr-Xf3Gh6UHHs-iczY9YO_Kflc82O1PYgKdk0A','2026-03-13 00:01:58','Student'),(62,20,19,'enc:derived-v1:9dl_RIhxAwaUD1pYO5o2x4rIYJJsA2pCKFgl34avAmgtTdw_C2HFKjzh','2026-03-13 00:05:42','Professional'),(63,20,19,'enc:derived-v1:r2KnWBaNh7Azu8ZEdPRBagY_Yvj18S8e0rYexxLms8SGQIafE7X_-O7t1qQh','2026-03-13 00:05:47','Professional'),(64,4,14,'enc:derived-v1:uxQHwy1j1rSB3U7R7IeunWXymSQAM8QK_JbtKoMYzR6EHbiZqq24_mYQty2IoJqjHrEQMWoK0FJ2k4QU0dcMyiZDyok=','2026-03-13 00:19:45','Student'),(65,4,14,'enc:derived-v1:8kKXXAy7g9FgIXdSq2eTR_ewmE5g4-C7Uvl8i6oAM2RHkdBkUlLoD45S7IxwybFMndInl_shaCmdE4Dhi6yX1UbEJ2Rm5GeR','2026-03-13 00:20:18','Student'),(66,7,14,'enc:derived-v1:bP4zQx2quPAaTN0pcuN8C-I3V8lGsytyeJ-68nJWK_JVkoxV3UGs9191-SC2TXVwfUCH8oQGPdCl','2026-03-13 00:23:59','Professional'),(67,4,14,'enc:derived-v1:7A1yFuIcNux5d5mYw0whzj6cjKyPmcAQuGcbH8yOBRomcSLYqe0dRg==','2026-03-13 00:24:06','Professional'),(68,4,14,'enc:derived-v1:0Umkv7xOUziLBfsolcqx1c-1d28PnTzVUOxzXBneGY0IKzTmX-Shzw==','2026-03-13 00:24:11','Professional'),(69,8,2,'enc:derived-v1:JxfAzamMrgl-paofeOMGUg4k1CcMdTtBRVgpMPhGX_baWKqypozM_ZidYKRdYUyxmzwM-pW7pAckzHUuqOEbMzw7xnU=','2026-03-13 00:26:43','Student'),(70,8,2,'enc:derived-v1:07o84KmRlfDXJEj41wF3lH01Y-iaDNvbTwBJLlD2s8PHiztj50BYmmK5NhyVr1Sb9QPr2TH63VopqpexCyS3yJVEwonbZAFeCQ==','2026-03-13 00:29:12','Student'),(71,8,2,'enc:derived-v1:JJXa2OfyqMTpMo775n121F_Of2hCKc5WsPqR6w6uoEtcvsZdQxI=','2026-03-13 00:41:18','Professional'),(72,8,2,'enc:derived-v1:19JlcCEUvJ9CbMi094tpXC8aSDqAQ6gQzLCkeYk39Cbkv-nUPEFBgzxVvRxnxQ==','2026-03-13 00:41:26','Professional'),(73,19,6,'enc:derived-v1:mP5ej5FWlnWDMGSetttgDfQkD9TkRfRXVuoPV1H0UtLU3cQJ44lGwJcYkAIWMFBeZALOCRsmz_CU9lnPcmYpLQ43qBc=','2026-03-13 00:45:56','Student'),(74,19,6,'enc:derived-v1:zrUFoYtlfVxt5mNtSWDN4MLfGBdOaNrjBMYW9Oas00G2pNoMTMVOHGJQy24rrTmnxOth_fp061JtrOF-NDUr_BZFnxQuOyijBw==','2026-03-13 00:46:43','Student'),(75,19,6,'enc:derived-v1:qDhAuhFiOLD3wTiX8F1jJKfUHYGureW7-aykne_jVPnWUMMzL7xZWaJwm4-2ztTcpgYErek=','2026-03-13 00:49:46','Professional'),(76,12,15,'enc:derived-v1:1TIgcyijf5oNqkf5UeiVLcTt1P36CWmYM8uJ5e_4vJG9CJ5Ec2NiWaEAaJBYRf6FGN12kXhTiWLFXbL5RBaQjWhePok=','2026-03-13 00:54:08','Student'),(77,12,15,'enc:derived-v1:-RRPQ-yYFHGsUyL40xqvSv5CqLiCTekwU-BFnIKqRELAazTaox34CxHcKXvp3wsSTMOXYkluebMGoyJD5Oj-','2026-03-13 00:54:22','Student'),(78,12,15,'enc:derived-v1:MEl65wo5-UAfVBR2fDnIvYWT_KHz6nHJvwIgKgKTl7g35xY6wA==','2026-03-13 00:54:27','Student'),(79,12,15,'enc:derived-v1:6X2sT5S77qPUS0GFiHuRezEq-kC_INPzwYcscRqAgMq5kXxVIf-f0pmvPCVS30qWgup34iWj3NV2e6TgyQ==','2026-03-13 00:59:44','Professional'),(80,13,9,'enc:derived-v1:DlSwIo_znMUcgN5S3JIOP7m7l8qmyUJq0Bm5s-E80sRLN3jxewcVKXZhxNtnHKtRXcywK9j7c-0C3U6tks9WOnsTiI8=','2026-03-13 01:04:54','Student'),(81,13,9,'enc:derived-v1:dniNy0DXY8bv5G1tjXbv1pz--AEtxQV-rQknDMw9Lo2EypOTqPjYyqN36Ws5C6lvRViwMcDNH2FYlm1m6IHoXj7gJYNiU-pic_S4mUGD9B3_nw==','2026-03-13 01:05:36','Student'),(82,13,9,'enc:derived-v1:qmkl1MpuOp4B_YvhDNiuYRnAAA9D8xLMpchu1HNvvk1y26Cx-KjYLQ==','2026-03-13 01:11:31','Professional'),(83,6,7,'enc:derived-v1:UH6busJowkhBYeZuW6AuaqNrjA-HbX541CUvMYjC9ddGkzQhFTL1_zwE1gY-G3WVhPXj01ZJ_r4upz3DsHPsOGIStCI=','2026-03-13 01:14:52','Student'),(84,6,7,'enc:derived-v1:AUhu305FxheaEYlWiM2thcurm0Xl-CEt1DCM7dgN7qZJEQoA40GpkfL2ze0HwLTAWfl9qo3LQWV5-h6JSuANdUI_CyTo9zG3dFVjgxC9p-9QbhnFjwY_mg==','2026-03-13 01:15:35','Student'),(85,6,7,'enc:derived-v1:NaZH7aLXjPpP7sziD6APMjNdqP6-A0l8J2rJfRismdpBEdSz7ayP1Ps_1a-LUG89D4YcHBo=','2026-03-13 01:19:33','Professional'),(86,22,4,'enc:derived-v1:fv-Snpqn3vCAnQ9nSBqtioNrfGBO9zHNFUQYqWWyOWouUhvPet9SrBmBzGVLVE_j4m166SKCzPaneG4UP-MK1LEa9Kk=','2026-03-13 01:24:20','Student'),(87,22,4,'enc:derived-v1:ShOg1I9XJcUHcv1OT1RJKbAmHG7SOY7ouG-hxETubRVoA1CwRxiMBHtwqSaKrlmH9TefE7u04QOj_Dl34fhR8BN8f7JPoQmPT-NkHut7dw==','2026-03-13 01:24:51','Student'),(88,22,4,'enc:derived-v1:yb4Kjd6BWPb-ohHI9LwPZElwo4PuzbGnVLga1Ge1e5wqUaMnmL10','2026-03-13 01:25:25','Student'),(89,22,4,'enc:derived-v1:ySw8h2db-1E8sn7_Htx6NGO_k24S7-uzjvAOzY_wa8b7ZVg8HizkAZjn8DRFtDRohmvfUT4=','2026-03-13 01:30:08','Professional'),(90,3,16,'enc:derived-v1:mPm_uKL4eOB1lR98uDmJFBWkwcNz8YAAmy3c9EAZ6ZTIB0PHljik9H8-nBBQUPzuVf7mBtIFghe4U0ylZeZRaLuC304=','2026-03-13 01:34:19','Student'),(91,3,21,'enc:derived-v1:53qxDxkpTF_oX50Bo_TczScrPvgE7JCuN_7_fZJKZKqAx0MZ-WUirbHz2gAusyxCgrQqlO9iFpOwurX1GZRqIMHisOc=','2026-03-13 01:34:49','Student'),(92,3,21,'enc:derived-v1:H1mm8qedjnGbHlhdPMn981vdx__Ws6dUoM_O-wgkjuw3pkvASeKqyqY3OSQ1mBU33-HPoodgxCrifVuahJeVnq5s8_Ufkfdl','2026-03-13 01:35:18','Student'),(93,3,16,'enc:derived-v1:RxP7pgKOaLwmmc6p5FmsJ4nqfX16J-W70sM3EPMaqY8WP5dmmQkS4qoFFinSYumkvmeJr1bkExeC0ym3yUpnqsx00BU8T42NypE=','2026-03-13 01:35:44','Student'),(94,3,16,'enc:derived-v1:mHV4qvAWElgPIurJCJBZAtsHUTeem03HzPjM6oI0Mn4kueaZhV0=','2026-03-13 01:42:26','Professional'),(95,3,16,'enc:derived-v1:pClvxzWZjp5PB6esiEzpnJva_UfxYwR0ngWl6L0f0FQS5Ble95sjxw==','2026-03-13 01:42:29','Professional'),(96,3,21,'enc:derived-v1:uUqG4soT4_jCAnaxhKFoi3XrVbliugDAL0Md__2_ByUD4_ERKuc=','2026-03-13 01:43:55','Professional'),(97,3,21,'enc:derived-v1:VLfHxx7BUWYZkkPQhB3b8jLsHdnPCuMG8usCKFSto2nChQ-x5ouTsw==','2026-03-13 01:43:58','Professional'),(98,6,2,'enc:derived-v1:822wq_kjEozHFbMHDZq_oXG6KpDxpR8H_HGLMmY9PeuhoEVcNqMHNsbzWUwuunNlc_IAv-XYas-epAHVj2JqAd8NmbE=','2026-03-13 10:24:18','Student'),(99,6,2,'enc:derived-v1:deWZk4yeUHRlVDWuDdgt5OYVbI2sCyKzIsp9x3emUz9zi6mRtPolCqvVvCOs40xlT2ZpYtvegfTMrAsxHZPF','2026-03-13 10:24:31','Student'),(100,4,14,'enc:derived-v1:fR2Gt94I8r_sIVevbjDv892A5wBtqfKhnCuSTpGC_jvPoO2Sl6ywnr4orMi8GLOb8S56wxktdRkvXWPHzEOzZ8O4bGrRD5CQlqc=','2026-03-13 10:28:08','Professional'),(101,10,5,'enc:derived-v1:U8K2Mm84fjfkCXX6Lsz0gKL7vRKnRrP4LlcNU7-YwNYuh47ZbjUxnkk7COAcRsSvbAZdHHIqO69c-c519ADFiWofgYE=','2026-06-13 20:08:10','Student'),(102,10,5,'enc:derived-v1:Ci-Zdaz-a6jHiMT4337NU4426uOfvHVvgBBi3weVC20L-d__3PaaGW_Br8UrHlOAohOJCpDl2WP-CEOtkSwb1hR3KQ49dCne9QkdDB140fwa604WVUwEofvPCigXhdlA','2026-06-13 20:09:49','Student'),(103,10,5,'enc:derived-v1:Y5cvFTuZSf0JC3evzFdBKvbHMMgcxwY_aILHgpH8-imiD8muj9XKajwHflL9KuBinzYngdpuYlr151Sjelxs96zdxE7gEYUl8t-VCaoIG2NnwxOXcy8c3NylWgYpuSsshMA75zzC','2026-06-13 20:12:24','Professional'),(104,10,5,'enc:derived-v1:MvWBk2CGaWVeND2A4VOoGJ6fuG7GXbLJvbQXbZQ74_QSz0Q9LFht1DXgXu7Tzbxaje-xXYaQ_F4uugSi1uYRN3eIVR23NV6Byfo=','2026-06-13 20:12:44','Professional'),(105,7,5,'enc:derived-v1:aqcW5u7vxi-AoxsQ2cv9Uaksrmo8U9suaw_jV5VvqeY_YPCdlR9AsPLrjajhwMXyFe22yMe_DgtOdIWsicRbVfg5zYk=','2026-06-13 20:24:33','Student'),(106,23,12,'enc:derived-v1:fF5cB2ao_1IkEdODkfiDZjZAIf3VKhbKBWsGxBAwaEkYYnlN_87_yrQBXyUAEfsA0dPLyB4Mi2DLYN9g_WA2Fp4tsxI=','2026-06-13 23:06:34','Student'),(107,23,12,'enc:derived-v1:qHUgUoH_QdRKr0jNUDef4U5KFcRMs6dMwcPZfE4fi5sLfYlUgKfnCi8pqz__YrN2N1gJIrGYuK-eJLpuyW7jaGpaUg==','2026-06-13 23:08:26','Student'),(108,7,5,'enc:derived-v1:vwvacrudyHrOzgkn1oBNLSqnb_oeoub4yn8aPb-Rx5OgsP333_23hn532kERdwoT0TeP1mcBWVKfVsZzQFXABZAJsAT7Kw==','2026-06-14 13:32:07','Student'),(109,7,5,'enc:derived-v1:AyAczqeD7taiwpQUfaeHojlXqhfFXyQdkNZ-KgOV3BufOQ9gEr2mfdopKnC81UY_LUyy6rkhrNbgW-9RJDYCWWA=','2026-06-14 13:37:04','Professional'),(110,7,5,'enc:derived-v1:1BBE9cnh6hNVxSCMU3sYD5vH0qZmubaQ34O39iiYNQu31Ig-UH-yDJj5-UDAlpA=','2026-06-14 13:37:14','Professional'),(111,7,5,'enc:derived-v1:N2I34SJKVq4o5r1fcsfYlETOxNj4rGjq2UbZ0U4QxxyPmSBZa4_UPdcB1tNtnGFXRmIt0p8aOu0DVZqjciI2T4P5gi0n1u-E_HcnoeFgHEQ2cAwwzM8k4BvMTcYaOiA=','2026-06-14 13:44:17','Professional'),(112,7,5,'enc:derived-v1:0ZXEEXmgVE5dymeROCi-2OYgUP3fFWTqbM2YU3JK3FL7BXJE8w74yuFXUbIKA-Z1I849WLeW','2026-06-14 13:57:17','Student'),(113,7,5,'enc:derived-v1:6bwAJIrvcnpTU3LXg0oU-2TKQPFsFCDA20oNn3GpZJEfRx9hqDMOpM12a6ss','2026-06-14 18:30:09','Professional'),(114,7,5,'enc:v1:sBDm18_re04GjM9WXLbKtrehKVk1atmRza7q_QODyGh3Cj36e1eR2fwb-h_apIkkLPQnWMDReOMFjQqakV5r-eOhGQ==','2026-06-14 19:02:16','Student'),(115,24,24,'enc:v1:qZKB97OKCynE09Z6VYsWPAioj2TkAjiLGiUNdv2x5mZUFspqrhghVQOYzstkXTAR0bn7_ZZzdhXv5FMLfhIVPJuPD9g=','2026-06-15 08:29:06','Student'),(116,24,24,'enc:v1:lvr39KV3iUulB3ayQi1WhbFOCIaIm1JxJ107OnKQNZayD3Ttg4lHnmdzNeLi1bRyfgLlsSFewuOveg4nUzK5llvz1g==','2026-06-15 08:29:44','Student'),(117,24,24,'enc:v1:6uguCMp9MmaiIabBJNbhVdCbFnGVhJ99HMwdArYWfM9_AbA_vqTni94NIghE67j7tJisHiM8HqOPZUsExSG4qRSP2Q==','2026-06-15 08:38:22','Student'),(118,24,24,'enc:v1:AaMCW9XcYzFlsORryK_O3vbfyrKn9DIr49hEpIedWP6Lb2M0KlceTMFC22FSoWzDDS9h_8qp8PLUpMxqj1xIxh--fQ==','2026-06-15 08:39:54','Student'),(119,24,11,'enc:v1:MgOq9tNHp45yaidL2vauz0iUSM4cfCoWHSF-GOqLvUx_EUL0ajNM8NxkGeUzizqq7M23lN7W8OTYlWQdhNqCWzI9sv8=','2026-06-15 08:40:14','Student'),(120,23,12,'enc:v1:vcr1Wn4f30oP5Bf0zFe__mBK8DbndTm5REE2GLbm0IPlpJU1SVnLE2QKSELZdwVtIYXOkG4moZkhOQslx2CVsOb_Jw==','2026-06-15 08:42:48','Student'),(121,24,11,'enc:v1:Cxt_NmFpfLzsX84fh6V1AQU5WtsoITh5nIfoll9IUtGOHlmTLkha4o1bPRqPTHW2g4BMIkx-7C7Fzkb_-3fAkV7x2A==','2026-06-15 08:45:12','Student'),(122,25,22,'enc:v1:uXp1EKVd3IPQj3NRQnWNF9cW4za6XEEi5rWWTawTt5bb6xXJYVVKgMIauMopRpfBmes9_mWYxt2cX6_tVmM0Jc5rvkY=','2026-06-15 09:03:58','Student'),(123,25,22,'enc:v1:Eq2dKSPQByfc4SxiMKUMiXmi69UH4di_2heRYBQz6GlGP-SlHCqiNqu7dIpFmikQWPFZ5L7srpgabMKTuFi8uDsPoA==','2026-06-15 09:04:24','Student'),(124,26,11,'enc:v1:56hYBa7TKrM-oRpY-IlzCwaXqCZt35aYdmJ8hZ8RDJh6_IiYovGtyKtJ7QrLgFqO9GkF5DQVCJDXLdhFEXcudrHZj3E=','2026-06-15 10:33:28','Student');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professionalschedule`
--

DROP TABLE IF EXISTS `professionalschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professionalschedule` (
  `ScheduleID` int NOT NULL AUTO_INCREMENT,
  `ProfessionalID` int NOT NULL,
  `AvailableDate` date NOT NULL,
  `TimeSlot` enum('09:00','13:00','16:00') NOT NULL,
  `Status` enum('Available','Booked') DEFAULT NULL,
  PRIMARY KEY (`ScheduleID`),
  UNIQUE KEY `ProfessionalID` (`ProfessionalID`,`AvailableDate`,`TimeSlot`),
  CONSTRAINT `professionalschedule_ibfk_1` FOREIGN KEY (`ProfessionalID`) REFERENCES `mentalhealthprofessionals` (`ProfessionalID`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professionalschedule`
--

LOCK TABLES `professionalschedule` WRITE;
/*!40000 ALTER TABLE `professionalschedule` DISABLE KEYS */;
INSERT INTO `professionalschedule` VALUES (1,1,'2026-02-20','09:00','Booked'),(2,1,'2026-02-26','13:00','Booked'),(3,13,'2026-03-05','13:00','Booked'),(4,14,'2026-03-12','09:00','Booked'),(5,19,'2026-03-13','13:00','Booked'),(6,18,'2026-03-14','16:00','Booked'),(7,17,'2026-03-13','13:00','Booked'),(8,10,'2026-03-16','09:00','Booked'),(9,20,'2026-03-18','13:00','Booked'),(10,3,'2026-03-21','16:00','Booked'),(11,11,'2026-03-17','13:00','Booked'),(12,13,'2026-03-17','09:00','Booked'),(13,19,'2026-03-19','16:00','Booked'),(14,14,'2026-03-16','13:00','Booked'),(15,2,'2026-03-19','16:00','Booked'),(16,6,'2026-03-20','16:00','Booked'),(17,15,'2026-03-18','09:00','Booked'),(18,9,'2026-03-14','16:00','Booked'),(19,7,'2026-03-14','09:00','Booked'),(20,4,'2026-03-23','13:00','Booked'),(21,16,'2026-03-21','13:00','Booked'),(22,21,'2026-03-18','09:00','Booked'),(23,2,'2026-03-17','09:00','Booked'),(24,14,'2026-06-19','09:00','Booked'),(25,5,'2026-06-15','13:00','Booked'),(26,5,'2026-06-14','09:00','Booked'),(27,12,'2026-06-15','09:00','Booked'),(28,5,'2026-06-25','13:00','Booked'),(29,24,'2026-06-16','09:00','Booked'),(30,11,'2026-06-17','09:00','Booked'),(31,22,'2026-06-20','09:00','Booked'),(32,11,'2026-06-18','09:00','Booked');
/*!40000 ALTER TABLE `professionalschedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessionappointments`
--

DROP TABLE IF EXISTS `sessionappointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessionappointments` (
  `AppointmentID` int NOT NULL AUTO_INCREMENT,
  `SessionDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ScheduleID` int NOT NULL,
  `StudentID` int NOT NULL,
  `ProfessionalID` int NOT NULL,
  PRIMARY KEY (`AppointmentID`),
  KEY `ScheduleID` (`ScheduleID`),
  KEY `StudentID` (`StudentID`),
  KEY `ProfessionalID` (`ProfessionalID`),
  CONSTRAINT `sessionappointments_ibfk_1` FOREIGN KEY (`ScheduleID`) REFERENCES `professionalschedule` (`ScheduleID`),
  CONSTRAINT `sessionappointments_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`),
  CONSTRAINT `sessionappointments_ibfk_3` FOREIGN KEY (`ProfessionalID`) REFERENCES `mentalhealthprofessionals` (`ProfessionalID`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessionappointments`
--

LOCK TABLES `sessionappointments` WRITE;
/*!40000 ALTER TABLE `sessionappointments` DISABLE KEYS */;
INSERT INTO `sessionappointments` VALUES (1,'2026-02-20 09:00:00',1,1,1),(2,'2026-02-26 13:00:00',2,2,1),(3,'2026-03-05 13:00:00',3,2,13),(4,'2026-03-12 09:00:00',4,7,14),(5,'2026-03-13 13:00:00',5,15,19),(6,'2026-03-14 16:00:00',6,21,18),(7,'2026-03-13 13:00:00',7,10,17),(8,'2026-03-16 09:00:00',8,9,10),(9,'2026-03-18 13:00:00',9,5,20),(10,'2026-03-21 16:00:00',10,5,3),(11,'2026-03-17 13:00:00',11,11,11),(12,'2026-03-17 09:00:00',12,14,13),(13,'2026-03-19 16:00:00',13,20,19),(14,'2026-03-16 13:00:00',14,4,14),(15,'2026-03-19 16:00:00',15,8,2),(16,'2026-03-20 16:00:00',16,19,6),(17,'2026-03-18 09:00:00',17,12,15),(18,'2026-03-14 16:00:00',18,13,9),(19,'2026-03-14 09:00:00',19,6,7),(20,'2026-03-23 13:00:00',20,22,4),(21,'2026-03-21 13:00:00',21,3,16),(22,'2026-03-18 09:00:00',22,3,21),(23,'2026-03-17 09:00:00',23,6,2),(24,'2026-06-19 09:00:00',24,7,14),(25,'2026-06-15 13:00:00',25,10,5),(26,'2026-06-14 09:00:00',26,7,5),(27,'2026-06-15 09:00:00',27,23,12),(28,'2026-06-25 13:00:00',28,7,5),(29,'2026-06-16 09:00:00',29,24,24),(30,'2026-06-17 09:00:00',30,24,11),(31,'2026-06-20 09:00:00',31,25,22),(32,'2026-06-18 09:00:00',32,26,11);
/*!40000 ALTER TABLE `sessionappointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `StudentID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(255) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`StudentID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'Lisa Kamau','lkamau@gmail.com','$2b$12$3x9.KEhAqezpqOCMSaHJuuHfU8dorc0OetrigpgTsLQARBh3R0ynG','2026-02-08 21:27:39'),(2,'Kylie Wanjiku','kwanjiku@gmail.com','$2b$12$ihEYKLxdOg/fVRRHrMWBgueE6M9SGigRMysLcKAo.JR4Ck1H8Rwwe','2026-02-24 23:35:39'),(3,'Mara Nyambura','Mnyambura@gmail.com','$2b$12$1ueEEvGj3AXNRgv0aAw9QOoUukE0H5RVvkbUMXthouvj1lh3wTp7C','2026-03-11 00:57:22'),(4,'Bella Wanjiru','Bwanjiru@gmail.com','$2b$12$hwt8ZJykDyt/C7O2AjnIeOqPzYGVW/qhGDVy6QbwdYK5My3Dt/Rji','2026-03-11 00:59:00'),(5,'Nicole Otieno','Notieno@gmail.com','$2b$12$V47vwZd24rfn4W9NORCYm.0SEsHucpLz50oAfYtBRK7DKZjHGm.Ve','2026-03-11 01:00:32'),(6,'Crystal Mwake','Cmwake@gmail.com','$2b$12$IwCUo8u1gxAaZFpU69R23u7d1RJ8lHGYDRN3VoTfzh3RBEorA1KUi','2026-03-11 01:02:08'),(7,'Paul Oseke','Poseke@gmail.com','$2b$12$fqeDOBzkIwH1by8ZEM62WuqOYxHHplWh1wI55/rQ6hDwfxPvSv.la','2026-03-11 01:04:43'),(8,'Peter Njau','Pnjau@gmail.com','$2b$12$1gSpt2VwhWoXZGyk52imaueIQoMmr/xgtucSlJHeOAm55NBuFn2Ua','2026-03-11 01:06:40'),(9,'Claude Omolo','comolo@gmail.com','$2b$12$U2lYAqxZOV7HgRZZJkNNzenXdN1idsZ52S9T2ZC7.xOs4zqIgFVAK','2026-03-11 01:08:08'),(10,'Victor Kunde','Vkunde@gmail.com','$2b$12$GKECdQ/Xxm6r2SALozTycusjXP824JXCupHJC2T2WxDOadYVkWEhu','2026-03-11 01:09:43'),(11,'Clara Jean','cjean@gmail.com','$2b$12$3SMsfQyV3DJthqR66EIsb.HKj78tj1gPecHnclA4pjub50FwLnXO.','2026-03-11 01:12:39'),(12,'Eric Mwilu','Emwilu@gmail.com','$2b$12$L9LrSfn.dCJbtWl3Hbi4auTL/1OrOYsdlmVBDMQ6ykuFjsURLwEme','2026-03-11 01:14:26'),(13,'Maria Mumbi','Mmumbi@gmail.com','$2b$12$cm/FRkG5NjauROb9lG./fOYCmjFSqtVPeasbFvdsKwzjKXJi3Cdl2','2026-03-11 01:17:23'),(14,'Whitney Chase','wchase@gmail.com','$2b$12$nKSDFeM9iJaXMbqwsokSauHT5Yk6vfz4nHB10pwqfEu7NdYmgp2ZC','2026-03-11 01:19:33'),(15,'Joseph Ochieng','jochieng@gmail.com','$2b$12$N1RFKl3r/RR.w6ZxysbgrOb5NOVon2Rk22nbJvcNLh9y87M9P3xOa','2026-03-11 01:21:18'),(16,'Abel King','Aking@gmail.com','$2b$12$qMQVmJa8BheghmMd01FFr.0Ot3NPzQ6kZbeAQbb3k/NzsODLVRlJa','2026-03-11 01:23:06'),(17,'Barbara Njeri','Bnjeri@gmail.com','$2b$12$zJ4aEazP.odJvZ/X8/7twud4tzHJY427FKCu4Fav75b51u0GRVivi','2026-03-11 01:25:30'),(18,'Sofia Carson','Scarson@gmail.com','$2b$12$5X5dASBd67QbCWm09hfz4eHJdQNf2UjTPgiEGHrclMU8Q5WuFcQB.','2026-03-11 01:29:57'),(19,'Beatrice Beth','Bbeth@gmail.com','$2b$12$ytZg/W8GadyD.yzhTUza8uB7JgSzTKYsBx7LhMl8NM3wEWDWiFBvC','2026-03-11 01:32:00'),(20,'Laura Adhiambo','ladhiambo@gmail.com','$2b$12$LonovInoEI/zYIkNp6lkhetpJ8oy/Sai1s7qQhXTo1R.sNXA0czxa','2026-03-11 01:33:40'),(21,'Debby Achieng','Dachieng@gmail.com','$2b$12$36XTMmhBpWAbVyMtAqOg6uw1hzDXqBWFg3MaPsTLUk4RCp2zQT8iu','2026-03-11 01:35:10'),(22,'Wendy Wanjiku','Wwanjiku@gmail.com','$2b$12$1j48ISFIVKheUhv4UiLAfuyOcZqk5uvn00Rzc4AQNUX.Udv5XRHfG','2026-03-11 01:36:45'),(23,'Ester Maina','EMaina@gmail.com','$2b$12$Cpy6odSaOnZWI/5lJOv6J.hDufpr/mAmHaXDgSB7ZrQ.ZQuoLQc/6','2026-06-13 22:53:22'),(24,'Gerald Otieno','GOtieno@gmail.com','$2b$12$edtHOttwQVQVthvprd2UDOSX7Xc8s6tuZBHAgJSmUw6AOo4n0G/Om','2026-06-15 08:28:26'),(25,'Phillip Owere','Philo@gmail.com','$2b$12$csHUYanmr1dBnvcsPKeEN.gx/Bjqjtl9MFr3aMBIhzXWJUMUFS6Hu','2026-06-15 09:03:22'),(26,'Chantel Gathunguri','cgathunguri@gmail.com','$2b$12$79edy8sLuI7JN7pbgmcpOOnauVm6zUGT4sRLiZgTRCWqN/vWsea5m','2026-06-15 10:31:21');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verificationdocuments`
--

DROP TABLE IF EXISTS `verificationdocuments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verificationdocuments` (
  `DocumentID` int NOT NULL AUTO_INCREMENT,
  `ProfessionalID` int NOT NULL,
  `FilePath` varchar(500) NOT NULL,
  `OriginalFileName` varchar(255) NOT NULL,
  `UploadedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `FileSize` int DEFAULT NULL,
  `MimeType` varchar(100) DEFAULT NULL,
  `FileHash` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`DocumentID`),
  KEY `idx_verification_professional` (`ProfessionalID`),
  KEY `idx_verification_uploaded` (`UploadedAt`),
  CONSTRAINT `verificationdocuments_ibfk_1` FOREIGN KEY (`ProfessionalID`) REFERENCES `mentalhealthprofessionals` (`ProfessionalID`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verificationdocuments`
--

LOCK TABLES `verificationdocuments` WRITE;
/*!40000 ALTER TABLE `verificationdocuments` DISABLE KEYS */;
INSERT INTO `verificationdocuments` VALUES (3,1,'uploads\\verification_documents\\professional_1_20260208_221730.pdf','OPERATIONAL LICENSE.pdf','2026-02-08 22:17:30',NULL,NULL,NULL),(4,2,'uploads\\verification_documents\\professional_2_20260301_214530.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 21:45:30',NULL,NULL,NULL),(5,2,'uploads\\verification_documents\\professional_2_20260301_214953.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 21:49:53',NULL,NULL,NULL),(6,2,'uploads\\verification_documents\\professional_2_20260301_215223.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 21:52:23',NULL,NULL,NULL),(7,2,'uploads\\verification_documents\\professional_2_20260301_215553.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 21:55:53',NULL,NULL,NULL),(8,6,'uploads\\verification_documents\\professional_6_20260301_222356.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 22:23:56',NULL,NULL,NULL),(9,7,'uploads\\verification_documents\\professional_7_20260301_222652.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 22:26:52',NULL,NULL,NULL),(10,8,'uploads\\verification_documents\\professional_8_20260301_223613.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 22:36:13',NULL,NULL,NULL),(11,9,'uploads\\verification_documents\\professional_9_20260301_224223.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 22:42:23',NULL,NULL,NULL),(12,10,'uploads\\verification_documents\\professional_10_20260301_224602.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 22:46:02',NULL,NULL,NULL),(13,11,'uploads\\verification_documents\\professional_11_20260301_224856.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 22:48:56',NULL,NULL,NULL),(14,12,'uploads\\verification_documents\\professional_12_20260301_225243.pdf','OPERATIONAL LICENSE.pdf','2026-03-01 22:52:43',NULL,NULL,NULL),(15,13,'uploads\\verification_documents\\professional_13_20260302_002126.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:21:26',NULL,NULL,NULL),(16,14,'uploads\\verification_documents\\professional_14_20260302_002359.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:23:59',NULL,NULL,NULL),(17,15,'uploads\\verification_documents\\professional_15_20260302_002611.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:26:11',NULL,NULL,NULL),(18,16,'uploads\\verification_documents\\professional_16_20260302_002906.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:29:06',NULL,NULL,NULL),(19,17,'uploads\\verification_documents\\professional_17_20260302_003145.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:31:45',NULL,NULL,NULL),(20,18,'uploads\\verification_documents\\professional_18_20260302_003349.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:33:49',NULL,NULL,NULL),(21,19,'uploads\\verification_documents\\professional_19_20260302_003545.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:35:45',NULL,NULL,NULL),(22,20,'uploads\\verification_documents\\professional_20_20260302_003757.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:37:57',NULL,NULL,NULL),(23,21,'uploads\\verification_documents\\professional_21_20260302_004009.pdf','OPERATIONAL LICENSE.pdf','2026-03-02 00:40:10',NULL,NULL,NULL),(24,22,'uploads\\verification_documents\\professional_22_20260313_114615_20a6f9c1.pdf','OPERATIONAL LICENSE.pdf','2026-03-13 11:46:16',186665,'application/pdf','2ff9920a45354e5500bcbcc7d148ab88ea8624cee7eae1d884e18e79e28533e5'),(25,23,'uploads\\verification_documents\\professional_23_20260613_233324_6f842a35.pdf','OPERATIONAL LICENSE.pdf','2026-06-13 23:33:24',NULL,NULL,NULL),(26,24,'uploads\\verification_documents\\professional_24_20260615_082356_82b05b20.pdf','OPERATIONAL LICENSE.pdf','2026-06-15 08:23:56',NULL,NULL,NULL);
/*!40000 ALTER TABLE `verificationdocuments` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-26 15:32:25
