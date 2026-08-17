# 📦 Warehouse Inventory

A simple web application for managing and tracking warehouse consumable inventory.

The goal of this project is to create a lightweight and intuitive tool that allows warehouse employees to quickly check current stock levels and update quantities when materials are used or received.

🎯 Project Goal

The application will be used to track consumable materials such as:

* 📦 Boxes of different sizes
* 📏 Large and small foil
* 🟦 Packing tape
* 🏷️ Labels
* 🛍️ Bags
* 🧤 Other warehouse supplies

Each employee will be able to log in using a username and password and update inventory quantities.

Changes will be synchronized automatically between users so everyone can see the current stock level.

🚀 Planned Features

* Login with username + password
* Worker and Admin roles
* Inventory overview
* Increase/decrease quantities using + / −
* Manual quantity editing
* Real-time synchronization between users
* Change history / audit log
* Low-stock notifications
* Search and filtering
* Material management
* User management
* Docker Compose development environment
* Production deployment
* CI/CD
* Automated database backups
* Monitoring

🛠️ Planned Tech Stack

Frontend

* React / Next.js
* TypeScript
* Tailwind CSS

Backend

* Node.js
* Next.js API / REST API

Database

* PostgreSQL

Infrastructure

* Docker
* Docker Compose
* Nginx
* AWS
* Terraform

CI/CD

* GitHub Actions

🏗️ Planned Architecture

                    Internet
                       │
                       ▼
                  Cloudflare / DNS
                       │
                     HTTPS
                       │
                       ▼
                    AWS EC2
                       │
                     Nginx
                       │
              ┌────────┴────────┐
              │                 │
           Frontend          Backend
                                │
                                ▼
                           PostgreSQL
                                │
                                ▼
                               S3
                            Backups

The application will initially be developed and tested locally using Docker Compose.

After the MVP is completed, it will be prepared for a production-like deployment on AWS.

🔐 Security

The application will include:

* User authentication
* Role-based access control
* Secure sessions
* Password hashing
* Protected API endpoints
* Audit logs
* HTTPS
* AWS infrastructure security

Unauthenticated users will not be able to access inventory data or modify any data.

📅 Project Status

🚧 Currently in development

The first functional version is planned for early September 2026.

The project will be developed step by step, starting with a simple MVP and gradually moving towards a production-like deployment.

🔮 Future Ideas

Possible future improvements:

* QR / barcode scanning
* Mobile camera scanning
* Usage statistics
* Automatic low-stock alerts
* Excel / CSV export
* Multiple warehouses
* Moving inventory between warehouses
* Automatic restock requests

⸻

Warehouse Inventory — simple inventory tracking, better visibility, and less manual work. 📦
