CREATE DATABASE IF NOT EXISTS Better_Space;
USE  Better_Space;

DROP TABLE IF EXISTS AdminMessages;
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS FeedbackRatings;
DROP TABLE IF EXISTS SessionAppointments;
DROP TABLE IF EXISTS ProfessionalSchedule;
DROP TABLE IF EXISTS MentalHealthProfessionals;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Admins;

CREATE TABLE Students (
    StudentID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE MentalHealthProfessionals (
    ProfessionalID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Category ENUM(
        'General Mental Health',
        'Depression & Anxiety',
        'Trauma',
        'Substance Abuse',
        'Marriage & Family',
        'pastoral counsellors',
        'peer specialist'
    ) NOT NULL,
    VerificationStatus ENUM('Pending', 'Verified', 'Rejected') NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE VerificationDocuments (
    DocumentID INT AUTO_INCREMENT PRIMARY KEY,
    ProfessionalID INT NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    OriginalFileName VARCHAR(255) NOT NULL,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ProfessionalID)
        REFERENCES MentalHealthProfessionals(ProfessionalID)
);
CREATE TABLE ProfessionalSchedule (
    ScheduleID INT AUTO_INCREMENT PRIMARY KEY,
    ProfessionalID INT NOT NULL,
    AvailableDate DATE NOT NULL,
    TimeSlot ENUM('09:00','13:00','16:00') NOT NULL,
    Status ENUM('Available','Booked'),
    FOREIGN KEY (ProfessionalID)
        REFERENCES MentalHealthProfessionals(ProfessionalID),
    UNIQUE (ProfessionalID, AvailableDate, TimeSlot)
);
CREATE TABLE SessionAppointments (
    AppointmentID INT AUTO_INCREMENT PRIMARY KEY,
    SessionDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ScheduleID INT NOT NULL,
    StudentID INT NOT NULL,
    ProfessionalID INT NOT NULL,
    FOREIGN KEY (ScheduleID)
        REFERENCES ProfessionalSchedule(ScheduleID),
    FOREIGN KEY (StudentID)
        REFERENCES Students(StudentID),
    FOREIGN KEY (ProfessionalID)
        REFERENCES MentalHealthProfessionals(ProfessionalID)
);
CREATE TABLE FeedbackRatings (
    FeedbackID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID INT NOT NULL,
    ProfessionalID INT NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    FeedbackText TEXT,
    FOREIGN KEY (StudentID)
        REFERENCES Students(StudentID),
    FOREIGN KEY (ProfessionalID)
        REFERENCES MentalHealthProfessionals(ProfessionalID)
);
CREATE TABLE Messages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID INT NOT NULL,
    ProfessionalID INT NOT NULL,
    MessageText TEXT NOT NULL,
    SentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Sender ENUM('Student', 'Professional') NOT NULL,
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (ProfessionalID) REFERENCES MentalHealthProfessionals(ProfessionalID)
);
CREATE TABLE Admins (
    AdminID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(250) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AdminMessages (
    AdminMessageID INT AUTO_INCREMENT PRIMARY KEY,
    AdminID INT NOT NULL,
    StudentID INT NULL,
    ProfessionalID INT NULL,
    MessageText TEXT NOT NULL,
    SentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Sender ENUM('Student', 'Professional', 'Admin') NOT NULL,
    FOREIGN KEY (AdminID) REFERENCES Admins(AdminID),
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (ProfessionalID) REFERENCES MentalHealthProfessionals(ProfessionalID)
);




