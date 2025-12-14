---
trigger: always_on
---

***

# Vehicle & Trip Dashboard – Minimal MVP (No Clients, No Drivers)

## 1. Goal

Build a simple internal web app to track vehicles and trips for a small agency.  
Only two main entities: `vehicles` and `trips`.[1][2]

Tech stack: Next.js (App Router) + Firebase Auth + Firestore.

***

## 2. Firestore Data Model

### 2.1 Vehicles

Collection: `vehicles`[3][4]

Fields:

- `id` (string, doc id)  
- `numberPlate` (string) – e.g., “TN 01 AB 1234”  
- `type` (string) – “Sedan”, “SUV”, “Tempo Traveller”, etc.  
- `seats` (number)  
- `ac` (boolean)  
- `ownerType` (string) – `"self"` or `"vendor"`  
- `fuelType` (string) – “Petrol”, “Diesel”, “CNG”, “EV”  
- `insuranceExpiry` (timestamp, optional)  
- `permitExpiry` (timestamp, optional)  
- `status` (string) – `"active"`, `"inactive"`  

### 2.2 Trips

Collection: `trips`[5][6]

Fields:

- `id` (string, doc id)  
- `vehicleId` (string, ref to `vehicles`)  
- `tripDate` (timestamp – pickup date/time)  
- `pickupLocation` (string)  
- `dropLocation` (string)  
- `tripType` (string) – `"local"`, `"outstation"`, `"airport"`  
- `estimatedKms` (number, optional)  
- `estimatedHours` (number, optional)  
- `baseRate` (number)  
- `extraCharges` (number, optional, default 0)  
- `totalAmount` (number) – `baseRate + extraCharges`  
- `paymentStatus` (string) – `"unpaid"`, `"partial"`, `"paid"`  
- `paymentMode` (string, optional) – `"cash"`, `"upi"`, `"bank"`  
- `status` (string) – `"new"`, `"scheduled"`, `"running"`, `"completed"`, `"cancelled"`  
- `notes` (string, optional)  
- `createdAt` (timestamp, server)  
- `updatedAt` (timestamp, server)  

***

## 3. Screens / Pages

### 3.1 Auth

- Firebase email/password login.  
- Redirect to `/dashboard` after login.[7][8]

### 3.2 Dashboard (Home)

Route: `/dashboard`[1][9]

Show:

- Summary cards:
  - `totalVehicles`  
  - `activeVehicles`  
  - `todayTripsCount`  
  - `todayRevenue` (sum of `totalAmount` for today with `status = completed`)  
- Today’s trips table:
  - Columns: Time, Vehicle (numberPlate), Trip Type, Pickup → Drop, Total Amount, Status, Payment Status.  
- Upcoming expiries widget:
  - Vehicles with `insuranceExpiry` or `permitExpiry` within next 30 days (list).  

### 3.3 Vehicles Page

Route: `/vehicles`[3][4]

Features:

- Table: Number plate, Type, Seats, Status, Insurance Expiry, Permit Expiry.  
- Filters: Status (`active` / `inactive`).  
- Actions:
  - Add Vehicle (form).  
  - Edit Vehicle.  
  - Delete Vehicle.  

### 3.4 Trips Page

Route: `/trips`[5][6]

Features:

- Table: Date, Vehicle (numberPlate from `vehicleId`), Trip Type, Pickup → Drop, Total Amount, Status, Payment Status.  
- Filters:
  - Date range (from–to).  
  - Vehicle (dropdown).  
  - Status (e.g., completed, cancelled).  
- Add Trip form:
  - Select Vehicle (dropdown from `vehicles` where `status = active`).  
  - tripDate, pickupLocation, dropLocation, tripType.  
  - estimatedKms, estimatedHours (optional).  
  - baseRate, extraCharges, auto-calc totalAmount.  
  - status default `"scheduled"`, paymentStatus default `"unpaid"`.  

***

## 4. Minimal Reporting

Client-side aggregations from `trips`.[9][4]

- Date range summary:
  - Input: startDate, endDate.  
  - Outputs:
    - totalTrips  
    - totalRevenue (sum of `totalAmount` for `status = completed`)  
    - trips list in that range.  
- Vehicle utilization (simple):
  - Trips count per `vehicleId` in selected date range.  

***

## 5. Non-functional

- Responsive UI (desktop + mobile).  
- Simple, clean layout (basic table + forms; no complex charts required for v1).  
- Firestore Security Rules: only authenticated users can read/write.  

***
