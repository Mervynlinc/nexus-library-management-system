# Nexus Library Management System

## Overview
The Nexus Library Management System is a comprehensive platform designed to digitize and automate the core workflows of a modern library facility. The primary objective is to implement a robust Client-Server architecture that handles library transactions and self-service features for patrons.

At its core, the system models a book loan as a long-duration transaction processing system. Unlike simple stateless requests, a library loan operates across an asynchronous, multi-week transaction cycle:
1. **Initiation:** Book requested and issued.
2. **Active State:** Loan is active and monitored against a due date.
3. **Resolution:** Book is returned, or the state transitions to 'Overdue', triggering a fine assessment process.

The architecture ensures state durability and concurrency are maintained across days or months without persistently locking system resources.

## Technology Stack
To achieve a decoupled and scalable client-server relationship, the project utilizes the following technologies:
* **Frontend (Client Side):** JavaScript / React.js/ Next.js (HTML5, CSS3) - Provides a responsive, single-page application experience for patrons.
* **Backend API (Server Side):** JavaScript / Node.js with Express.js - Facilitates a lightweight, non-blocking REST API to manage business logic, routing, and database communication.
* **Database:** PostgreSQL - A highly reliable relational database suited for managing the complex states of long-duration asset transactions.

## Database System Justification
PostgreSQL was selected to rigorously prevent race conditions, ensuring a single physical copy cannot be loaned to two patrons simultaneously.
* **ACID Compliance:** Guarantees Atomicity, Consistency, Isolation, and Durability. This ensures that if a checkout process fails midway, the entire transaction is rolled back, preventing corrupted inventory states.
* **Multi-Version Concurrency Control (MVCC):** Allows the system to handle multiple simultaneous read and write requests (e.g., hundreds of students searching the catalog while returns are processed) without strict database locks that bottleneck performance.

## User Interfaces
The system provides the following primary user interfaces for the web application:
* **Catalog Search & Discovery (OPAC):** Interface for searching books by title, author, or ISBN.
* **Book Detail & Reservation Screen:** Displays real-time availability and allows logged-in patrons to reserve physical copies.
* **Patron Dashboard:** A user portal tracking active loans, upcoming due dates, and any accrued overdue fines.

## Development Roadmap
The project will be executed across the following phases:
1. **Database & API Foundation:** Finalizing the PostgreSQL entity-relationship schema, initializing the database, and setting up the core Express.js server routes and connection pools.
2. **Mockups & Client Interfaces:** Drafting visual mockups, building responsive React wireframes, and linking them to the backend API.
3. **Transaction Logic & Authentication:** Implementing the state transition handlers for long-duration loans, automated fine processing logic, and role-based access control.
4. **Integration & Delivery:** Conducting end-to-end integration testing, resolving edge cases, and finalizing the project report.

## Project Information
* **Group:** Nexus
* **Author:** Namanya Mervyn
README.md
Displaying README.md.