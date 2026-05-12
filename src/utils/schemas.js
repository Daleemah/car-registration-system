const { z } = require("zod");

const VEHICLE_CLASSES = [
  "motorcycle",
  "private",
  "commercial",
  "heavy_duty",
  "government",
];

// ─── Registration ────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  vin: z.string().min(5).max(17),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1),
  engineCapacity: z.number().min(0).optional(),
  vehicleClass: z.enum(VEHICLE_CLASSES),
  chassisNumber: z.string().optional(),
});

const ownerSchema = z.object({
  fullName: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  nationalId: z.string().optional(),
});

const createRegistrationSchema = z.object({
  vehicle: vehicleSchema,
  owner: ownerSchema,
});

const updateRegistrationSchema = z.object({
  vehicle: vehicleSchema.partial().optional(),
  owner: ownerSchema.partial().optional(),
});

const approveSchema = z.object({
  notes: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});

const renewSchema = z.object({
  paymentReference: z.string().min(3),
});

const paymentSchema = z.object({
  paymentReference: z.string().min(3),
  amount: z.number().positive(),
});

// ─── Auth ────────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

module.exports = {
  createRegistrationSchema,
  updateRegistrationSchema,
  approveSchema,
  rejectSchema,
  renewSchema,
  paymentSchema,
  registerSchema,
  loginSchema,
};
