-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "jobTitle" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "memberId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT,
    "dateOfBirth" TEXT,
    "address" TEXT,
    "passwordHash" TEXT,
    "photo" TEXT NOT NULL DEFAULT '',
    "joinDate" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "membershipType" TEXT NOT NULL DEFAULT 'Paid',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "emergencyContact" JSONB NOT NULL DEFAULT '{}',
    "medicalHistory" JSONB NOT NULL DEFAULT '[]',
    "gender" TEXT,
    "occupation" TEXT,
    "alcoholic" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "aadhaar" TEXT,
    "idProofUrl" TEXT,
    "qrCodeValue" TEXT NOT NULL DEFAULT '',
    "weightHistory" JSONB NOT NULL DEFAULT '[]',
    "measurementsHistory" JSONB NOT NULL DEFAULT '[]',
    "bmi" REAL NOT NULL DEFAULT 0,
    "bodyFat" REAL NOT NULL DEFAULT 0,
    "progressImages" JSONB NOT NULL DEFAULT '[]',
    "workoutPlan" JSONB NOT NULL DEFAULT '[]',
    "dietPlan" JSONB NOT NULL DEFAULT '[]',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "features" JSONB NOT NULL,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "invoiceNo" TEXT NOT NULL,
    "referenceNo" TEXT,
    "membershipId" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT,
    "expectedAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "vendor" TEXT,
    "paidBy" TEXT,
    "receipt" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Paid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "photo" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "date" TEXT NOT NULL,
    "checkIn" TEXT NOT NULL,
    "checkOut" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'On Time',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "salary" REAL NOT NULL,
    "shift" TEXT NOT NULL,
    "joiningDate" TEXT NOT NULL,
    "attendanceRate" INTEGER NOT NULL DEFAULT 100,
    "performance" INTEGER NOT NULL DEFAULT 4,
    "leavesRemaining" INTEGER NOT NULL DEFAULT 12,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "salaryHistory" JSONB NOT NULL DEFAULT '[]',
    "tasks" JSONB NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "costPrice" REAL NOT NULL,
    "supplier" TEXT NOT NULL,
    "lowStockLimit" INTEGER NOT NULL,
    "image" TEXT,
    "salesCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "message" TEXT,
    "interestedPlan" TEXT,
    "subject" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WebsiteSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QrToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PasswordOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_aadhaar_key" ON "Member"("aadhaar");

-- CreateIndex
CREATE UNIQUE INDEX "QrToken_token_key" ON "QrToken"("token");

-- CreateIndex
CREATE INDEX "PasswordOtp_email_used_createdAt_idx" ON "PasswordOtp"("email", "used", "createdAt");
