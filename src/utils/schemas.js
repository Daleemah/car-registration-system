const { z } = require("zod");

const VEHICLE_CLASSES = [
  "motorcycle",
  "private",
  "commercial",
  "heavy_duty",
  "government",
];

// ─── Registration Schemas ────────────────────────────────────────────────────

const createRegistrationSchema = z.object({
  vehicle: z.object({
    vin: z.string().min(5).max(17),
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    color: z.string().min(1),
    engineCapacity: z.number().min(0).optional(),
    vehicleClass: z.enum(VEHICLE_CLASSES),
    chassisNumber: z.string().optional(),
  }),
  owner: z.object({
    fullName: z.string().min(2),
    address: z.string().min(5),
    phone: z.string().min(7),
    email: z.string().email().optional(),
    nationalId: z.string().optional(),
  }),
});

const updateRegistrationSchema = z.object({
  vehicle: z.object({
    vin: z.string().min(5).max(17).optional(),
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    color: z.string().min(1).optional(),
    engineCapacity: z.number().min(0).optional(),
    vehicleClass: z.enum(VEHICLE_CLASSES).optional(),
    chassisNumber: z.string().optional(),
  }).optional(),
  owner: z.object({
    fullName: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    phone: z.string().min(7).optional(),
    email: z.string().email().optional(),
    nationalId: z.string().optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

const approveSchema = z.object({
  notes: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});

const renewSchema = z.object({
  paymentReference: z.string().min(3, "Payment reference is required"),
});

const paymentSchema = z.object({
  paymentReference: z.string().min(3, "Payment reference is required"),
  amount: z.number().positive("Amount must be positive"),
});

// ─── Auth Schemas ────────────────────────────────────────────────────────────

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(7, "Phone number must be at least 7 characters"),
  address: z.string().optional(),
  nin: z.string().optional(),
  role: z.enum(["admin", "staff", "user"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  address: z.string().min(5).optional(),
  nin: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

module.exports = {
  // Registration schemas
  createRegistrationSchema,
  updateRegistrationSchema,
  approveSchema,
  rejectSchema,
  renewSchema,
  paymentSchema,
  
  // Auth schemas
  registerSchema,
  loginSchema,
  updateProfileSchema,
  
  // Export enums for reuse
  VEHICLE_CLASSES,
};