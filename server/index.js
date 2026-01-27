import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/debug/supabase", async (req, res) => {
  const { data, error } = await supabase
    .from("account_vault")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data || []);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export { supabase };
