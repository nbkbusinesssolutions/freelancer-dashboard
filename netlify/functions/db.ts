import { neon } from "@neondatabase/serverless";

export function getDb() {
  // Support both Netlify's Neon integration and manual DATABASE_URL
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Database connection string not found. Set NETLIFY_DATABASE_URL or DATABASE_URL.");
  }
  const sql = neon(connectionString);
  return sql;
}

export function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  // Handle Date objects - convert to ISO string
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj !== "object") return obj;
  
  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = obj[key];
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      converted[camelKey] = value.toISOString();
    } else {
      converted[camelKey] = snakeToCamel(value);
    }
  }
  return converted;
}

export function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  // Keep Date objects as-is for database insertion
  if (obj instanceof Date) return obj;
  if (typeof obj !== "object") return obj;
  
  const converted: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    converted[snakeKey] = camelToSnake(obj[key]);
  }
  return converted;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
