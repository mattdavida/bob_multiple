const express = require("express");
const router = express.Router();
const updateScript = require("./updateScript");
router.post("/", async function (req, res, next) {
  const dates = req.body;
  console.log("RUN UPDATE SCRIPT FOR: ", dates);
  for (const date of dates) {
    await updateScript(date);
  }
  res.send("Timesheet updated");
});

module.exports = router;
